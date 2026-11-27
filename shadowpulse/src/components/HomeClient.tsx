"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { ScanExperience } from "@/components/ScanExperience";
import { t } from "@/lib/i18n";
import type { Platform } from "@/lib/types";

const ALL: Platform[] = ["x", "instagram", "tiktok", "facebook", "threads"];
const locale = "en" as const;

export function HomeClient() {
  const search = useSearchParams();

  const preset = useMemo(() => {
    const handle = (search.get("handle") || "").replace(/^@/, "");
    const platforms = (search.get("platforms") || "x,instagram")
      .split(",")
      .map((p) => p.trim())
      .filter((p): p is Platform => ALL.includes(p as Platform));
    return {
      handle,
      platforms: platforms.length
        ? platforms
        : (["x", "instagram"] as Platform[]),
      auto: search.get("autoscan") === "1",
    };
  }, [search]);

  return (
    <>
      <SiteHeader locale={locale} />
      <main className="mx-auto flex min-h-[calc(100vh-88px)] w-full max-w-5xl flex-col px-5 pb-20 pt-4">
        <section className="relative mb-16 pt-8 sm:pt-14">
          <p className="enter display text-[clamp(3.2rem,12vw,7.5rem)] leading-[0.92] text-[var(--ink)]">
            ShadowPulse
          </p>
          <h1 className="enter enter-d1 mt-8 max-w-2xl text-[1.35rem] font-semibold leading-snug tracking-[-0.02em] text-[var(--ink)] sm:text-[1.75rem]">
            {t(locale, "tagline")}
          </h1>
          <p className="enter enter-d2 mt-4 max-w-xl text-[1.05rem] leading-relaxed text-[var(--mute)]">
            {t(locale, "heroSupport")}
          </p>

          <div className="enter enter-d2 mt-12 max-w-2xl">
            <ScanExperience
              locale={locale}
              defaultHandle={preset.handle}
              defaultPlatforms={preset.platforms}
              autoScan={preset.auto}
            />
          </div>
        </section>

        <footer className="mt-auto border-t border-[var(--line)] pt-8 text-sm text-[var(--mute)]">
          <p>{t(locale, "footerTrust")}</p>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
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
