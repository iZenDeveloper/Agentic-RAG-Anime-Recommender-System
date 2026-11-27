import { profileUrl } from "../normalize";
import type { AccountSnapshot, SignalResult } from "../types";
import {
  fetchJson,
  fetchText,
  inconclusive,
  makeSignal,
  type PlatformAdapter,
  type ProbeContext,
  PROBE_TIMEOUT_MS,
  withTimeout,
} from "./types";

type OEmbed = {
  title?: string;
  author_name?: string;
  author_url?: string;
};

export const tiktokAdapter: PlatformAdapter = {
  platform: "tiktok",
  async run(ctx: ProbeContext) {
    const started = Date.now();
    const url = profileUrl("tiktok", ctx.handle);
    let account: AccountSnapshot = {
      platform: "tiktok",
      handle: ctx.handle,
      exists: false,
    };

    try {
      const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
      const [oembed, html] = await withTimeout(PROBE_TIMEOUT_MS, async (signal) => {
        const [a, b] = await Promise.all([
          fetchJson<OEmbed>(oembedUrl, signal),
          fetchText(url, signal),
        ]);
        return [a, b] as const;
      });
      const ms = Date.now() - started;

      // oEmbed is the reliable public existence check. Generic HTML often embeds
      // "Couldn't find this account" strings even for live profiles.
      const oembedExists = Boolean(
        oembed.ok &&
          oembed.data &&
          (oembed.data.author_url?.toLowerCase().includes(`@${ctx.handle}`) ||
            oembed.data.author_name),
      );
      const hardNotFound =
        oembed.status === 400 ||
        oembed.status === 404 ||
        html.status === 404;
      const exists = oembedExists;
      const isPrivate = /"privateAccount":true/i.test(html.text);

      account = {
        platform: "tiktok",
        handle: ctx.handle,
        exists,
        protectedOrPrivate: isPrivate,
      };

      const signals: SignalResult[] = [
        makeSignal({
          platform: "tiktok",
          signalKey: "tt.account_status",
          label: "Profile status",
          status: exists
            ? isPrivate
              ? "inconclusive"
              : "clear"
            : hardNotFound
              ? "not_found"
              : "inconclusive",
          confidence: exists || hardNotFound ? "high" : "low",
          evidence: {
            method: "TikTok oEmbed + public profile HTML",
            observed: exists
              ? `Profile exists — oEmbed author: ${oembed.data?.author_name ?? ctx.handle}`
              : hardNotFound
                ? "Profile does not exist (oEmbed/profile not-found) — not a shadowban"
                : `Could not confirm profile (oEmbed HTTP ${oembed.status}, HTML ${html.status})`,
            expected: "Public TikTok profile",
            manualUrl: url,
            reasonCode: exists
              ? "public_ok"
              : hardNotFound
                ? "not_found"
                : "lookup_incomplete",
          },
          probeMs: ms,
        }),
        inconclusive(
          "tiktok",
          "tt.search_visibility",
          "Search account / video",
          {
            method: "Public search for handle + latest video",
            observed:
              "Logged-out TikTok search is unstable; absence ≠ FYP ban",
            expected: "Account/video appears in search",
            manualUrl: `https://www.tiktok.com/search?q=${encodeURIComponent(ctx.handle)}`,
            reasonCode: "search_surface_blocked",
          },
          ms,
          "low",
        ),
        makeSignal({
          platform: "tiktok",
          signalKey: "tt.fyp_official",
          label: "FYP ineligible / Account Check",
          status: "inconclusive",
          confidence: "low",
          evidence: {
            method: "TikTok Studio Account Check (official)",
            observed: "External checkers cannot read FYP eligibility",
            expected: "Open TikTok Studio → Account status / video Traffic source",
            manualUrl: "https://www.tiktok.com/tiktokstudio",
            reasonCode: "not_publicly_measurable",
          },
          probeMs: 0,
        }),
        makeSignal({
          platform: "tiktok",
          signalKey: "tt.hashtag_wizard",
          label: "Hashtag discovery",
          status: "inconclusive",
          confidence: "low",
          evidence: {
            method: "Manual hashtag wizard",
            observed: "Post unique hashtag; search from non-follower",
            expected: "Video discoverable via hashtag",
            manualUrl: url,
            reasonCode: "manual_wizard",
          },
          probeMs: 0,
        }),
      ];

      return {
        account,
        signals,
        earlyStopReason: hardNotFound
          ? "account_not_found"
          : !exists
            ? "lookup_incomplete"
            : undefined,
      };
    } catch (err) {
      const ms = Date.now() - started;
      const timedOut = err instanceof Error && err.name === "AbortError";
      return {
        account,
        signals: defaultFailSignals(ctx.handle, url, ms, timedOut),
        earlyStopReason: timedOut ? "probe_timeout" : "probe_error",
      };
    }
  },
};

function defaultFailSignals(
  handle: string,
  url: string,
  ms: number,
  timedOut: boolean,
): SignalResult[] {
  return [
    inconclusive(
      "tiktok",
      "tt.account_status",
      "Profile status",
      {
        method: "TikTok oEmbed + public profile HTML",
        observed: timedOut ? "Probe timed out" : "Probe failed",
        expected: "Public profile",
        manualUrl: url,
        reasonCode: timedOut ? "probe_timeout" : "probe_error",
      },
      ms,
    ),
    inconclusive(
      "tiktok",
      "tt.search_visibility",
      "Search account / video",
      {
        method: "Public search",
        observed: "Skipped",
        expected: "Account in search",
        manualUrl: `https://www.tiktok.com/search?q=${encodeURIComponent(handle)}`,
        reasonCode: "probe_error",
      },
      ms,
    ),
    makeSignal({
      platform: "tiktok",
      signalKey: "tt.fyp_official",
      label: "FYP ineligible / Account Check",
      status: "inconclusive",
      confidence: "low",
      evidence: {
        method: "TikTok Studio",
        observed: "Use Account Check in Studio",
        expected: "Eligible for FYP",
        manualUrl: "https://www.tiktok.com/tiktokstudio",
        reasonCode: "not_publicly_measurable",
      },
      probeMs: 0,
    }),
    makeSignal({
      platform: "tiktok",
      signalKey: "tt.hashtag_wizard",
      label: "Hashtag discovery",
      status: "inconclusive",
      confidence: "low",
      evidence: {
        method: "Manual wizard",
        observed: "Hashtag check from non-follower",
        expected: "Discoverable",
        manualUrl: url,
        reasonCode: "manual_wizard",
      },
      probeMs: 0,
    }),
  ];
}
