"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

export function AlertCapture({
  locale,
  handle,
  platforms,
}: {
  locale: Locale;
  handle: string;
  platforms: string[];
}) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, handle, platforms }),
      });
      if (res.ok) setDone(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--line)] p-5">
      <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold">
        {t(locale, "alertTitle")}
      </h3>
      {done ? (
        <p className="mt-4 text-sm text-[var(--signal)]">{t(locale, "alertThanks")}</p>
      ) : (
        <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t(locale, "alertPlaceholder")}
            className="rounded-xl border border-[var(--line)] bg-black/20 px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[var(--signal)]"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl border border-[var(--signal)]/40 bg-[var(--signal)]/10 px-4 py-2.5 text-sm font-semibold text-[var(--signal)] hover:bg-[var(--signal)]/20 disabled:opacity-50"
          >
            {t(locale, "alertCta")}
          </button>
        </form>
      )}
    </div>
  );
}
