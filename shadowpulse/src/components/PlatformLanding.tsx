"use client";

import Link from "next/link";
import { useState } from "react";
import { ScanExperience } from "@/components/ScanExperience";
import { SiteHeader } from "@/components/SiteHeader";
import type { Locale } from "@/lib/i18n";
import type { Platform } from "@/lib/types";

export function PlatformLanding({
  platform,
  title,
  blurb,
}: {
  platform: Platform;
  title: string;
  blurb: string;
}) {
  const [locale, setLocale] = useState<Locale>("vi");
  return (
    <>
      <SiteHeader locale={locale} onLocale={setLocale} />
      <main className="mx-auto max-w-4xl px-5 pb-20 pt-8">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--signal)]">
          ShadowPulse / {platform}
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-bold sm:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-[var(--muted)]">{blurb}</p>
        <div className="mt-10">
          <ScanExperience locale={locale} defaultPlatforms={[platform]} />
        </div>
        <p className="mt-10 text-sm text-[var(--muted)]">
          <Link href="/methodology" className="text-[var(--signal)]">
            Đọc phương pháp đo
          </Link>{" "}
          ·{" "}
          <Link href={`/check/${platform}`} className="text-[var(--signal)]">
            Check tay 2 phút
          </Link>
        </p>
      </main>
    </>
  );
}
