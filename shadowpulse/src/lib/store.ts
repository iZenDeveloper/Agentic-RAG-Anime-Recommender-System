import type { ScanJob } from "./types";

const jobsById = new Map<string, ScanJob>();
const jobsByShare = new Map<string, string>();
const alertEmails: Array<{
  email: string;
  handle: string;
  platforms: string[];
  createdAt: string;
}> = [];

const JOB_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function saveJob(job: ScanJob) {
  jobsById.set(job.id, job);
  jobsByShare.set(job.shareToken, job.id);
}

export function getJob(id: string): ScanJob | undefined {
  const job = jobsById.get(id);
  if (!job) return undefined;
  if (Date.now() - Date.parse(job.createdAt) > JOB_TTL_MS) {
    jobsById.delete(id);
    jobsByShare.delete(job.shareToken);
    return undefined;
  }
  return job;
}

export function getJobByShareToken(token: string): ScanJob | undefined {
  const id = jobsByShare.get(token);
  if (!id) return undefined;
  const job = getJob(id);
  if (!job) return undefined;
  if (Date.parse(job.shareExpiresAt) < Date.now()) return undefined;
  return job;
}

export function saveAlertInterest(input: {
  email: string;
  handle: string;
  platforms: string[];
}) {
  alertEmails.push({ ...input, createdAt: new Date().toISOString() });
}

export function listAlertCount() {
  return alertEmails.length;
}
