"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SignalCard, VerdictBanner } from "@/components/SignalCard";
import { PLATFORM_LABEL, t } from "@/lib/i18n";
import type { ScanJob } from "@/lib/types";
import { computeVerdict } from "@/lib/verdict";

const locale = "en" as const;

export default function SharePage() {
  const params = useParams<{ token: string }>();
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

  const overall = job
    ? computeVerdict(job.reports.flatMap((r) => r.signals))
    : null;

  return (
    <>
      <SiteHeader locale={locale} />
      <main className="mx-auto max-w-5xl px-5 py-10">
        {error ? (
          <p className="text-[var(--danger)]">{t(locale, "shareExpired")}</p>
        ) : null}
        {!job && !error ? (
          <p className="text-[var(--mute)]">{t(locale, "loading")}</p>
        ) : null}
        {job && overall ? (
          <>
            <p className="text-sm text-[var(--mute)]">
              {t(locale, "sharedReport")}
            </p>
            <h1 className="display text-3xl text-[var(--ink)] sm:text-4xl">
              @{job.handleNorm}
            </h1>
            <div className="mt-6">
              <VerdictBanner verdict={overall} locale={locale} />
            </div>
            <p className="mt-6 max-w-3xl border-l-2 border-[var(--warn)] pl-4 text-sm leading-relaxed text-[var(--warn)]">
              {t(locale, "disclaimer")}
            </p>
            <div className="mt-10 space-y-12">
              {job.reports.map((report) => {
                const platformVerdict = computeVerdict(report.signals);
                return (
                  <div key={report.platform}>
                    <div className="mb-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                      <h2 className="display text-2xl">
                        {PLATFORM_LABEL[report.platform]}
                      </h2>
                      <span
                        className={`verdict-chip ${
                          platformVerdict === "not_banned"
                            ? "verdict-chip-ok"
                            : platformVerdict === "restricted"
                              ? "verdict-chip-ban"
                              : "verdict-chip-unknown"
                        }`}
                      >
                        {platformVerdict === "not_banned"
                          ? t(locale, "verdictNotBanned")
                          : platformVerdict === "restricted"
                            ? t(locale, "verdictRestricted")
                            : t(locale, "verdictUnclear")}
                      </span>
                    </div>
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
            <Link
              href="/"
              className="mt-12 inline-flex text-sm font-medium text-[var(--signal)] hover:underline"
            >
              {t(locale, "scanAnother")}
            </Link>
          </>
        ) : null}
      </main>
    </>
  );
}
