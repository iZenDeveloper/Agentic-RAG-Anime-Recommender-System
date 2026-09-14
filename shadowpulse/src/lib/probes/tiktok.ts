import { profileUrl } from "../normalize";
import type { AccountSnapshot, SignalResult } from "../types";
import {
  fetchText,
  inconclusive,
  makeSignal,
  type PlatformAdapter,
  type ProbeContext,
  PROBE_TIMEOUT_MS,
  withTimeout,
} from "./types";

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
      const res = await withTimeout(PROBE_TIMEOUT_MS, (signal) =>
        fetchText(url, signal),
      );
      const ms = Date.now() - started;
      const notFound =
        res.status === 404 ||
        /Couldn't find this account|page not available/i.test(res.text);
      const exists =
        !notFound &&
        (res.ok ||
          new RegExp(`@"?${ctx.handle}"?|"uniqueId":"${ctx.handle}"`, "i").test(
            res.text,
          ));

      account = {
        platform: "tiktok",
        handle: ctx.handle,
        exists,
        protectedOrPrivate: /privateAccount":true/i.test(res.text),
      };

      const signals: SignalResult[] = [
        makeSignal({
          platform: "tiktok",
          signalKey: "tt.account_status",
          label: "Profile status",
          status: notFound
            ? "restricted"
            : exists
              ? account.protectedOrPrivate
                ? "inconclusive"
                : "clear"
              : "inconclusive",
          confidence: notFound || exists ? "high" : "low",
          evidence: {
            method: "Public profile HTML",
            observed: notFound
              ? "Profile not found"
              : account.protectedOrPrivate
                ? "Account appears private"
                : exists
                  ? "Public profile reachable"
                  : `Lookup ambiguous (HTTP ${res.status})`,
            expected: "Public TikTok profile",
            manualUrl: url,
            reasonCode: notFound
              ? "not_found"
              : account.protectedOrPrivate
                ? "private"
                : exists
                  ? "public_ok"
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
        earlyStopReason: !exists ? "account_not_found" : undefined,
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
        method: "Public profile HTML",
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
