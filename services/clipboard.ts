import type { Platform } from "@/stores";
import { useSettingsStore } from "@/stores";
import * as Clipboard from "expo-clipboard";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { detectPlatform, isVideoUrl, normalizeUrl } from "./url-processor";

export interface ClipboardVideoUrl {
  url: string;
  platform: Platform;
  normalizedUrl: string;
}

export function useClipboardMonitor() {
  const [clipboardUrl, setClipboardUrl] = useState<ClipboardVideoUrl | null>(
    null
  );
  const [isChecking, setIsChecking] = useState(false);
  const lastCheckedUrl = useRef<string | null>(null);

  const clipboardDetectionEnabled = useSettingsStore(
    (state) => state.clipboardDetectionEnabled
  );
  const lastProcessedUrl = useSettingsStore(
    (state) => state.lastProcessedClipboardUrl
  );
  const setLastProcessedUrl = useSettingsStore(
    (state) => state.setLastProcessedClipboardUrl
  );

  const checkClipboard = useCallback(async () => {
    if (!clipboardDetectionEnabled) return;

    setIsChecking(true);
    try {
      const content = await Clipboard.getStringAsync();

      if (!content || content === lastCheckedUrl.current) {
        setIsChecking(false);
        return;
      }

      lastCheckedUrl.current = content;

      if (isVideoUrl(content) && content !== lastProcessedUrl) {
        const normalizedUrl = normalizeUrl(content);
        const platform = detectPlatform(content);

        setClipboardUrl({
          url: content,
          platform,
          normalizedUrl,
        });
      } else {
        setClipboardUrl(null);
      }
    } catch (error) {
      console.error("Error checking clipboard:", error);
    } finally {
      setIsChecking(false);
    }
  }, [clipboardDetectionEnabled, lastProcessedUrl]);

  const dismissUrl = useCallback(() => {
    if (clipboardUrl) {
      setLastProcessedUrl(clipboardUrl.url);
    }
    setClipboardUrl(null);
  }, [clipboardUrl, setLastProcessedUrl]);

  const clearClipboardUrl = useCallback(() => {
    setClipboardUrl(null);
  }, []);

  useEffect(() => {
    // Check clipboard on mount
    checkClipboard();

    // Listen for app state changes
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        checkClipboard();
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      subscription.remove();
    };
  }, [checkClipboard]);

  useEffect(() => {
    // Listen for clipboard changes (only works on iOS when app is active)
    const subscription = Clipboard.addClipboardListener(() => {
      checkClipboard();
    });

    return () => {
      subscription.remove();
    };
  }, [checkClipboard]);

  return {
    clipboardUrl,
    isChecking,
    checkClipboard,
    dismissUrl,
    clearClipboardUrl,
  };
}
