"use client";

import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

export function SiteHeader({
  locale,
  onLocale,
}: {
  locale: Locale;
  onLocale: (l: Locale) => void;
}) {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5">
      <Link href="/" className="brand-mark font-[family-name:var(--font-display)] text-2xl font-extrabold tracking-tight text-[var(--ink)]">
        Shadow<span className="text-[var(--signal)]">Pulse</span>
      </Link>
      <nav className="flex items-center gap-4 text-sm text-[var(--muted)]">
        <Link href="/methodology" className="transition hover:text-[var(--ink)]">
          {t(locale, "navMethod")}
        </Link>
        <Link href="/check/x" className="hidden transition hover:text-[var(--ink)] sm:inline">
          {t(locale, "manualCheck")}
        </Link>
        <div className="flex overflow-hidden rounded-md border border-[var(--line)] text-xs">
          <button
            type="button"
            onClick={() => onLocale("vi")}
            className={`px-2.5 py-1.5 ${locale === "vi" ? "bg-[var(--signal)] text-[#04201b]" : "hover:bg-white/5"}`}
          >
            VI
          </button>
          <button
            type="button"
            onClick={() => onLocale("en")}
            className={`px-2.5 py-1.5 ${locale === "en" ? "bg-[var(--signal)] text-[#04201b]" : "hover:bg-white/5"}`}
          >
            EN
          </button>
        </div>
      </nav>
    </header>
  );
}
