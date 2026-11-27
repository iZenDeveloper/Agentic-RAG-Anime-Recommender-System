import type { SignalResult } from "./types";

/** Visibility score only from Clear/Restricted; Inconclusive excluded from denominator. */
export function computeVisibilityScore(signals: SignalResult[]): {
  score: number | null;
  measurableCount: number;
  totalSignals: number;
} {
  const applicable = signals.filter(
    (s) => s.status !== "not_applicable" && s.status !== "not_found",
  );
  const measurable = applicable.filter(
    (s) => s.status === "clear" || s.status === "restricted",
  );

  if (measurable.length === 0) {
    return {
      score: null,
      measurableCount: 0,
      totalSignals: applicable.length,
    };
  }

  const clearWeight = measurable.filter((s) => s.status === "clear").length;
  const score = Math.round((clearWeight / measurable.length) * 100);

  return {
    score,
    measurableCount: measurable.length,
    totalSignals: applicable.length,
  };
}
