import {
  downloadManager,
  notificationService,
  type DownloadEvent,
  type NotificationData,
} from "@/services";
import { useDownloadsStore } from "@/stores";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

export function useDownloadManager() {
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);
  const initializingRef = useRef(false);

  useEffect(() => {
    async function initialize() {
      if (initializingRef.current) return;
      initializingRef.current = true;

      try {
        await downloadManager.initialize();
        await notificationService.initialize();
        setIsInitialized(true);
      } catch (err) {
        console.error("Failed to initialize download manager:", err);
      }
    }

    initialize();
  }, []);

  useEffect(() => {
    const handleNotificationAction = (data: NotificationData) => {
      if (data.action === "view" && data.downloadId) {
        router.push(`/video/${data.downloadId}`);
      } else if (data.action === "retry" && data.downloadId) {
        downloadManager.retryDownload(data.downloadId);
      }
    };

    notificationService.setActionCallback(handleNotificationAction);

    return () => {
      notificationService.setActionCallback(null);
    };
  }, [router]);

  return { isInitialized };
}

export function useDownloadProgress(downloadId: string) {
  const download = useDownloadsStore(
    useCallback(
      (state) => state.downloads.find((d) => d.id === downloadId),
      [downloadId]
    )
  );

  return {
    progress: download?.progress ?? 0,
    status: download?.status ?? null,
    error: download?.error ?? null,
  };
}

export function useDownloadActions() {
  const queueDownload = useCallback(
    async (sourceUrl: string, fetchMetadata = true) => {
      if (fetchMetadata) {
        return downloadManager.queueDownloadWithMetadata(sourceUrl);
      }
      return downloadManager.queueDownload(sourceUrl);
    },
    []
  );

  const pauseDownload = useCallback((downloadId: string) => {
    return downloadManager.pauseDownload(downloadId);
  }, []);

  const resumeDownload = useCallback((downloadId: string) => {
    return downloadManager.resumeDownload(downloadId);
  }, []);

  const cancelDownload = useCallback((downloadId: string) => {
    return downloadManager.cancelDownload(downloadId);
  }, []);

  const retryDownload = useCallback((downloadId: string) => {
    return downloadManager.retryDownload(downloadId);
  }, []);

  const deleteDownload = useCallback((downloadId: string) => {
    return downloadManager.deleteDownloadedFile(downloadId);
  }, []);

  return {
    queueDownload,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    retryDownload,
    deleteDownload,
  };
}

export function useDownloadEvents(callback: (event: DownloadEvent) => void) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const unsubscribe = downloadManager.addEventListener(
      (event: DownloadEvent) => {
        callbackRef.current(event);
      }
    );

    return unsubscribe;
  }, []);
}

export function useActiveDownloads() {
  const downloads = useDownloadsStore((state) => state.downloads);

  return downloads.filter(
    (d) => d.status === "downloading" || d.status === "pending"
  );
}

export function useStorageUsed() {
  const [storageUsed, setStorageUsed] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const used = await downloadManager.getStorageUsed();
      setStorageUsed(used);
    } catch {
      setStorageUsed(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === "active") {
        refresh();
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );
    return () => subscription.remove();
  }, [refresh]);

  return { storageUsed, isLoading, refresh };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`;
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}
