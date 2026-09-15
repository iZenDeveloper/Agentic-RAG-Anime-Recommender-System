"use client";

import type { Platform, SignalResult, SignalStatus } from "@/lib/types";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

const STATUS_KEY: Record<
  SignalStatus,
  "statusClear" | "statusRestricted" | "statusInconclusive" | "statusNA"
> = {
  clear: "statusClear",
  restricted: "statusRestricted",
  inconclusive: "statusInconclusive",
  not_applicable: "statusNA",
};

const STATUS_CLASS: Record<SignalStatus, string> = {
  clear: "badge-clear",
  restricted: "badge-restricted",
  inconclusive: "badge-inconclusive",
  not_applicable: "badge-na",
};

export function SignalCard({
  signal,
  locale,
}: {
  signal: SignalResult;
  locale: Locale;
}) {
  return (
    <article className="signal-row">
      <div className="pt-0.5">
        <span className={`badge ${STATUS_CLASS[signal.status]}`}>
          {t(locale, STATUS_KEY[signal.status])}
        </span>
        <p className="mono mt-2 text-[11px] text-[var(--mute)]">
          {t(locale, "confidence")}: {signal.confidence}
        </p>
      </div>
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-[1.05rem] font-semibold tracking-[-0.015em]">
            {signal.label}
          </h3>
          <span className="mono text-[10px] text-[var(--mute)]">
            {signal.signalKey}
          </span>
        </div>
        <p className="mt-2 text-sm text-[var(--mute)]">
          <span className="text-[var(--ink)]">{t(locale, "method")}: </span>
          {signal.evidence.method}
        </p>
        <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-[var(--ink)]">
          {signal.evidence.observed}
        </p>
        {signal.evidence.manualUrl ? (
          <a
            href={signal.evidence.manualUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex text-sm font-medium text-[var(--signal)] underline-offset-4 hover:underline"
          >
            {t(locale, "openManual")} →
          </a>
        ) : null}
      </div>
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
  return (
    <div className="flex flex-col gap-2 border-y border-[var(--line)] py-6 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
      <div>
        <p className="text-sm text-[var(--mute)]">{t(locale, "score")}</p>
        <p className="display mono mt-1 text-[4.5rem] leading-none tracking-[-0.04em] text-[var(--ink)]">
          {score == null ? "—" : score}
          <span className="ml-2 text-2xl text-[var(--mute)]">/100</span>
        </p>
      </div>
      <p className="max-w-sm pb-1 text-sm leading-relaxed text-[var(--mute)]">
        {score == null
          ? t(locale, "scoreNone")
          : t(locale, "scoreBasedOn", { n: measurable, m: total })}
      </p>
    </div>
  );
}

export const PLATFORM_ACCENT: Record<Platform, string> = {
  x: "#141c22",
  instagram: "#6b3f55",
  tiktok: "#0d5c4a",
  facebook: "#2f4f7a",
  threads: "#3a444c",
};
