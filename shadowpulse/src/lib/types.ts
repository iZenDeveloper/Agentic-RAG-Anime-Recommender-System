export type Platform = "x" | "instagram" | "tiktok" | "facebook" | "threads";

export type SignalStatus =
  | "clear"
  | "restricted"
  | "not_found"
  | "inconclusive"
  | "not_applicable";

export type Confidence = "high" | "medium" | "low";

export type JobStatus = "queued" | "running" | "done" | "failed";

export interface Evidence {
  method: string;
  observed: string;
  expected: string;
  sampleIds?: string[];
  manualUrl?: string;
  reasonCode?: string;
}

export interface SignalResult {
  platform: Platform;
  signalKey: string;
  label: string;
  status: SignalStatus;
  confidence: Confidence;
  evidence: Evidence;
  probeMs: number;
  errorCode?: string;
}

export interface AccountSnapshot {
  platform: Platform;
  handle: string;
  exists: boolean;
  protectedOrPrivate?: boolean;
  suspended?: boolean;
  displayName?: string;
  lastPostAt?: string | null;
  publicFlags?: Record<string, boolean | string | number | null>;
}

export interface PlatformReport {
  platform: Platform;
  account?: AccountSnapshot;
  signals: SignalResult[];
  visibilityScore: number | null;
  measurableCount: number;
  totalSignals: number;
  earlyStopReason?: string;
}

export interface ScanJob {
  id: string;
  handleNorm: string;
  platforms: Platform[];
  status: JobStatus;
  createdAt: string;
  finishedAt?: string;
  reports: PlatformReport[];
  shareToken: string;
  shareExpiresAt: string;
}

export interface ScanRequestBody {
  handle: string;
  platforms: Platform[];
  locale?: "vi" | "en";
}
