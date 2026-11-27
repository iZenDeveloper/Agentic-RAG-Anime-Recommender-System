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
    <div>
      <h3 className="display text-2xl">{t(locale, "alertTitle")}</h3>
      {done ? (
        <p className="mt-4 text-sm text-[var(--signal)]">
          {t(locale, "alertThanks")}
        </p>
      ) : (
        <form onSubmit={submit} className="mt-4 flex flex-col gap-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t(locale, "alertPlaceholder")}
            className="field"
          />
          <button
            type="submit"
            disabled={busy}
            className="btn-primary self-start px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            {t(locale, "alertCta")}
          </button>
        </form>
      )}
    </div>
  );
}
