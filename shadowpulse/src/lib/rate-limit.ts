type Bucket = { count: number; resetAt: number };

const ipDaily = new Map<string, Bucket>();
const handleCooldown = new Map<string, number>();

const DAY_MS = 24 * 60 * 60 * 1000;
const HANDLE_COOLDOWN_MS = 3 * 60 * 1000;
const FREE_DAILY_LIMIT = 5;

function prune(map: Map<string, Bucket>, now: number) {
  for (const [key, bucket] of map) {
    if (bucket.resetAt <= now) map.delete(key);
  }
}

export function checkRateLimit(ipHash: string, handleKey: string): {
  ok: boolean;
  reason?: "daily_limit" | "handle_cooldown";
  retryAfterSec?: number;
} {
  const now = Date.now();
  prune(ipDaily, now);

  const cooledUntil = handleCooldown.get(handleKey);
  if (cooledUntil && cooledUntil > now) {
    return {
      ok: false,
      reason: "handle_cooldown",
      retryAfterSec: Math.ceil((cooledUntil - now) / 1000),
    };
  }

  let bucket = ipDaily.get(ipHash);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + DAY_MS };
    ipDaily.set(ipHash, bucket);
  }

  if (bucket.count >= FREE_DAILY_LIMIT) {
    return {
      ok: false,
      reason: "daily_limit",
      retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  return { ok: true };
}

export function consumeRateLimit(ipHash: string, handleKey: string) {
  const now = Date.now();
  let bucket = ipDaily.get(ipHash);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + DAY_MS };
  }
  bucket.count += 1;
  ipDaily.set(ipHash, bucket);
  handleCooldown.set(handleKey, now + HANDLE_COOLDOWN_MS);
}

export async function hashIp(ip: string): Promise<string> {
  const data = new TextEncoder().encode(`shadowpulse:${ip}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}
