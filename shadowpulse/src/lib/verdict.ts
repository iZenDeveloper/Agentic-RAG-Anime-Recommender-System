import type { SignalResult } from "./types";

/** Primary user-facing answer: banned or not (or can't tell). */
export type Verdict = "not_banned" | "restricted" | "unclear";

/**
 * Restricted if any measurable signal is restricted.
 * Not banned if every measurable signal is clear.
 * Unclear when nothing measurable (all inconclusive / N/A).
 */
export function computeVerdict(signals: SignalResult[]): Verdict {
  const measurable = signals.filter(
    (s) => s.status === "clear" || s.status === "restricted",
  );
  if (measurable.length === 0) return "unclear";
  if (measurable.some((s) => s.status === "restricted")) return "restricted";
  return "not_banned";
}
