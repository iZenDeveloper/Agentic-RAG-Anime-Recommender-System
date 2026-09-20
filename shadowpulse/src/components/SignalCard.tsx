"use client";

import type { Platform, SignalResult, SignalStatus } from "@/lib/types";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import type { Verdict } from "@/lib/verdict";

const STATUS_KEY: Record<
  SignalStatus,
  "statusClear" | "statusRestricted" | "statusInconclusive" | "statusNA"
> = {
  clear: "statusClear",
  restricted: "statusRestricted",
  inconclusive: "statusInconclusive",
  not_applicable: "statusNA",
};

const STATUS_MARK: Record<SignalStatus, string> = {
  clear: "✓",
  restricted: "✗",
  inconclusive: "?",
  not_applicable: "—",
};

const STATUS_CLASS: Record<SignalStatus, string> = {
  clear: "check-ok",
  restricted: "check-ban",
  inconclusive: "check-unknown",
  not_applicable: "check-na",
};

const VERDICT_KEY: Record<
  Verdict,
  "verdictNotBanned" | "verdictRestricted" | "verdictUnclear"
> = {
  not_banned: "verdictNotBanned",
  restricted: "verdictRestricted",
  unclear: "verdictUnclear",
};

const VERDICT_HINT: Record<
  Verdict,
  "verdictNotBannedHint" | "verdictRestrictedHint" | "verdictUnclearHint"
> = {
  not_banned: "verdictNotBannedHint",
  restricted: "verdictRestrictedHint",
  unclear: "verdictUnclearHint",
};

const VERDICT_CLASS: Record<Verdict, string> = {
  not_banned: "verdict-ok",
  restricted: "verdict-ban",
  unclear: "verdict-unknown",
};

export function VerdictBanner({
  verdict,
  locale,
}: {
  verdict: Verdict;
  locale: Locale;
}) {
  return (
    <div className={`verdict-banner ${VERDICT_CLASS[verdict]}`}>
      <p className="display text-[2.75rem] leading-none tracking-[-0.03em] sm:text-[3.5rem]">
        {t(locale, VERDICT_KEY[verdict])}
      </p>
      <p className="mt-3 max-w-xl text-sm leading-relaxed opacity-90">
        {t(locale, VERDICT_HINT[verdict])}
      </p>
    </div>
  );
}

export function SignalCard({
  signal,
  locale,
}: {
  signal: SignalResult;
  locale: Locale;
}) {
  return (
    <li className={`checklist-item ${STATUS_CLASS[signal.status]}`}>
      <div className="checklist-main">
        <span className="checklist-mark" aria-hidden>
          {STATUS_MARK[signal.status]}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <p className="text-[1.02rem] font-semibold tracking-[-0.01em] text-[var(--ink)]">
              {signal.label}
            </p>
            <span className="mono text-[11px] uppercase tracking-wide text-[var(--mute)]">
              {t(locale, STATUS_KEY[signal.status])}
            </span>
          </div>
          <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-[var(--mute)]">
            {signal.evidence.observed}
          </p>
          {signal.evidence.manualUrl ? (
            <a
              href={signal.evidence.manualUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex text-sm font-medium text-[var(--signal)] underline-offset-4 hover:underline"
            >
              {t(locale, "openManual")} →
            </a>
          ) : null}
        </div>
      </div>
    </li>
  );
}

export const PLATFORM_ACCENT: Record<Platform, string> = {
  x: "#141c22",
  instagram: "#6b3f55",
  tiktok: "#0d5c4a",
  facebook: "#2f4f7a",
  threads: "#3a444c",
};
