"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { Locale } from "@/lib/i18n";
import { PLATFORM_LABEL, t } from "@/lib/i18n";
import type { Platform, ScanJob } from "@/lib/types";
import { computeVerdict } from "@/lib/verdict";
import { AlertCapture } from "./AlertCapture";
import { PLATFORM_ACCENT, SignalCard, VerdictBanner, verdictChipClass, verdictLabel } from "./SignalCard";

const ALL: Platform[] = ["x", "instagram", "tiktok", "facebook", "threads"];

export function ScanExperience({
  locale,
  defaultPlatforms = ["x", "instagram"],
  defaultHandle = "",
  autoScan = false,
}: {
  locale: Locale;
  defaultPlatforms?: Platform[];
  defaultHandle?: string;
  autoScan?: boolean;
}) {
  const [handle, setHandle] = useState(defaultHandle);
  const [platforms, setPlatforms] = useState<Platform[]>(defaultPlatforms);
  const [error, setError] = useState<string | null>(null);
  const [job, setJob] = useState<ScanJob | null>(null);
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  const canSubmit = handle.trim().length > 0 && platforms.length > 0;

  function toggle(p: Platform) {
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );
  }

  function runScan(nextHandle = handle, nextPlatforms = platforms) {
    if (!nextHandle.trim() || nextPlatforms.length === 0) {
      setError(t(locale, "empty"));
      return;
    }
    setError(null);
    setJob(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            handle: nextHandle,
            platforms: nextPlatforms,
          }),
        });
        const data = await res.json();
        if (res.status === 429) {
          setError(t(locale, "rateLimit"));
          return;
        }
        if (res.status === 400 && data.error === "invalid_handle") {
          setError(t(locale, "invalid"));
          return;
        }
        if (!res.ok || !data.job) {
          setError(t(locale, "scanFailed"));
          return;
        }
        setJob(data.job as ScanJob);
      } catch {
        setError(t(locale, "networkError"));
      }
    });
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    runScan();
  }

  useEffect(() => {
    if (autoScan && defaultHandle) {
      runScan(defaultHandle, defaultPlatforms);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const overallVerdict = useMemo(() => {
    if (!job) return null;
    return computeVerdict(job.reports.flatMap((r) => r.signals));
  }, [job]);

  async function share() {
    if (!job) return;
    const url = `${window.location.origin}/share/${job.shareToken}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="w-full">
      <form onSubmit={onSubmit} className="w-full">
        <p className="mb-3 text-sm text-[var(--mute)]">{t(locale, "platforms")}</p>
        <div className="mb-6 flex flex-wrap gap-x-5 gap-y-2">
          {ALL.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => toggle(p)}
              className="platform-toggle"
              aria-pressed={platforms.includes(p)}
            >
              {PLATFORM_LABEL[p]}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder={t(locale, "placeholder")}
              className="field"
              autoComplete="off"
              spellCheck={false}
              name="handle"
              id="scan-handle"
            />
          </div>
          <button
            type="submit"
            disabled={pending || !canSubmit}
            className="btn-primary px-6 py-3 text-sm font-semibold tracking-wide"
          >
            {pending ? "…" : t(locale, "cta")}
          </button>
        </div>
        {error ? (
          <p className="mt-3 text-sm text-[var(--danger)]">{error}</p>
        ) : null}
        {pending ? (
          <div className="mt-5">
            <div className="scan-ink" />
            <p className="mt-2 text-sm text-[var(--mute)]">
              {t(locale, "scanning")}
            </p>
          </div>
        ) : null}
      </form>

      {job && overallVerdict ? (
        <section className="mt-14 enter">
          <div className="mb-2 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm text-[var(--mute)]">
                {t(locale, "resultFor")}
              </p>
              <h2 className="display text-3xl text-[var(--ink)] sm:text-4xl">
                @{job.handleNorm}
              </h2>
              <p className="mono mt-1 text-xs text-[var(--mute)]">
                {job.finishedAt || job.createdAt} · UTC
              </p>
            </div>
            <button
              type="button"
              onClick={share}
              className="border-b border-[var(--line-strong)] pb-0.5 text-sm text-[var(--mute)] hover:text-[var(--ink)]"
            >
              {copied ? t(locale, "copied") : t(locale, "share")}
            </button>
          </div>

          <VerdictBanner verdict={overallVerdict} locale={locale} />

          <p className="mt-6 max-w-3xl border-l-2 border-[var(--warn)] pl-4 text-sm leading-relaxed text-[var(--warn)]">
            {t(locale, "disclaimer")}
          </p>

          <div className="mt-12 space-y-12">
            {job.reports.map((report) => {
              const platformVerdict = computeVerdict(report.signals);
              return (
                <div key={report.platform}>
                  <div className="mb-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <h3
                      className="display text-2xl"
                      style={{ color: PLATFORM_ACCENT[report.platform] }}
                    >
                      {PLATFORM_LABEL[report.platform]}
                    </h3>
                    <span className={`verdict-chip ${verdictChipClass(platformVerdict)}`}>
                      {verdictLabel(platformVerdict, locale)}
                    </span>
                  </div>
                  {report.earlyStopReason ? (
                    <p className="mb-3 text-sm text-[var(--warn)]">
                      Early stop: {report.earlyStopReason}
                    </p>
                  ) : null}
                  <p className="mb-2 text-sm text-[var(--mute)]">
                    {t(locale, "checklistTitle")}
                  </p>
                  <ul className="checklist">
                    {report.signals.map((s) => (
                      <SignalCard
                        key={s.signalKey}
                        signal={s}
                        locale={locale}
                      />
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          <div className="mt-14 grid gap-10 border-t border-[var(--line)] pt-10 md:grid-cols-2">
            <div>
              <h3 className="display text-2xl">{t(locale, "nextSteps")}</h3>
              <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-[var(--mute)]">
                <li>{t(locale, "next1")}</li>
                <li>{t(locale, "next2")}</li>
                <li>{t(locale, "next3")}</li>
              </ol>
              <a
                href="/check/x"
                className="mt-5 inline-flex text-sm font-medium text-[var(--signal)] hover:underline"
              >
                {t(locale, "officialCta")} →
              </a>
            </div>
            <AlertCapture
              locale={locale}
              handle={job.handleNorm}
              platforms={job.platforms}
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}
