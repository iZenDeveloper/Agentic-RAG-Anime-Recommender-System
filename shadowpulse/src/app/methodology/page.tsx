import Link from "next/link";

export const metadata = {
  title: "Methodology — ShadowPulse",
  description:
    "ShadowPulse only measures externally observable public signals. Anything we cannot measure returns Inconclusive.",
};

export default function MethodologyPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <Link href="/" className="text-sm text-[var(--signal)] hover:underline">
        ← ShadowPulse
      </Link>
      <h1 className="display mt-6 text-4xl text-[var(--ink)]">Methodology</h1>
      <p className="mt-4 leading-relaxed text-[var(--mute)]">
        Honesty is the product. We only observe public data — the same things a
        stranger can see — and attach confidence to every signal.
      </p>

      <section className="mt-10 space-y-4 text-sm leading-relaxed">
        <h2 className="display text-2xl">Rules</h2>
        <ul className="list-disc space-y-2 pl-5 text-[var(--mute)]">
          <li>
            Measure only public signals: search, suggestions, public posts,
            metadata.
          </li>
          <li>Never treat internal ranking as a “shadowban”.</li>
          <li>
            Missing data / blocked surface / probe failure → Inconclusive.
          </li>
          <li>
            Visibility Score counts Clear + Restricted only; Inconclusive is
            excluded.
          </li>
          <li>
            Always link official checks (Account Status / Under the Hood).
          </li>
        </ul>
      </section>

      <section className="mt-10 space-y-4 text-sm">
        <h2 className="display text-2xl">MVP by platform</h2>
        <div className="space-y-3 text-[var(--mute)]">
          <p>
            <strong className="text-[var(--ink)]">X:</strong> profile,
            suggestion approximation, from: search when the surface is open,
            ghost/deboost when samples exist; For You is always Inconclusive.
          </p>
          <p>
            <strong className="text-[var(--ink)]">
              Instagram / TikTok / Threads:
            </strong>{" "}
            public profile + official wizard; personalized search is usually
            Inconclusive.
          </p>
          <p>
            <strong className="text-[var(--ink)]">Facebook:</strong> page lookup
            + official checklist. No Restricted verdict for newsfeed
            distribution.
          </p>
        </div>
      </section>

      <p className="mt-12 border-l-2 border-[var(--warn)] pl-4 text-sm leading-relaxed text-[var(--warn)]">
        ShadowPulse is not a notice from X, Meta, or TikTok. We do not promise
        to lift bans. We do not scrape private content.
      </p>
    </main>
  );
}
