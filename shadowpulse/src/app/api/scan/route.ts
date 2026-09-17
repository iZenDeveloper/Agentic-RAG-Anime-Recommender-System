import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  detectPlatformFromUrl,
  normalizeHandle,
  validateHandle,
} from "@/lib/normalize";
import { runScan } from "@/lib/probes";
import { checkRateLimit, consumeRateLimit, hashIp } from "@/lib/rate-limit";
import { saveJob } from "@/lib/store";
import type { Platform, ScanJob } from "@/lib/types";

export const runtime = "nodejs";

const bodySchema = z.object({
  handle: z.string().min(1).max(200),
  platforms: z
    .array(z.enum(["x", "instagram", "tiktok", "facebook", "threads"]))
    .min(1)
    .max(5),
});

export async function POST(req: NextRequest) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const rawHandle = parsed.data.handle.trim();
  const detected = detectPlatformFromUrl(rawHandle);
  let platforms = parsed.data.platforms as Platform[];
  if (detected && !platforms.includes(detected)) {
    platforms = [detected, ...platforms].slice(0, 5);
  }

  // Normalize against primary platform (first selected)
  const primary = platforms[0]!;
  const handleNorm = normalizeHandle(rawHandle, primary);

  for (const p of platforms) {
    const h = normalizeHandle(rawHandle, p);
    if (!validateHandle(h, p)) {
      return NextResponse.json(
        { error: "invalid_handle", platform: p, handle: h },
        { status: 400 },
      );
    }
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "local";
  const ipHash = await hashIp(ip);
  const handleKey = `${platforms.sort().join(",")}:${handleNorm}`;
  const limit = checkRateLimit(ipHash, handleKey);
  if (!limit.ok) {
    return NextResponse.json(
      {
        error: "rate_limited",
        reason: limit.reason,
        retryAfterSec: limit.retryAfterSec,
      },
      { status: 429 },
    );
  }

  consumeRateLimit(ipHash, handleKey);

  const createdAt = new Date();
  const job: ScanJob = {
    id: nanoid(12),
    handleNorm,
    platforms,
    status: "running",
    createdAt: createdAt.toISOString(),
    reports: [],
    shareToken: nanoid(18),
    shareExpiresAt: new Date(createdAt.getTime() + 24 * 60 * 60 * 1000).toISOString(),
  };

  try {
    const reports = await runScan(handleNorm, platforms);
    job.reports = reports;
    job.status = "done";
    job.finishedAt = new Date().toISOString();
    saveJob(job);
    return NextResponse.json({ job });
  } catch {
    job.status = "failed";
    job.finishedAt = new Date().toISOString();
    saveJob(job);
    return NextResponse.json({ error: "scan_failed", job }, { status: 500 });
  }
}
