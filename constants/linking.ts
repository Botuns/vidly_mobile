import * as Linking from "expo-linking";

/**
 * Deep linking configuration for Vidly.
 *
 * Supported URL schemes:
 * - vidly://download?url=<encoded-video-url> - Open download modal with URL
 * - vidly://video/<id> - Open video detail screen
 * - vidly://library - Open library tab
 * - vidly://downloads - Open downloads tab
 * - vidly://settings - Open settings tab
 *
 * Share Extension callback:
 * The iOS/Android share extensions will use:
 * vidly://download?url=<encoded-url>&source=share-extension
 */

export const LINKING_CONFIG = {
  prefixes: [Linking.createURL("/"), "vidly://"],
  config: {
    screens: {
      "(tabs)": {
        screens: {
          index: "library",
          downloads: "downloads",
          settings: "settings",
        },
      },
      "video/[id]": "video/:id",
      modal: "download",
    },
  },
};

/**
 * Parse a deep link URL and extract the video URL parameter.
 * Used by share extension callbacks.
 */
export function parseDownloadUrl(url: string): string | null {
  try {
    const parsed = Linking.parse(url);
    if (parsed.queryParams?.url) {
      return decodeURIComponent(parsed.queryParams.url as string);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Create a deep link URL for downloading a video.
 * Used by share extensions to callback to the main app.
 */
export function createDownloadDeepLink(videoUrl: string): string {
  const encodedUrl = encodeURIComponent(videoUrl);
  return `vidly://download?url=${encodedUrl}&source=share-extension`;
}

/**
 * Create a deep link URL for opening a video detail screen.
 */
export function createVideoDeepLink(videoId: string): string {
  return `vidly://video/${videoId}`;
}

/**
 * Check if a URL is a Vidly deep link.
 */
export function isVidlyDeepLink(url: string): boolean {
  return url.startsWith("vidly://") || url.includes("vidly.app/");
}
