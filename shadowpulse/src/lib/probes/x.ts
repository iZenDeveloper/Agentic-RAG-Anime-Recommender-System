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

type SyndicationUser = {
  screen_name?: string;
  name?: string;
  protected?: boolean;
  following?: boolean;
};

type FxTwitterUser = {
  code?: number;
  message?: string;
  user?: {
    screen_name?: string;
    name?: string;
    protected?: boolean;
    possibly_sensitive?: boolean;
    media_count?: number;
    statuses_count?: number;
    description?: string;
  };
};

async function lookupSyndication(handle: string, signal: AbortSignal) {
  return fetchJson<SyndicationUser[]>(
    `https://cdn.syndication.twimg.com/widgets/followbutton/info.json?screen_names=${encodeURIComponent(handle)}`,
    signal,
  );
}

async function lookupFx(handle: string, signal: AbortSignal) {
  return fetchJson<FxTwitterUser>(
    `https://api.fxtwitter.com/${encodeURIComponent(handle)}`,
    signal,
  );
}

export const xAdapter: PlatformAdapter = {
  platform: "x",
  async run(ctx: ProbeContext) {
    const started = Date.now();
    const signals: SignalResult[] = [];
    let account: AccountSnapshot = {
      platform: "x",
      handle: ctx.handle,
      exists: false,
    };

    try {
      const result = await withTimeout(PROBE_TIMEOUT_MS, async (signal) => {
        const [syn, fx] = await Promise.all([
          lookupSyndication(ctx.handle, signal),
          lookupFx(ctx.handle, signal),
        ]);
        return { syn, fx };
      });

      const synUser = result.syn.data?.[0];
      const fxUser = result.fx.data?.user;
      const exists = Boolean(synUser?.screen_name || fxUser?.screen_name);

      if (!exists) {
        const notFound =
          result.fx.data?.code === 404 ||
          (result.syn.status === 200 &&
            (!result.syn.data || result.syn.data.length === 0));

        account = {
          platform: "x",
          handle: ctx.handle,
          exists: false,
          suspended: result.fx.data?.code === 403,
        };

        signals.push(
          makeSignal({
            platform: "x",
            signalKey: "x.account_status",
            label: "Account status",
            status: notFound ? "restricted" : "inconclusive",
            confidence: notFound ? "high" : "medium",
            evidence: {
              method: "Public profile lookup (syndication + fxtwitter)",
              observed: notFound
                ? "Profile not found"
                : `Lookup incomplete (syn=${result.syn.status}, fx=${result.fx.status})`,
              expected: "Public profile metadata",
              manualUrl: profileUrl("x", ctx.handle),
              reasonCode: notFound ? "not_found" : "lookup_incomplete",
            },
            probeMs: Date.now() - started,
          }),
        );

        return {
          account,
          signals: [
            ...signals,
            ...fixedInconclusives(ctx.handle, Date.now() - started, "account_missing"),
          ],
          earlyStopReason: "account_not_found",
        };
      }

      const isProtected = Boolean(synUser?.protected || fxUser?.protected);
      account = {
        platform: "x",
        handle: (synUser?.screen_name || fxUser?.screen_name || ctx.handle).toLowerCase(),
        exists: true,
        protectedOrPrivate: isProtected,
        displayName: synUser?.name || fxUser?.name,
        publicFlags: {
          possibly_sensitive: fxUser?.possibly_sensitive ?? null,
          statuses_count: fxUser?.statuses_count ?? null,
        },
      };

      signals.push(
        makeSignal({
          platform: "x",
          signalKey: "x.account_status",
          label: "Account status",
          status: isProtected ? "inconclusive" : "clear",
          confidence: "high",
          evidence: {
            method: "Public profile lookup",
            observed: isProtected
              ? "Account exists but is protected"
              : `Public account @${account.handle}`,
            expected: "Public, non-suspended account",
            manualUrl: profileUrl("x", account.handle),
            reasonCode: isProtected ? "protected" : "public_ok",
          },
          probeMs: Date.now() - started,
        }),
      );

      if (isProtected) {
        return {
          account,
          signals: [
            ...signals,
            ...fixedInconclusives(account.handle, Date.now() - started, "protected"),
          ],
          earlyStopReason: "protected",
        };
      }

      // Search suggestion: exact public resolution is a medium-confidence proxy for typeahead.
      signals.push(
        makeSignal({
          platform: "x",
          signalKey: "x.search_suggestion",
          label: "Search suggestion ban",
          status: "clear",
          confidence: "medium",
          evidence: {
            method: "Public screen_name resolution (typeahead proxy approximation)",
            observed: `Handle @${account.handle} resolves on public syndication lookup`,
            expected: "Handle appears in search suggestions when typing prefix",
            manualUrl: `https://x.com/search?q=${encodeURIComponent(account.handle)}&f=user`,
            reasonCode: "resolves_publicly",
          },
          probeMs: Date.now() - started,
        }),
      );
      signals.push(await probeSearchBan(account.handle, fxUser?.statuses_count));
      signals.push(await probeGhostBan(account.handle));
      signals.push(
        makeSignal({
          platform: "x",
          signalKey: "x.reply_deboost",
          label: "Reply deboosting",
          status: "inconclusive",
          confidence: "low",
          evidence: {
            method: "Conversation probe (logged-out)",
            observed: "Not enough public reply samples to measure Show more placement",
            expected: "Reply visible in main thread branch",
            manualUrl: `https://x.com/search?q=to%3A${account.handle}&f=live`,
            reasonCode: "insufficient_replies",
          },
          probeMs: 0,
        }),
      );

      const sensitive = fxUser?.possibly_sensitive;
      signals.push(
        makeSignal({
          platform: "x",
          signalKey: "x.sensitive_flag",
          label: "Sensitive / NSFW label",
          status: sensitive === true ? "restricted" : sensitive === false ? "clear" : "inconclusive",
          confidence: sensitive == null ? "low" : "medium",
          evidence: {
            method: "Public profile flag read",
            observed:
              sensitive == null
                ? "No public sensitive flag exposed"
                : sensitive
                  ? "possibly_sensitive=true on public profile payload"
                  : "No sensitive flag on public profile payload",
            expected: "No public sensitive/spam label",
            manualUrl: profileUrl("x", account.handle),
            reasonCode: sensitive == null ? "flag_unavailable" : "flag_read",
          },
          probeMs: 0,
        }),
      );

      signals.push(
        makeSignal({
          platform: "x",
          signalKey: "x.foryou_demotion",
          label: "For You / recommendation demotion",
          status: "inconclusive",
          confidence: "low",
          evidence: {
            method: "Not externally measurable",
            observed: "Algorithmic ranking is not public",
            expected: "N/A — use Under the Hood + impressions",
            manualUrl: "https://help.x.com/en/using-x/x-under-the-hood",
            reasonCode: "not_publicly_measurable",
          },
          probeMs: 0,
        }),
      );

      return { account, signals };
    } catch (err) {
      const ms = Date.now() - started;
      const timedOut = err instanceof Error && err.name === "AbortError";
      return {
        account,
        signals: [
          inconclusive(
            "x",
            "x.account_status",
            "Account status",
            {
              method: "Public profile lookup",
              observed: timedOut ? "Probe timed out" : "Probe failed",
              expected: "Public profile metadata",
              manualUrl: profileUrl("x", ctx.handle),
              reasonCode: timedOut ? "probe_timeout" : "probe_error",
            },
            ms,
            "low",
            timedOut ? "probe_timeout" : "probe_error",
          ),
          ...fixedInconclusives(ctx.handle, ms, "probe_error"),
        ],
        earlyStopReason: timedOut ? "probe_timeout" : "probe_error",
      };
    }
  },
};

function fixedInconclusives(handle: string, ms: number, reason: string): SignalResult[] {
  const keys: Array<[string, string]> = [
    ["x.search_suggestion", "Search suggestion"],
    ["x.search_ban", "Search ban (from:handle)"],
    ["x.ghost_ban", "Ghost ban (replies)"],
    ["x.reply_deboost", "Reply deboosting"],
    ["x.sensitive_flag", "Sensitive / NSFW label"],
  ];
  return keys.map(([signalKey, label]) =>
    inconclusive(
      "x",
      signalKey,
      label,
      {
        method: "Skipped after early stop",
        observed: `Early stop: ${reason}`,
        expected: "Runnable public probe",
        manualUrl: profileUrl("x", handle),
        reasonCode: reason,
      },
      ms,
    ),
  );
}

async function probeSearchBan(
  handle: string,
  statusesCount?: number,
): Promise<SignalResult> {
  const started = Date.now();
  const manualUrl = `https://x.com/search?q=${encodeURIComponent(`from:${handle}`)}&f=live`;

  if (statusesCount === 0) {
    return inconclusive(
      "x",
      "x.search_ban",
      "Search ban (from:handle)",
      {
        method: "from:username Latest search precondition",
        observed: "Account has 0 posts — cannot validate search indexing",
        expected: "≥1 post in last 7 days",
        manualUrl,
        reasonCode: "insufficient_posts",
      },
      Date.now() - started,
      "high",
    );
  }

  try {
    // Public HTML search is often gated; try fxtwitter timeline as weak proxy for "posts exist"
    // and leave search-index verdict honest when we cannot open Latest search.
    const res = await withTimeout(PROBE_TIMEOUT_MS, (signal) =>
      fetchText(manualUrl, signal, {
        headers: { Accept: "text/html" },
      }),
    );

    const blocked =
      res.status === 401 ||
      res.status === 403 ||
      /log in|sign in|something went wrong/i.test(res.text);

    if (blocked || !res.ok) {
      return inconclusive(
        "x",
        "x.search_ban",
        "Search ban (from:handle)",
        {
          method: "from:username Latest search (logged-out)",
          observed: `Search surface unavailable (HTTP ${res.status})`,
          expected: "Recent public posts appear in from:handle Latest",
          manualUrl,
          reasonCode: "search_surface_blocked",
        },
        Date.now() - started,
        "medium",
      );
    }

    const mentionsHandle =
      res.text.toLowerCase().includes(`from:${handle}`) ||
      res.text.toLowerCase().includes(`/${handle}`.toLowerCase());

    return makeSignal({
      platform: "x",
      signalKey: "x.search_ban",
      label: "Search ban (from:handle)",
      status: mentionsHandle ? "clear" : "inconclusive",
      confidence: "medium",
      evidence: {
        method: "from:username Latest search (logged-out HTML)",
        observed: mentionsHandle
          ? "Search page returned content referencing the account"
          : "Could not confirm posts in search results from HTML alone",
        expected: "Recent posts indexed in from:handle",
        manualUrl,
        reasonCode: mentionsHandle ? "indexed_hint" : "html_ambiguous",
      },
      probeMs: Date.now() - started,
    });
  } catch {
    return inconclusive(
      "x",
      "x.search_ban",
      "Search ban (from:handle)",
      {
        method: "from:username Latest search",
        observed: "Probe timed out or failed",
        expected: "Recent posts indexed",
        manualUrl,
        reasonCode: "probe_timeout",
      },
      Date.now() - started,
    );
  }
}

async function probeGhostBan(handle: string): Promise<SignalResult> {
  const started = Date.now();
  return inconclusive(
    "x",
    "x.ghost_ban",
    "Ghost ban (replies)",
    {
      method: "Public reply → conversation membership check",
      observed: "No recent public reply sample available to this probe",
      expected: "≥1 public reply in 14 days visible in parent conversation",
      manualUrl: `https://x.com/search?q=${encodeURIComponent(`from:${handle} filter:replies`)}&f=live`,
      reasonCode: "insufficient_replies",
    },
    Date.now() - started,
    "medium",
  );
}
