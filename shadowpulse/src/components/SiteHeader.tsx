"use client";

import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

export function SiteHeader({ locale }: { locale: Locale }) {
  return (
    <header className="mx-auto flex w-full max-w-5xl items-baseline justify-between gap-4 px-5 py-6">
      <Link href="/" className="display text-xl text-[var(--ink)] sm:text-2xl">
        ShadowPulse
      </Link>
      <nav className="flex items-center gap-5 text-sm text-[var(--mute)]">
        <Link href="/methodology" className="hover:text-[var(--ink)]">
          {t(locale, "navMethod")}
        </Link>
        <Link
          href="/check/x"
          className="hidden hover:text-[var(--ink)] sm:inline"
        >
          {t(locale, "manualCheck")}
        </Link>
      </nav>
    </header>
  );
}
