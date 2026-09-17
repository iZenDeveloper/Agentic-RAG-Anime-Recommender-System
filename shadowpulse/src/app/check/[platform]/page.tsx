import Link from "next/link";
import type { Platform } from "@/lib/types";

const GUIDES: Record<
  Platform,
  { title: string; steps: string[]; official: string }
> = {
  x: {
    title: "Manual X check in 2 minutes",
    steps: [
      "Open x.com in another account (or logged out).",
      "Type the first few characters of the handle in Search → People: does a suggestion appear?",
      "Search `from:handle` on the Latest tab: is the newest post indexed?",
      "Open Under the Hood / account notices in the app if available.",
    ],
    official: "https://help.x.com/en/using-x/x-under-the-hood",
  },
  instagram: {
    title: "Manual Instagram check in 2 minutes",
    steps: [
      "Open Settings → Account Status in the app (source of truth).",
      "From a non-follower account: search the username — does the profile appear?",
      "Post a unique hashtag, then search that hashtag from another account.",
      "Don’t call an Explore ban just because views dropped.",
    ],
    official: "https://help.instagram.com/2635538616697496",
  },
  tiktok: {
    title: "Manual TikTok check in 2 minutes",
    steps: [
      "Open TikTok Studio → Account Check / Account status.",
      "Open a new video → Analytics → Traffic source (For You?).",
      "Search the handle from a non-follower account.",
      "Use a unique hashtag + non-follower search to test discovery.",
    ],
    official: "https://www.tiktok.com/tiktokstudio",
  },
  facebook: {
    title: "Manual Facebook check in 2 minutes",
    steps: [
      "Open Account Status / Professional dashboard in the app.",
      "Search the Page from another account.",
      "Check Page quality / ad account separately if you run ads.",
      "External tools cannot read newsfeed distribution.",
    ],
    official: "https://www.facebook.com/help",
  },
  threads: {
    title: "Manual Threads check in 2 minutes",
    steps: [
      "Open the profile logged out / from another account.",
      "Search the handle if the surface is still alive.",
      "Check a reply inside the parent thread from a stranger’s view.",
      "Cross-check Instagram Account Status (same Meta system).",
    ],
    official: "https://www.threads.net/",
  },
};

export default async function CheckGuidePage({
  params,
}: {
  params: Promise<{ platform: string }>;
}) {
  const { platform: raw } = await params;
  const platform = raw as Platform;
  const guide = GUIDES[platform];
  if (!guide) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-12">
        <p>Unknown platform.</p>
        <Link href="/">Home</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      <Link href="/" className="text-sm text-[var(--signal)] hover:underline">
        ← ShadowPulse
      </Link>
      <h1 className="display mt-6 text-3xl text-[var(--ink)]">{guide.title}</h1>
      <ol className="mt-6 list-decimal space-y-3 pl-5 text-[var(--mute)]">
        {guide.steps.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
      <a
        href={guide.official}
        target="_blank"
        rel="noreferrer"
        className="btn-primary mt-8 inline-flex px-4 py-2.5 text-sm font-semibold"
      >
        Open official guide
      </a>
    </main>
  );
}
