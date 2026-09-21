import type {
  AccountSnapshot,
  Confidence,
  Evidence,
  Platform,
  SignalResult,
  SignalStatus,
} from "../types";

export const PROBE_TIMEOUT_MS = 12_000;

export interface ProbeContext {
  handle: string;
  signal: AbortSignal;
}

export function makeSignal(partial: {
  platform: Platform;
  signalKey: string;
  label: string;
  status: SignalStatus;
  confidence: Confidence;
  evidence: Evidence;
  probeMs: number;
  errorCode?: string;
}): SignalResult {
  return partial;
}

export async function withTimeout<T>(
  ms: number,
  fn: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fn(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchText(
  url: string,
  signal: AbortSignal,
  init?: RequestInit,
): Promise<{ ok: boolean; status: number; text: string; finalUrl: string }> {
  const res = await fetch(url, {
    ...init,
    signal,
    redirect: "follow",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: "text/html,application/json;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, text, finalUrl: res.url };
}

export async function fetchJson<T>(
  url: string,
  signal: AbortSignal,
  init?: RequestInit,
): Promise<{
  ok: boolean;
  status: number;
  data: T | null;
  finalUrl: string;
  redirectedOffHost: boolean;
}> {
  // Manual redirects: APIs like FxTwitter 302 missing users to GitHub.
  // Following that would look like a false "200 OK" with no profile.
  const res = await fetch(url, {
    ...init,
    signal,
    redirect: "manual",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: "application/json",
      "Accept-Language": "en-US,en;q=0.9",
      ...(init?.headers ?? {}),
    },
  });

  const location = res.headers.get("location") || "";
  const redirectedOffHost =
    res.status >= 300 &&
    res.status < 400 &&
    Boolean(location) &&
    !sameApiHost(url, location);

  // Opaque redirect / off-host bounce → treat as failed lookup, keep status.
  if (redirectedOffHost) {
    return {
      ok: false,
      status: res.status,
      data: null,
      finalUrl: location,
      redirectedOffHost: true,
    };
  }

  let data: T | null = null;
  try {
    data = (await res.json()) as T;
  } catch {
    data = null;
  }

  return {
    ok: res.ok,
    status: res.status,
    data,
    finalUrl: res.url || url,
    redirectedOffHost: false,
  };
}

function sameApiHost(requestUrl: string, location: string): boolean {
  try {
    const base = new URL(requestUrl);
    const next = new URL(location, requestUrl);
    return base.host === next.host;
  } catch {
    return false;
  }
}

export function inconclusive(
  platform: Platform,
  signalKey: string,
  label: string,
  evidence: Evidence,
  probeMs: number,
  confidence: Confidence = "low",
  errorCode?: string,
): SignalResult {
  return makeSignal({
    platform,
    signalKey,
    label,
    status: "inconclusive",
    confidence,
    evidence,
    probeMs,
    errorCode,
  });
}

export type PlatformAdapter = {
  platform: Platform;
  run: (ctx: ProbeContext) => Promise<{
    account: AccountSnapshot;
    signals: SignalResult[];
    earlyStopReason?: string;
  }>;
};
