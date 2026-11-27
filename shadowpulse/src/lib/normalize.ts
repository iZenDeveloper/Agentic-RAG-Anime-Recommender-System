import type { Platform } from "./types";

const PLATFORM_HOSTS: Record<Platform, RegExp[]> = {
  x: [/^(?:www\.)?(?:twitter|x)\.com$/i],
  instagram: [/^(?:www\.)?instagram\.com$/i],
  tiktok: [/^(?:www\.)?tiktok\.com$/i],
  facebook: [/^(?:www\.)?(?:facebook|fb)\.com$/i],
  threads: [/^(?:www\.)?threads\.net$/i],
};

const HANDLE_RULES: Record<Platform, RegExp> = {
  x: /^[A-Za-z0-9_]{1,15}$/,
  instagram: /^[A-Za-z0-9._]{1,30}$/,
  tiktok: /^[A-Za-z0-9._]{2,24}$/,
  facebook: /^[A-Za-z0-9.]{3,50}$/,
  threads: /^[A-Za-z0-9._]{1,30}$/,
};

export function detectPlatformFromUrl(raw: string): Platform | null {
  try {
    const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    for (const [platform, hosts] of Object.entries(PLATFORM_HOSTS) as [
      Platform,
      RegExp[],
    ][]) {
      if (hosts.some((re) => re.test(url.hostname))) return platform;
    }
  } catch {
    return null;
  }
  return null;
}

export function normalizeHandle(input: string, platform: Platform): string {
  let value = input.trim();

  if (/^https?:\/\//i.test(value) || value.includes("/")) {
    try {
      const withProtocol = value.startsWith("http") ? value : `https://${value}`;
      const url = new URL(withProtocol);
      const parts = url.pathname.split("/").filter(Boolean);
      if (platform === "tiktok" && parts[0]?.startsWith("@")) {
        value = parts[0].slice(1);
      } else if (platform === "threads" && parts[0]?.startsWith("@")) {
        value = parts[0].slice(1);
      } else if (parts[0]) {
        value = parts[0].replace(/^@/, "");
      }
    } catch {
      value = value.replace(/^@/, "");
    }
  }

  value = value.replace(/^@/, "").split(/[/?#]/)[0] ?? "";
  return value.toLowerCase();
}

export function validateHandle(handle: string, platform: Platform): boolean {
  if (!handle) return false;
  return HANDLE_RULES[platform].test(handle);
}

export function profileUrl(platform: Platform, handle: string): string {
  switch (platform) {
    case "x":
      return `https://x.com/${handle}`;
    case "instagram":
      return `https://www.instagram.com/${handle}/`;
    case "tiktok":
      return `https://www.tiktok.com/@${handle}`;
    case "facebook":
      return `https://www.facebook.com/${handle}`;
    case "threads":
      return `https://www.threads.net/@${handle}`;
  }
}
