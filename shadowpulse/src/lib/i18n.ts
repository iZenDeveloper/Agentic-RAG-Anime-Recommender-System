export type Locale = "en";

const dict = {
  en: {
    brand: "ShadowPulse",
    tagline: "See what platforms are hiding, and how sure we are.",
    heroSupport:
      "Public visibility probes across X, Instagram, TikTok, Facebook, and Threads. No passwords. No fake verdicts.",
    cta: "Scan now",
    placeholder: "@handle or profile URL",
    platforms: "Platforms",
    scanning: "Probing public signals…",
    score: "Visibility Score",
    scoreBasedOn: "Score based on {n}/{m} measurable signals",
    scoreNone: "Not enough measurable signals to score",
    disclaimer:
      "ShadowPulse observes public data only. This is not a notice from X, Meta, or TikTok. Scores ignore unmeasurable signals. Cross-check Account Status / Under the Hood in-app.",
    nextSteps: "3 things to do next",
    next1: "Open the official tool in-app (Account Status / Under the Hood).",
    next2:
      "If Inconclusive for missing posts/replies: publish one public test, then rescan.",
    next3:
      "Don’t overhaul strategy for a view drop alone. Views are not a shadowban.",
    alertTitle: "Get alerted when signals change",
    alertPlaceholder: "email@domain.com",
    alertCta: "Join monitor waitlist",
    alertThanks: "Saved. Phase 2 will send a magic-link monitor.",
    methodology: "Methodology",
    manualCheck: "2-minute manual check",
    share: "Share result (24h)",
    openManual: "Open manual check link",
    statusClear: "Clear",
    statusRestricted: "Restricted",
    statusInconclusive: "Inconclusive",
    statusNA: "N/A",
    confidence: "Confidence",
    evidence: "Evidence",
    method: "Method",
    rateLimit: "Free daily limit or handle cooldown hit. Try again later.",
    invalid: "Handle is invalid for the selected platform(s).",
    empty: "Enter a handle and pick at least one platform.",
    footerTrust: "Honesty over hype. “Unclear” beats “100% banned”.",
    navMethod: "Methodology",
    resultFor: "Report for",
    measured: "Measurable",
    officialCta: "Open official check guide",
    scanFailed: "Scan failed. Try again.",
    networkError: "Network error.",
    shareExpired: "Link expired or not found (24h TTL, noindex).",
    loading: "Loading…",
    sharedReport: "Shared report",
    scanAnother: "Scan another handle →",
    readMethod: "Read the methodology",
    copied: "Copied",
  },
} as const;

export type DictKey = keyof (typeof dict)["en"];

export function t(
  locale: Locale,
  key: DictKey,
  vars?: Record<string, string | number>,
) {
  let value: string = dict[locale][key];
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      value = value.replace(`{${k}}`, String(v));
    }
  }
  return value;
}

export const PLATFORM_LABEL: Record<
  "x" | "instagram" | "tiktok" | "facebook" | "threads",
  string
> = {
  x: "X",
  instagram: "Instagram",
  tiktok: "TikTok",
  facebook: "Facebook",
  threads: "Threads",
};
