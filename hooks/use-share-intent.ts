import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";

export interface SharedContent {
  url: string;
  timestamp: number;
  platform?: string;
}

interface UseShareIntentResult {
  sharedContent: SharedContent | null;
  isProcessing: boolean;
  error: string | null;
  clearSharedContent: () => void;
}

const SUPPORTED_PLATFORMS: Record<string, RegExp> = {
  YouTube: /(?:youtube\.com|youtu\.be)/i,
  TikTok: /tiktok\.com/i,
  Instagram: /instagram\.com/i,
  X: /(?:twitter\.com|x\.com)/i,
  Facebook: /(?:facebook\.com|fb\.watch)/i,
  Vimeo: /vimeo\.com/i,
  Reddit: /(?:reddit\.com|v\.redd\.it)/i,
  Twitch: /(?:twitch\.tv|clips\.twitch\.tv)/i,
};

function detectPlatform(url: string): string | undefined {
  for (const [platform, regex] of Object.entries(SUPPORTED_PLATFORMS)) {
    if (regex.test(url)) {
      return platform;
    }
  }
  return undefined;
}

function parseShareUrl(url: string): SharedContent | null {
  try {
    const parsed = Linking.parse(url);

    if (parsed.scheme === "vidly" && parsed.path === "share") {
      const sharedUrl = parsed.queryParams?.url;

      if (typeof sharedUrl === "string") {
        const decodedUrl = decodeURIComponent(sharedUrl);
        return {
          url: decodedUrl,
          timestamp: Date.now(),
          platform: detectPlatform(decodedUrl),
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}

export function useShareIntent(): UseShareIntentResult {
  const [sharedContent, setSharedContent] = useState<SharedContent | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const processedUrls = useRef<Set<string>>(new Set());

  const processUrl = useCallback((url: string) => {
    if (processedUrls.current.has(url)) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const content = parseShareUrl(url);

      if (content) {
        processedUrls.current.add(url);
        setSharedContent(content);

        router.push({
          pathname: "/share-receiver" as const,
          params: { url: content.url },
        } as never);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to process shared URL"
      );
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const clearSharedContent = useCallback(() => {
    setSharedContent(null);
    setError(null);
  }, []);

  useEffect(() => {
    async function checkInitialUrl() {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          processUrl(initialUrl);
        }
      } catch (err) {
        console.error("Error getting initial URL:", err);
      }
    }

    checkInitialUrl();
  }, [processUrl]);

  useEffect(() => {
    const subscription = Linking.addEventListener("url", (event) => {
      processUrl(event.url);
    });

    return () => {
      subscription.remove();
    };
  }, [processUrl]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        Linking.getInitialURL().then((url) => {
          if (url) {
            processUrl(url);
          }
        });
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [processUrl]);

  return {
    sharedContent,
    isProcessing,
    error,
    clearSharedContent,
  };
}

export function usePendingShareContent(): SharedContent | null {
  const [pendingContent] = useState<SharedContent | null>(null);

  useEffect(() => {
    if (Platform.OS !== "ios") {
      return;
    }

    // On iOS, we could read from NSUserDefaults via native module
    // For now, we rely on the URL scheme approach
    // This is a placeholder for future native module integration
  }, []);

  return pendingContent;
}

export function useShareIntentNavigation() {
  const { sharedContent, isProcessing, error, clearSharedContent } =
    useShareIntent();

  useEffect(() => {
    if (sharedContent && !isProcessing) {
      router.push({
        pathname: "/share-receiver" as const,
        params: {
          url: sharedContent.url,
          platform: sharedContent.platform || "",
        },
      } as never);
    }
  }, [sharedContent, isProcessing]);

  return { isProcessing, error, clearSharedContent };
}
