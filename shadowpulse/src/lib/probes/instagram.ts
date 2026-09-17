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

export const instagramAdapter: PlatformAdapter = {
  platform: "instagram",
  async run(ctx: ProbeContext) {
    const started = Date.now();
    const url = profileUrl("instagram", ctx.handle);
    let account: AccountSnapshot = {
      platform: "instagram",
      handle: ctx.handle,
      exists: false,
    };

    try {
      const res = await withTimeout(PROBE_TIMEOUT_MS, (signal) =>
        fetchText(url, signal),
      );
      const ms = Date.now() - started;
      const text = res.text;
      const hardNotFound =
        res.status === 404 ||
        /Sorry, this page isn't available\.?|The link you followed may be broken/i.test(
          text,
        );
      // Instagram often returns a login shell (title "Instagram") without profile JSON.
      const loginWall =
        !hardNotFound &&
        (/<title>Instagram<\/title>/i.test(text) ||
          /login_form|Log into Instagram|Create an account/i.test(text)) &&
        !new RegExp(`"${ctx.handle}"|"username":"${ctx.handle}"`, "i").test(text) &&
        !/property="og:title"/i.test(text);

      const isPrivate =
        /This account is private|"is_private":true/i.test(text) && !hardNotFound;
      const exists =
        !hardNotFound &&
        !loginWall &&
        (/property="og:title"/i.test(text) ||
          new RegExp(`"username"\\s*:\\s*"${ctx.handle}"`, "i").test(text) ||
          /profilePage_/i.test(text));

      account = {
        platform: "instagram",
        handle: ctx.handle,
        exists,
        protectedOrPrivate: isPrivate,
      };

      const signals: SignalResult[] = [
        makeSignal({
          platform: "instagram",
          signalKey: "ig.account_status",
          label: "Profile status",
          status: hardNotFound
            ? "restricted"
            : exists
              ? isPrivate
                ? "inconclusive"
                : "clear"
              : "inconclusive",
          confidence: hardNotFound || exists ? "high" : loginWall ? "medium" : "low",
          evidence: {
            method: "Public profile HTML",
            observed: hardNotFound
              ? "Profile page not available"
              : loginWall
                ? "Instagram returned a login wall — public profile metadata unavailable to this probe"
                : isPrivate
                  ? "Account appears private"
                  : exists
                    ? "Public profile metadata reachable"
                    : `Lookup ambiguous (HTTP ${res.status})`,
            expected: "Public Instagram profile",
            manualUrl: url,
            reasonCode: hardNotFound
              ? "not_found"
              : loginWall
                ? "login_wall"
                : isPrivate
                  ? "private"
                  : exists
                    ? "public_ok"
                    : "lookup_incomplete",
          },
          probeMs: ms,
        }),
      ];

      if (hardNotFound || isPrivate) {
        signals.push(
          inconclusive(
            "instagram",
            "ig.search_visibility",
            "Username search visibility",
            {
              method: "Public username search",
              observed: "Skipped — account missing or private",
              expected: "Profile appears in account search",
              manualUrl: `https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(ctx.handle)}`,
              reasonCode: isPrivate ? "private" : "not_found",
            },
            ms,
          ),
        );
      } else {
        signals.push(
          inconclusive(
            "instagram",
            "ig.search_visibility",
            "Username search visibility",
            {
              method: "Public username search",
              observed:
                "Instagram search is personalized and often login-gated — no stable logged-out probe",
              expected: "Profile appears in account search",
              manualUrl: `https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(ctx.handle)}`,
              reasonCode: "search_surface_blocked",
            },
            ms,
            "medium",
          ),
        );
      }

      signals.push(
        makeSignal({
          platform: "instagram",
          signalKey: "ig.hashtag_wizard",
          label: "Hashtag / Explore eligibility",
          status: "inconclusive",
          confidence: "low",
          evidence: {
            method: "Manual wizard (no automated hashtag scrape)",
            observed: "Automated hashtag feed scrape is out of MVP scope",
            expected: "Post with unique hashtag discoverable from non-follower",
            manualUrl: url,
            reasonCode: "manual_wizard",
          },
          probeMs: 0,
        }),
        makeSignal({
          platform: "instagram",
          signalKey: "ig.recommendation_official",
          label: "Recommendation eligibility",
          status: "inconclusive",
          confidence: "low",
          evidence: {
            method: "Official Account Status only",
            observed: "Not readable from outside Meta apps",
            expected: "Check Settings → Account Status in Instagram app",
            manualUrl: "https://help.instagram.com/2635538616697496",
            reasonCode: "not_publicly_measurable",
          },
          probeMs: 0,
        }),
      );

      return {
        account,
        signals,
        earlyStopReason: hardNotFound
          ? "account_not_found"
          : loginWall
            ? "login_wall"
            : isPrivate
              ? "private"
              : undefined,
      };
    } catch (err) {
      const ms = Date.now() - started;
      const timedOut = err instanceof Error && err.name === "AbortError";
      return {
        account,
        signals: [
          inconclusive(
            "instagram",
            "ig.account_status",
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
            "instagram",
            "ig.search_visibility",
            "Username search visibility",
            {
              method: "Public username search",
              observed: "Skipped after profile probe failure",
              expected: "Profile in search",
              manualUrl: url,
              reasonCode: "probe_error",
            },
            ms,
          ),
          makeSignal({
            platform: "instagram",
            signalKey: "ig.hashtag_wizard",
            label: "Hashtag / Explore eligibility",
            status: "inconclusive",
            confidence: "low",
            evidence: {
              method: "Manual wizard",
              observed: "Use unique hashtag from a non-follower account",
              expected: "Discoverable via hashtag",
              manualUrl: url,
              reasonCode: "manual_wizard",
            },
            probeMs: 0,
          }),
          makeSignal({
            platform: "instagram",
            signalKey: "ig.recommendation_official",
            label: "Recommendation eligibility",
            status: "inconclusive",
            confidence: "low",
            evidence: {
              method: "Official Account Status",
              observed: "Open Instagram → Settings → Account Status",
              expected: "No restrictions listed",
              manualUrl: "https://help.instagram.com/2635538616697496",
              reasonCode: "not_publicly_measurable",
            },
            probeMs: 0,
          }),
        ],
        earlyStopReason: timedOut ? "probe_timeout" : "probe_error",
      };
    }
  },
};
