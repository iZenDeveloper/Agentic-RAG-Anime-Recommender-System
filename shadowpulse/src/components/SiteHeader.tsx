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
        <div className="mono flex gap-1 text-[11px]">
          <button
            type="button"
            onClick={() => onLocale("vi")}
            className={`px-1.5 py-0.5 ${
              locale === "vi"
                ? "text-[var(--ink)] underline decoration-[var(--signal)] decoration-2 underline-offset-4"
                : "hover:text-[var(--ink)]"
            }`}
            aria-pressed={locale === "vi"}
          >
            VI
          </button>
          <span aria-hidden className="text-[var(--line-strong)]">
            /
          </span>
          <button
            type="button"
            onClick={() => onLocale("en")}
            className={`px-1.5 py-0.5 ${
              locale === "en"
                ? "text-[var(--ink)] underline decoration-[var(--signal)] decoration-2 underline-offset-4"
                : "hover:text-[var(--ink)]"
            }`}
            aria-pressed={locale === "en"}
          >
            EN
          </button>
        </div>
      </nav>
    </header>
  );
}
