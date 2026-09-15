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
      <main className="mx-auto max-w-5xl px-5 py-10">
        {error ? (
          <p className="text-[var(--danger)]">
            Link hết hạn hoặc không tồn tại (TTL 24h, noindex).
          </p>
        ) : null}
        {!job && !error ? (
          <p className="text-[var(--mute)]">Loading…</p>
        ) : null}
        {job ? (
          <>
            <p className="text-sm text-[var(--mute)]">
              {t(locale, "resultFor")}
            </p>
            <h1 className="display text-3xl text-[var(--ink)] sm:text-4xl">
              @{job.handleNorm}
            </h1>
            <p className="mt-6 max-w-3xl border-l-2 border-[var(--warn)] pl-4 text-sm leading-relaxed text-[var(--warn)]">
              {t(locale, "disclaimer")}
            </p>
            <div className="mt-10 space-y-12">
              {job.reports.map((report) => (
                <div key={report.platform}>
                  <h2 className="display mb-2 text-2xl">
                    {PLATFORM_LABEL[report.platform][locale]}
                  </h2>
                  <ScoreRing
                    score={report.visibilityScore}
                    measurable={report.measurableCount}
                    total={report.totalSignals}
                    locale={locale}
                  />
                  <div className="mt-2">
                    {report.signals.map((s) => (
                      <SignalCard
                        key={s.signalKey}
                        signal={s}
                        locale={locale}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/"
              className="mt-12 inline-flex text-sm font-medium text-[var(--signal)] hover:underline"
            >
              Quét handle khác →
            </Link>
          </>
        ) : null}
      </main>
    </>
  );
}
