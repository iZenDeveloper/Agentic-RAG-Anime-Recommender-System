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

export const threadsAdapter: PlatformAdapter = {
  platform: "threads",
  async run(ctx: ProbeContext) {
    const started = Date.now();
    const url = profileUrl("threads", ctx.handle);
    let account: AccountSnapshot = {
      platform: "threads",
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
        /Page not found|content isn't available/i.test(res.text);
      const exists =
        !notFound &&
        (res.ok ||
          new RegExp(`@"${ctx.handle}"|/${ctx.handle}"`, "i").test(res.text) ||
          /og:title/i.test(res.text));

      account = {
        platform: "threads",
        handle: ctx.handle,
        exists,
      };

      const signals: SignalResult[] = [
        makeSignal({
          platform: "threads",
          signalKey: "th.account_status",
          label: "Profile status",
          status: notFound
            ? "not_found"
            : exists
              ? "clear"
              : "inconclusive",
          confidence: notFound || exists ? "high" : "low",
          evidence: {
            method: "Public Threads profile",
            observed: notFound
              ? "Profile does not exist — not a shadowban"
              : exists
                ? "Public profile exists and is reachable"
                : `Lookup ambiguous (HTTP ${res.status})`,
            expected: "Public Threads profile",
            manualUrl: url,
            reasonCode: notFound
              ? "not_found"
              : exists
                ? "public_ok"
                : "lookup_incomplete",
          },
          probeMs: ms,
        }),
        inconclusive(
          "threads",
          "th.search_visibility",
          "Search / suggested profile",
          {
            method: "Public Threads/Instagram search surface",
            observed: "Search/suggest surfaces change frequently and often need login",
            expected: "Profile appears in suggestions",
            manualUrl: url,
            reasonCode: "search_surface_blocked",
          },
          ms,
          "low",
        ),
        makeSignal({
          platform: "threads",
          signalKey: "th.reply_visibility",
          label: "Reply visibility in thread",
          status: "inconclusive",
          confidence: "low",
          evidence: {
            method: "Public reply permalink probe (V1)",
            observed: "Requires a recent public reply permalink — not auto-collected in MVP",
            expected: "Reply visible in parent thread to logged-out viewer",
            manualUrl: url,
            reasonCode: "insufficient_replies",
          },
          probeMs: 0,
        }),
      ];

      return {
        account,
        signals,
        earlyStopReason: notFound ? "account_not_found" : undefined,
      };
    } catch (err) {
      const ms = Date.now() - started;
      const timedOut = err instanceof Error && err.name === "AbortError";
      return {
        account,
        signals: [
          inconclusive(
            "threads",
            "th.account_status",
            "Profile status",
            {
              method: "Public Threads profile",
              observed: timedOut ? "Probe timed out" : "Probe failed",
              expected: "Public profile",
              manualUrl: url,
              reasonCode: timedOut ? "probe_timeout" : "probe_error",
            },
            ms,
          ),
          inconclusive(
            "threads",
            "th.search_visibility",
            "Search / suggested profile",
            {
              method: "Public search",
              observed: "Skipped",
              expected: "Profile in suggestions",
              manualUrl: url,
              reasonCode: "probe_error",
            },
            ms,
          ),
          makeSignal({
            platform: "threads",
            signalKey: "th.reply_visibility",
            label: "Reply visibility in thread",
            status: "inconclusive",
            confidence: "low",
            evidence: {
              method: "Reply probe",
              observed: "Not available",
              expected: "Reply visible",
              manualUrl: url,
              reasonCode: "insufficient_replies",
            },
            probeMs: 0,
          }),
        ],
      };
    }
  },
};
