import type { Platform } from "@/stores";

const PLATFORM_PATTERNS: Record<Platform, RegExp[]> = {
  youtube: [
    /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/playlist\?list=/,
  ],
  tiktok: [
    /tiktok\.com\/@[\w.-]+\/video\/\d+/,
    /vm\.tiktok\.com\/[\w]+/,
    /tiktok\.com\/t\/[\w]+/,
  ],
  instagram: [
    /instagram\.com\/(?:p|reel|reels)\/[\w-]+/,
    /instagram\.com\/stories\/[\w.-]+\/\d+/,
  ],
  twitter: [/(?:twitter|x)\.com\/\w+\/status\/\d+/],
  facebook: [
    /facebook\.com\/.*\/videos\/\d+/,
    /facebook\.com\/watch\/?\?v=\d+/,
    /fb\.watch\/[\w]+/,
  ],
  vimeo: [/vimeo\.com\/\d+/, /player\.vimeo\.com\/video\/\d+/],
  other: [],
};

export function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function detectPlatform(url: string): Platform {
  for (const [platform, patterns] of Object.entries(PLATFORM_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(url)) {
        return platform as Platform;
      }
    }
  }
  return "other";
}

export function isVideoUrl(url: string): boolean {
  if (!isValidUrl(url)) return false;
  const platform = detectPlatform(url);
  return platform !== "other";
}

export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);

    // Remove common tracking parameters
    const trackingParams = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "fbclid",
      "gclid",
      "ref",
      "source",
      "feature",
    ];

    trackingParams.forEach((param) => {
      parsed.searchParams.delete(param);
    });

    return parsed.toString();
  } catch {
    return url;
  }
}

export function extractVideoId(url: string, platform: Platform): string | null {
  switch (platform) {
    case "youtube": {
      const match = url.match(
        /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
      );
      return match?.[1] ?? null;
    }
    case "tiktok": {
      const match = url.match(/video\/(\d+)/);
      return match?.[1] ?? null;
    }
    case "instagram": {
      const match = url.match(/(?:p|reel|reels)\/([a-zA-Z0-9_-]+)/);
      return match?.[1] ?? null;
    }
    case "twitter": {
      const match = url.match(/status\/(\d+)/);
      return match?.[1] ?? null;
    }
    case "vimeo": {
      const match = url.match(/vimeo\.com\/(\d+)/);
      return match?.[1] ?? null;
    }
    default:
      return null;
  }
}

export function getPlatformDisplayName(platform: Platform): string {
  const names: Record<Platform, string> = {
    youtube: "YouTube",
    tiktok: "TikTok",
    instagram: "Instagram",
    twitter: "X (Twitter)",
    facebook: "Facebook",
    vimeo: "Vimeo",
    other: "Video",
  };
  return names[platform];
}

export function getPlatformColor(platform: Platform): string {
  const colors: Record<Platform, string> = {
    youtube: "#FF0000",
    tiktok: "#000000",
    instagram: "#E4405F",
    twitter: "#1DA1F2",
    facebook: "#1877F2",
    vimeo: "#1AB7EA",
    other: "#6366F1",
  };
  return colors[platform];
}
