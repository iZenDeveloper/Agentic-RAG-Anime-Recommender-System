"use client";

import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { ScanExperience } from "@/components/ScanExperience";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

export function HomeClient() {
  const [locale, setLocale] = useState<Locale>("vi");

  return (
    <>
      <SiteHeader locale={locale} onLocale={setLocale} />
      <main className="relative mx-auto flex min-h-[calc(100vh-88px)] w-full max-w-6xl flex-col px-5 pb-20 pt-8">
        <section className="relative mb-14 overflow-hidden rounded-[2rem] border border-[var(--line)] bg-[#0a171f]/55 px-6 py-14 sm:px-12 sm:py-20">
          <div className="pointer-events-none absolute inset-0">
            <div className="pulse-ring left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2" />
            <div className="pulse-ring left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2" />
            <div className="pulse-ring left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(7,16,22,0.75)_75%)]" />
          </div>

          <div className="relative mx-auto max-w-3xl text-center">
            <p className="rise brand-mark font-[family-name:var(--font-display)] text-5xl font-extrabold tracking-tight sm:text-7xl">
              Shadow<span className="text-[var(--signal)]">Pulse</span>
            </p>
            <h1 className="rise rise-delay-1 mt-6 font-[family-name:var(--font-display)] text-2xl font-semibold leading-snug text-[var(--ink)] sm:text-3xl">
              {t(locale, "tagline")}
            </h1>
            <p className="rise rise-delay-2 mx-auto mt-4 max-w-xl text-base leading-relaxed text-[var(--muted)] sm:text-lg">
              {t(locale, "heroSupport")}
            </p>
          </div>

          <div className="relative mx-auto mt-10 max-w-2xl rise rise-delay-2">
            <ScanExperience locale={locale} />
          </div>
        </section>

        <footer className="mt-auto border-t border-[var(--line)] pt-8 text-sm text-[var(--muted)]">
          <p>{t(locale, "footerTrust")}</p>
          <div className="mt-3 flex flex-wrap gap-4">
            <a href="/methodology" className="hover:text-[var(--ink)]">
              {t(locale, "methodology")}
            </a>
            <a href="/x" className="hover:text-[var(--ink)]">
              /x
            </a>
            <a href="/instagram" className="hover:text-[var(--ink)]">
              /instagram
            </a>
            <a href="/tiktok" className="hover:text-[var(--ink)]">
              /tiktok
            </a>
            <a href="/facebook" className="hover:text-[var(--ink)]">
              /facebook
            </a>
            <a href="/threads" className="hover:text-[var(--ink)]">
              /threads
            </a>
          </div>
        </footer>
      </main>
    </>
  );
}
