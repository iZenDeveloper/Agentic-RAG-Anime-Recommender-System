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
      <main className="mx-auto max-w-5xl px-5 pb-20 pt-8">
        <h1 className="display text-[clamp(2.2rem,6vw,3.8rem)] leading-[1.05] text-[var(--ink)]">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-[1.05rem] leading-relaxed text-[var(--mute)]">
          {blurb}
        </p>
        <div className="mt-12 max-w-2xl">
          <ScanExperience locale={locale} defaultPlatforms={[platform]} />
        </div>
        <p className="mt-12 text-sm text-[var(--mute)]">
          <Link
            href="/methodology"
            className="text-[var(--signal)] hover:underline"
          >
            Đọc phương pháp đo
          </Link>
          {" · "}
          <Link
            href={`/check/${platform}`}
            className="text-[var(--signal)] hover:underline"
          >
            Check tay 2 phút
          </Link>
        </p>
      </main>
    </>
  );
}
