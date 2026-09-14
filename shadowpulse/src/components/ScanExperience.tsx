"use client";

import { useMemo, useState, useTransition } from "react";
import type { Locale } from "@/lib/i18n";
import { PLATFORM_LABEL, t } from "@/lib/i18n";
import type { Platform, ScanJob } from "@/lib/types";
import { AlertCapture } from "./AlertCapture";
import { PLATFORM_ACCENT, ScoreRing, SignalCard } from "./SignalCard";

const ALL: Platform[] = ["x", "instagram", "tiktok", "facebook", "threads"];

export function ScanExperience({
  locale,
  defaultPlatforms = ["x", "instagram"],
}: {
  locale: Locale;
  defaultPlatforms?: Platform[];
}) {
  const [handle, setHandle] = useState("");
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

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) {
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
          body: JSON.stringify({ handle, platforms }),
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
          setError(locale === "vi" ? "Quét thất bại. Thử lại." : "Scan failed. Try again.");
          return;
        }
        setJob(data.job as ScanJob);
      } catch {
        setError(locale === "vi" ? "Lỗi mạng." : "Network error.");
      }
    });
  }

  const overall = useMemo(() => {
    if (!job) return null;
    const measurable = job.reports.reduce((a, r) => a + r.measurableCount, 0);
    const clears = job.reports
      .flatMap((r) => r.signals)
      .filter((s) => s.status === "clear").length;
    const restricted = job.reports
      .flatMap((r) => r.signals)
      .filter((s) => s.status === "restricted").length;
    const denom = clears + restricted;
    return {
      score: denom === 0 ? null : Math.round((clears / denom) * 100),
      measurable,
      total: job.reports.reduce((a, r) => a + r.totalSignals, 0),
    };
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
      <form onSubmit={onSubmit} className="mx-auto w-full max-w-2xl">
        <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
          {t(locale, "platforms")}
        </label>
        <div className="mb-4 flex flex-wrap gap-2">
          {ALL.map((p) => {
            const on = platforms.includes(p);
            return (
              <button
                key={p}
                type="button"
                onClick={() => toggle(p)}
                className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                  on
                    ? "border-[var(--signal)] bg-[var(--signal)]/10 text-[var(--ink)]"
                    : "border-[var(--line)] text-[var(--muted)] hover:border-white/25"
                }`}
                style={on ? { boxShadow: `0 0 0 1px ${PLATFORM_ACCENT[p]}22` } : undefined}
              >
                {PLATFORM_LABEL[p][locale]}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder={t(locale, "placeholder")}
            className="w-full flex-1 rounded-xl border border-[var(--line)] bg-[#0a151c]/80 px-4 py-3.5 text-base outline-none ring-[var(--signal)] placeholder:text-[var(--muted)] focus:ring-1"
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="submit"
            disabled={pending || !canSubmit}
            className="rounded-xl bg-[var(--signal)] px-6 py-3.5 font-semibold text-[#04201b] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "…" : t(locale, "cta")}
          </button>
        </div>
        {error ? <p className="mt-3 text-sm text-[var(--danger)]">{error}</p> : null}
        {pending ? (
          <div className="scan-bar mt-4 h-1 rounded-full bg-white/10">
            <span className="sr-only">{t(locale, "scanning")}</span>
          </div>
        ) : null}
      </form>

      {job && overall ? (
        <section className="mx-auto mt-12 w-full max-w-4xl rise">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm text-[var(--muted)]">{t(locale, "resultFor")}</p>
              <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold">
                @{job.handleNorm}
              </h2>
              <p className="mt-1 font-mono text-xs text-[var(--muted)]">
                {job.finishedAt || job.createdAt} · UTC
              </p>
            </div>
            <button
              type="button"
              onClick={share}
              className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm text-[var(--muted)] hover:text-[var(--ink)]"
            >
              {copied ? "✓" : t(locale, "share")}
            </button>
          </div>

          <div className="mb-8 rounded-2xl border border-[var(--line)] bg-gradient-to-br from-white/[0.05] to-transparent p-6">
            <ScoreRing
              score={overall.score}
              measurable={overall.measurable}
              total={overall.total}
              locale={locale}
            />
          </div>

          <p className="mb-8 rounded-xl border border-[var(--warn)]/30 bg-[var(--warn)]/10 p-4 text-sm leading-relaxed text-[#f3e2b0]">
            {t(locale, "disclaimer")}
          </p>

          <div className="space-y-10">
            {job.reports.map((report) => (
              <div key={report.platform}>
                <div className="mb-4 flex flex-wrap items-baseline gap-3">
                  <h3
                    className="font-[family-name:var(--font-display)] text-2xl font-bold"
                    style={{ color: PLATFORM_ACCENT[report.platform] }}
                  >
                    {PLATFORM_LABEL[report.platform][locale]}
                  </h3>
                  <span className="text-sm text-[var(--muted)]">
                    {t(locale, "score")}:{" "}
                    {report.visibilityScore == null ? "—" : report.visibilityScore}
                    {" · "}
                    {t(locale, "measured")}: {report.measurableCount}/{report.totalSignals}
                  </span>
                </div>
                {report.earlyStopReason ? (
                  <p className="mb-3 text-sm text-[var(--warn)]">
                    Early stop: {report.earlyStopReason}
                  </p>
                ) : null}
                <div className="grid gap-3 md:grid-cols-2">
                  {report.signals.map((s) => (
                    <SignalCard key={s.signalKey} signal={s} locale={locale} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-[var(--line)] p-5">
              <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold">
                {t(locale, "nextSteps")}
              </h3>
              <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm text-[var(--muted)]">
                <li>{t(locale, "next1")}</li>
                <li>{t(locale, "next2")}</li>
                <li>{t(locale, "next3")}</li>
              </ol>
              <a
                href="/check/x"
                className="mt-4 inline-flex text-sm text-[var(--signal)] hover:underline"
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
