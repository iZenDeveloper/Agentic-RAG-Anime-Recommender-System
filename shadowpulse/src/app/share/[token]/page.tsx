"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { ScoreRing, SignalCard } from "@/components/SignalCard";
import type { Locale } from "@/lib/i18n";
import { PLATFORM_LABEL, t } from "@/lib/i18n";
import type { ScanJob } from "@/lib/types";

export default function SharePage() {
  const params = useParams<{ token: string }>();
  const [locale, setLocale] = useState<Locale>("vi");
  const [job, setJob] = useState<ScanJob | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!params.token) return;
    fetch(`/api/share/${params.token}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("fail");
        return r.json();
      })
      .then((d) => setJob(d.job))
      .catch(() => setError(true));
  }, [params.token]);

  return (
    <>
      <SiteHeader locale={locale} onLocale={setLocale} />
      <main className="mx-auto max-w-4xl px-5 py-10">
        {error ? (
          <p className="text-[var(--danger)]">
            Link hết hạn hoặc không tồn tại (TTL 24h, noindex).
          </p>
        ) : null}
        {!job && !error ? (
          <p className="text-[var(--muted)]">Loading…</p>
        ) : null}
        {job ? (
          <>
            <p className="text-sm text-[var(--muted)]">Shared report</p>
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
              @{job.handleNorm}
            </h1>
            <p className="mt-8 rounded-xl border border-[var(--warn)]/30 bg-[var(--warn)]/10 p-4 text-sm text-[#f3e2b0]">
              {t(locale, "disclaimer")}
            </p>
            <div className="mt-8 space-y-10">
              {job.reports.map((report) => (
                <div key={report.platform}>
                  <h2 className="mb-4 font-[family-name:var(--font-display)] text-2xl font-bold">
                    {PLATFORM_LABEL[report.platform][locale]}
                  </h2>
                  <ScoreRing
                    score={report.visibilityScore}
                    measurable={report.measurableCount}
                    total={report.totalSignals}
                    locale={locale}
                  />
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {report.signals.map((s) => (
                      <SignalCard key={s.signalKey} signal={s} locale={locale} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <Link href="/" className="mt-10 inline-flex text-[var(--signal)]">
              Quét handle khác →
            </Link>
          </>
        ) : null}
      </main>
    </>
  );
}
