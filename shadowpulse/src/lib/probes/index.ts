import { computeVisibilityScore } from "../score";
import type { Platform, PlatformReport } from "../types";
import { facebookAdapter } from "./facebook";
import { instagramAdapter } from "./instagram";
import { threadsAdapter } from "./threads";
import { tiktokAdapter } from "./tiktok";
import type { PlatformAdapter } from "./types";
import { xAdapter } from "./x";

const adapters: Record<Platform, PlatformAdapter> = {
  x: xAdapter,
  instagram: instagramAdapter,
  tiktok: tiktokAdapter,
  facebook: facebookAdapter,
  threads: threadsAdapter,
};

export async function runPlatformScan(
  platform: Platform,
  handle: string,
): Promise<PlatformReport> {
  const adapter = adapters[platform];
  const { account, signals, earlyStopReason } = await adapter.run({
    handle,
    signal: new AbortController().signal,
  });
  const { score, measurableCount, totalSignals } =
    computeVisibilityScore(signals);

  return {
    platform,
    account,
    signals,
    visibilityScore: score,
    measurableCount,
    totalSignals,
    earlyStopReason,
  };
}

export async function runScan(
  handle: string,
  platforms: Platform[],
): Promise<PlatformReport[]> {
  return Promise.all(platforms.map((p) => runPlatformScan(p, handle)));
}
