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

export const facebookAdapter: PlatformAdapter = {
  platform: "facebook",
  async run(ctx: ProbeContext) {
    const started = Date.now();
    const url = profileUrl("facebook", ctx.handle);
    let account: AccountSnapshot = {
      platform: "facebook",
      handle: ctx.handle,
      exists: false,
    };

    try {
      const res = await withTimeout(PROBE_TIMEOUT_MS, (signal) =>
        fetchText(url, signal),
      );
      const ms = Date.now() - started;
      const loginWall = /log in|Log Into Facebook|login_form/i.test(res.text);
      const notFound =
        res.status === 404 ||
        /This content isn't available|Page Not Found/i.test(res.text);
      const exists =
        !notFound &&
        !loginWall &&
        (res.ok || /og:title|pageID|userID/i.test(res.text));

      account = {
        platform: "facebook",
        handle: ctx.handle,
        exists,
      };

      const signals: SignalResult[] = [
        makeSignal({
          platform: "facebook",
          signalKey: "fb.page_status",
          label: "Page / Profile status",
          status: notFound
            ? "not_found"
            : exists
              ? "clear"
              : "inconclusive",
          confidence: notFound || exists ? "high" : "low",
          evidence: {
            method: "Public page/profile lookup",
            observed: notFound
              ? "Page/profile does not exist or was removed — not a shadowban"
              : exists
                ? "Public page/profile exists and is reachable"
                : loginWall
                  ? "Facebook returned a login wall — cannot confirm without session"
                  : `Lookup ambiguous (HTTP ${res.status})`,
            expected: "Public Page or Profile",
            manualUrl: url,
            reasonCode: notFound
              ? "not_found"
              : exists
                ? "public_ok"
                : loginWall
                  ? "login_wall"
                  : "lookup_incomplete",
          },
          probeMs: ms,
        }),
        // MVP: Facebook search probe defaults to inconclusive unless stable
        inconclusive(
          "facebook",
          "fb.search_visibility",
          "Search Page visibility",
          {
            method: "Facebook search surface",
            observed:
              "Search often requires login by region — MVP keeps this Inconclusive by default",
            expected: "Page appears in Facebook search",
            manualUrl: `https://www.facebook.com/search/top?q=${encodeURIComponent(ctx.handle)}`,
            reasonCode: "search_surface_blocked",
          },
          ms,
          "low",
        ),
        makeSignal({
          platform: "facebook",
          signalKey: "fb.distribution_official",
          label: "Feed / Reels distribution",
          status: "inconclusive",
          confidence: "low",
          evidence: {
            method: "Official Account Status / Professional dashboard",
            observed:
              "ShadowPulse cannot read newsfeed or Reels distribution. This is not a Restricted verdict.",
            expected: "Check Account Status inside Facebook app",
            manualUrl: "https://www.facebook.com/help/contacts",
            reasonCode: "not_publicly_measurable",
          },
          probeMs: 0,
        }),
      ];

      return { account, signals };
    } catch (err) {
      const ms = Date.now() - started;
      const timedOut = err instanceof Error && err.name === "AbortError";
      return {
        account,
        signals: [
          inconclusive(
            "facebook",
            "fb.page_status",
            "Page / Profile status",
            {
              method: "Public page lookup",
              observed: timedOut ? "Probe timed out" : "Probe failed",
              expected: "Public page",
              manualUrl: url,
              reasonCode: timedOut ? "probe_timeout" : "probe_error",
            },
            ms,
          ),
          inconclusive(
            "facebook",
            "fb.search_visibility",
            "Search Page visibility",
            {
              method: "Facebook search",
              observed: "Skipped",
              expected: "Page in search",
              manualUrl: url,
              reasonCode: "probe_error",
            },
            ms,
          ),
          makeSignal({
            platform: "facebook",
            signalKey: "fb.distribution_official",
            label: "Feed / Reels distribution",
            status: "inconclusive",
            confidence: "low",
            evidence: {
              method: "Official checklist",
              observed: "Use Account Status + Professional dashboard",
              expected: "No distribution restrictions listed",
              manualUrl: "https://www.facebook.com/help/contacts",
              reasonCode: "not_publicly_measurable",
            },
            probeMs: 0,
          }),
        ],
      };
    }
  },
};
