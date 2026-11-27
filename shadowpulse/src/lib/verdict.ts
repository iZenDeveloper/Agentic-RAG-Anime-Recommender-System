import type { SignalResult } from "./types";

/**
 * Primary user-facing answer.
 * not_found = handle does not resolve (never treat as "banned").
 * restricted = real restriction / suspension signal.
 */
export type Verdict = "not_banned" | "restricted" | "not_found" | "unclear";

/**
 * Prefer account identity truth first, then visibility signals.
 * Missing accounts must never roll up to Restricted/Banned.
 */
export function computeVerdict(signals: SignalResult[]): Verdict {
  const hasClear = signals.some((s) => s.status === "clear");
  const hasRestricted = signals.some((s) => s.status === "restricted");
  const hasNotFound = signals.some((s) => s.status === "not_found");

  // Confirmed missing, and nothing proves a live public account / restriction.
  if (hasNotFound && !hasClear && !hasRestricted) return "not_found";

  if (hasRestricted) return "restricted";
  if (hasClear) return "not_banned";
  return "unclear";
}
