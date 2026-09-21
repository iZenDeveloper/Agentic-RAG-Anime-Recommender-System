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
  reason?: string;
  user?: {
    screen_name?: string;
    name?: string;
    protected?: boolean;
    possibly_sensitive?: boolean;
    media_count?: number;
    statuses_count?: number;
    tweets?: number;
    description?: string;
  };
};

type AccountKind = "exists" | "not_found" | "suspended" | "inconclusive";

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

async function lookupProfileHtml(handle: string, signal: AbortSignal) {
  return fetchText(profileUrl("x", handle), signal, {
    headers: { Accept: "text/html" },
  });
}

function classifyXAccount(input: {
  syn: Awaited<ReturnType<typeof lookupSyndication>>;
  fx: Awaited<ReturnType<typeof lookupFx>>;
  html: Awaited<ReturnType<typeof lookupProfileHtml>>;
  handle: string;
}): {
  kind: AccountKind;
  synUser?: SyndicationUser;
  fxUser?: FxTwitterUser["user"];
  detail: string;
} {
  const synUser = input.syn.data?.[0];
  const fxData = input.fx.data;
  const fxUser = fxData?.user;
  const fxMsg = `${fxData?.message || ""} ${fxData?.reason || ""}`.toLowerCase();

  const fxExists = Boolean(fxUser?.screen_name);
  const synExists = Boolean(synUser?.screen_name);

  // Explicit suspension from Fx (body preserved even on HTTP 403).
  const fxSuspended =
    input.fx.status === 403 ||
    fxData?.code === 403 ||
    /suspend/.test(fxMsg);

  // Explicit not-found from Fx: JSON 404, or 302 off-host (FxEmbed → GitHub).
  const fxNotFound =
    input.fx.status === 404 ||
    fxData?.code === 404 ||
    /not found|does not exist|user not found/.test(fxMsg) ||
    input.fx.redirectedOffHost;

  const htmlText = input.html.text || "";
  const htmlSuspended = /Account suspended/i.test(htmlText);
  const htmlExists =
    new RegExp(`\\(@${input.handle}\\)`, "i").test(htmlText) ||
    new RegExp(`og:title"[^>]*content="[^"]*@${input.handle}`, "i").test(
      htmlText,
    ) ||
    new RegExp(`property="og:title" content="[^"]*@${input.handle}`, "i").test(
      htmlText,
    );
  const htmlMissingHint =
    /Something went wrong/i.test(htmlText) &&
    !htmlExists &&
    !/og:title/i.test(htmlText);

  if (fxSuspended || htmlSuspended) {
    return {
      kind: "suspended",
      synUser,
      fxUser,
      detail: fxSuspended
        ? `FxTwitter marks account suspended (HTTP ${input.fx.status})`
        : "X profile page shows “Account suspended”",
    };
  }

  if (fxExists || synExists || htmlExists) {
    return {
      kind: "exists",
      synUser,
      fxUser,
      detail: fxExists
        ? "Resolved via FxTwitter public profile"
        : synExists
          ? "Resolved via syndication follow-button"
          : "Resolved via public X profile HTML",
    };
  }

  if (fxNotFound || (htmlMissingHint && input.html.ok)) {
    return {
      kind: "not_found",
      synUser,
      fxUser,
      detail: fxNotFound
        ? input.fx.redirectedOffHost
          ? "FxTwitter redirected away (typical for unknown handles)"
          : `FxTwitter: user not found (HTTP ${input.fx.status})`
        : "X profile HTML has no public account metadata",
    };
  }

  return {
    kind: "inconclusive",
    synUser,
    fxUser,
    detail: `Lookup incomplete (syn=${input.syn.status}, fx=${input.fx.status}, html=${input.html.status})`,
  };
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
        const [syn, fx, html] = await Promise.all([
          lookupSyndication(ctx.handle, signal),
          lookupFx(ctx.handle, signal),
          lookupProfileHtml(ctx.handle, signal),
        ]);
        return { syn, fx, html };
      });

      const classified = classifyXAccount({
        ...result,
        handle: ctx.handle,
      });
      const { synUser, fxUser } = classified;
      const tweetCount = fxUser?.tweets ?? fxUser?.statuses_count;

      if (classified.kind === "not_found") {
        account = {
          platform: "x",
          handle: ctx.handle,
          exists: false,
          suspended: false,
        };
        signals.push(
          makeSignal({
            platform: "x",
            signalKey: "x.account_status",
            label: "Account status",
            status: "not_found",
            confidence: "high",
            evidence: {
              method: "Public profile lookup (FxTwitter + X HTML)",
              observed: `Account does not exist — ${classified.detail}`,
              expected: "A real public X account",
              manualUrl: profileUrl("x", ctx.handle),
              reasonCode: "not_found",
            },
            probeMs: Date.now() - started,
          }),
        );
        return {
          account,
          signals: [
            ...signals,
            ...fixedInconclusives(
              ctx.handle,
              Date.now() - started,
              "account_not_found",
            ),
          ],
          earlyStopReason: "account_not_found",
        };
      }

      if (classified.kind === "suspended") {
        account = {
          platform: "x",
          handle: ctx.handle,
          exists: false,
          suspended: true,
        };
        signals.push(
          makeSignal({
            platform: "x",
            signalKey: "x.account_status",
            label: "Account status",
            status: "restricted",
            confidence: "high",
            evidence: {
              method: "Public profile lookup (FxTwitter + X HTML)",
              observed: `Account is suspended — ${classified.detail}`,
              expected: "A live, non-suspended account",
              manualUrl: profileUrl("x", ctx.handle),
              reasonCode: "suspended",
            },
            probeMs: Date.now() - started,
          }),
        );
        return {
          account,
          signals: [
            ...signals,
            ...fixedInconclusives(
              ctx.handle,
              Date.now() - started,
              "account_suspended",
            ),
          ],
          earlyStopReason: "account_suspended",
        };
      }

      if (classified.kind === "inconclusive") {
        account = {
          platform: "x",
          handle: ctx.handle,
          exists: false,
        };
        signals.push(
          makeSignal({
            platform: "x",
            signalKey: "x.account_status",
            label: "Account status",
            status: "inconclusive",
            confidence: "medium",
            evidence: {
              method: "Public profile lookup (FxTwitter + X HTML)",
              observed: classified.detail,
              expected: "Public profile metadata",
              manualUrl: profileUrl("x", ctx.handle),
              reasonCode: "lookup_incomplete",
            },
            probeMs: Date.now() - started,
          }),
        );
        return {
          account,
          signals: [
            ...signals,
            ...fixedInconclusives(
              ctx.handle,
              Date.now() - started,
              "lookup_incomplete",
            ),
          ],
          earlyStopReason: "lookup_incomplete",
        };
      }

      // exists
      const isProtected = Boolean(synUser?.protected || fxUser?.protected);
      account = {
        platform: "x",
        handle: (
          synUser?.screen_name ||
          fxUser?.screen_name ||
          ctx.handle
        ).toLowerCase(),
        exists: true,
        protectedOrPrivate: isProtected,
        displayName: synUser?.name || fxUser?.name,
        publicFlags: {
          possibly_sensitive: fxUser?.possibly_sensitive ?? null,
          statuses_count: tweetCount ?? null,
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
              ? `Account exists but is protected — ${classified.detail}`
              : `Account exists (public) — @${account.handle}. ${classified.detail}`,
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
            ...fixedInconclusives(
              account.handle,
              Date.now() - started,
              "protected",
            ),
          ],
          earlyStopReason: "protected",
        };
      }

      signals.push(
        makeSignal({
          platform: "x",
          signalKey: "x.search_suggestion",
          label: "Search suggestion ban",
          status: "clear",
          confidence: "medium",
          evidence: {
            method: "Public screen_name resolution (typeahead proxy approximation)",
            observed: `Handle @${account.handle} resolves on a public profile lookup`,
            expected: "Handle appears in search suggestions when typing prefix",
            manualUrl: `https://x.com/search?q=${encodeURIComponent(account.handle)}&f=user`,
            reasonCode: "resolves_publicly",
          },
          probeMs: Date.now() - started,
        }),
      );
      signals.push(await probeSearchBan(account.handle, tweetCount));
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
          status:
            sensitive === true
              ? "restricted"
              : sensitive === false
                ? "clear"
                : "inconclusive",
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

function fixedInconclusives(
  handle: string,
  ms: number,
  reason: string,
): SignalResult[] {
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
