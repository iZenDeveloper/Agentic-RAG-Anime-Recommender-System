"use client";

import type { Platform, SignalResult, SignalStatus } from "@/lib/types";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

const STATUS_LABEL: Record<SignalStatus, "statusClear" | "statusRestricted" | "statusInconclusive" | "statusNA"> = {
  clear: "statusClear",
  restricted: "statusRestricted",
  inconclusive: "statusInconclusive",
  not_applicable: "statusNA",
};

export function SignalCard({
  signal,
  locale,
}: {
  signal: SignalResult;
  locale: Locale;
}) {
  return (
    <article className="rounded-2xl border border-[var(--line)] bg-white/[0.03] p-4 backdrop-blur-sm transition hover:border-white/20">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span
          className={`rounded-md border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide status-${signal.status}`}
        >
          {t(locale, STATUS_LABEL[signal.status])}
        </span>
        <span className="text-xs text-[var(--muted)]">
          {t(locale, "confidence")}: {signal.confidence}
        </span>
        <span className="ml-auto font-mono text-[10px] text-[var(--muted)]">
          {signal.signalKey}
        </span>
      </div>
      <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold">
        {signal.label}
      </h3>
      <p className="mt-2 text-sm text-[var(--muted)]">
        <span className="text-[var(--ink)]/80">{t(locale, "method")}: </span>
        {signal.evidence.method}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-[var(--ink)]/90">
        {signal.evidence.observed}
      </p>
      {signal.evidence.manualUrl ? (
        <a
          href={signal.evidence.manualUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex text-sm text-[var(--signal)] underline-offset-4 hover:underline"
        >
          {t(locale, "openManual")} →
        </a>
      ) : null}
    </article>
  );
}

export function ScoreRing({
  score,
  measurable,
  total,
  locale,
}: {
  score: number | null;
  measurable: number;
  total: number;
  locale: Locale;
}) {
  const pct = score ?? 0;
  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-6">
      <div
        className="score-ring grid h-36 w-36 place-items-center rounded-full"
        style={{ ["--pct" as string]: pct }}
      >
        <div className="text-center">
          <div className="font-[family-name:var(--font-display)] text-4xl font-bold tabular-nums">
            {score == null ? "—" : score}
          </div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
            / 100
          </div>
        </div>
      </div>
      <div>
        <p className="font-[family-name:var(--font-display)] text-xl font-semibold">
          {t(locale, "score")}
        </p>
        <p className="mt-1 max-w-sm text-sm text-[var(--muted)]">
          {score == null
            ? t(locale, "scoreNone")
            : t(locale, "scoreBasedOn", { n: measurable, m: total })}
        </p>
      </div>
    </div>
  );
}

export const PLATFORM_ACCENT: Record<Platform, string> = {
  x: "#e8f2f4",
  instagram: "#f0a8c8",
  tiktok: "#79f0d8",
  facebook: "#8eb6ff",
  threads: "#d2d8de",
};
