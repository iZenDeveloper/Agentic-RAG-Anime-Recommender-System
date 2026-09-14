import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { saveAlertInterest } from "@/lib/store";

const schema = z.object({
  email: z.string().email().max(200),
  handle: z.string().min(1).max(100),
  platforms: z.array(z.string()).max(5),
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  saveAlertInterest(parsed.data);
  return NextResponse.json({ ok: true });
}
