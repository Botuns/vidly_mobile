import {
  useDownloadsStore,
  type Download,
  type DownloadStatus,
} from "@/stores";
import { Directory, File, Paths } from "expo-file-system";
import { apiClient, type ApiError, type VideoMetadata } from "./api-client";
import { detectPlatform, normalizeUrl } from "./url-processor";

const DOWNLOADS_DIR_NAME = "downloads";
const THUMBNAILS_DIR_NAME = "thumbnails";

interface ActiveDownload {
  abortController: AbortController;
  downloadId: string;
  isPaused: boolean;
}

interface DownloadProgress {
  downloadId: string;
  progress: number;
  totalBytes: number;
  downloadedBytes: number;
}

type DownloadEventType =
  | "start"
  | "progress"
  | "complete"
  | "fail"
  | "pause"
  | "resume"
  | "cancel";

interface DownloadEvent {
  type: DownloadEventType;
  downloadId: string;
  download: Download;
  progress?: DownloadProgress;
  error?: string;
}

type DownloadEventListener = (event: DownloadEvent) => void;

class DownloadManager {
  private activeDownloads = new Map<string, ActiveDownload>();
  private eventListeners = new Set<DownloadEventListener>();
  private isProcessing = false;
  private initialized = false;
  private downloadsDir!: Directory;
  private thumbnailsDir!: Directory;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    this.downloadsDir = new Directory(Paths.document, DOWNLOADS_DIR_NAME);
    this.thumbnailsDir = new Directory(Paths.document, THUMBNAILS_DIR_NAME);

    await this.ensureDirectoriesExist();
    await this.restorePausedDownloads();
    this.initialized = true;
  }

  private async ensureDirectoriesExist(): Promise<void> {
    if (!this.downloadsDir.exists) {
      this.downloadsDir.create();
    }
    if (!this.thumbnailsDir.exists) {
      this.thumbnailsDir.create();
    }
  }

  private async restorePausedDownloads(): Promise<void> {
    const store = useDownloadsStore.getState();
    const pausedDownloads = store.downloads.filter(
      (d) => d.status === "paused"
    );

    for (const download of pausedDownloads) {
      store.updateDownload(download.id, {
        status: "pending",
        progress: 0,
      });
    }
  }

  addEventListener(listener: DownloadEventListener): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  private emitEvent(event: DownloadEvent): void {
    for (const listener of this.eventListeners) {
      try {
        listener(event);
      } catch (err) {
        console.error("Error in download event listener:", err);
      }
    }
  }

  private emitProgress(
    downloadId: string,
    downloadedBytes: number,
    totalBytes: number
  ): void {
    const progress = totalBytes > 0 ? downloadedBytes / totalBytes : 0;

    const store = useDownloadsStore.getState();
    store.updateDownload(downloadId, {
      progress,
      fileSize: totalBytes,
    });

    const download = store.downloads.find((d) => d.id === downloadId);
    if (download) {
      this.emitEvent({
        type: "progress",
        downloadId,
        download,
        progress: {
          downloadId,
          progress,
          totalBytes,
          downloadedBytes,
        },
      });
    }
  }

  async queueDownload(
    sourceUrl: string,
    metadata?: Partial<VideoMetadata>
  ): Promise<{ success: true; downloadId: string } | ApiError> {
    const normalizedUrl = normalizeUrl(sourceUrl);
    const store = useDownloadsStore.getState();

    const existingDownload = store.getDownloadByUrl(normalizedUrl);
    if (existingDownload) {
      if (existingDownload.status === "completed") {
        return { success: true, downloadId: existingDownload.id };
      }
      if (
        existingDownload.status === "downloading" ||
        existingDownload.status === "pending"
      ) {
        return { success: true, downloadId: existingDownload.id };
      }
    }

    const platform = detectPlatform(normalizedUrl);

    const downloadId = store.addDownload({
      sourceUrl: normalizedUrl,
      platform,
      title: metadata?.title ?? "Untitled Video",
      thumbnail: metadata?.thumbnail ?? null,
      localPath: null,
      duration: metadata?.duration ?? null,
      resolution: metadata?.qualities?.[0]?.resolution ?? null,
      fileSize: metadata?.qualities?.[0]?.fileSize ?? null,
      downloadedAt: null,
    });

    this.processQueue();

    return { success: true, downloadId };
  }

  async queueDownloadWithMetadata(
    sourceUrl: string
  ): Promise<
    { success: true; downloadId: string; metadata: VideoMetadata } | ApiError
  > {
    const result = await apiClient.extractMetadata(sourceUrl);

    if (!result.success) {
      return result;
    }

    const queueResult = await this.queueDownload(sourceUrl, result.metadata);

    if (!queueResult.success) {
      return queueResult;
    }

    return {
      success: true,
      downloadId: queueResult.downloadId,
      metadata: result.metadata,
    };
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const store = useDownloadsStore.getState();
      const { maxConcurrentDownloads } = store;

      while (true) {
        const activeCount = this.getActiveDownloadCount();
        const pending = store.getPendingDownloads();

        if (activeCount >= maxConcurrentDownloads || pending.length === 0) {
          break;
        }

        const nextDownload = pending[0];
        this.startDownload(nextDownload.id);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private getActiveDownloadCount(): number {
    let count = 0;
    for (const active of this.activeDownloads.values()) {
      if (!active.isPaused) {
        count++;
      }
    }
    return count;
  }

  private async startDownload(downloadId: string): Promise<void> {
    const store = useDownloadsStore.getState();
    const download = store.downloads.find((d) => d.id === downloadId);

    if (!download || download.status !== "pending") {
      return;
    }

    store.updateDownload(downloadId, { status: "downloading", progress: 0 });
    this.emitEvent({ type: "start", downloadId, download });

    try {
      const urlResult = await apiClient.getDownloadUrl(download.sourceUrl);

      if (!urlResult.success) {
        store.updateDownload(downloadId, {
          status: "failed",
          error: urlResult.error.message,
        });
        this.emitEvent({
          type: "fail",
          downloadId,
          download: {
            ...download,
            status: "failed",
            error: urlResult.error.message,
          },
          error: urlResult.error.message,
        });
        this.processQueue();
        return;
      }

      const abortController = new AbortController();
      this.activeDownloads.set(downloadId, {
        abortController,
        downloadId,
        isPaused: false,
      });

      const fileName = `${downloadId}.mp4`;
      const file = new File(this.downloadsDir, fileName);

      const response = await fetch(urlResult.downloadUrl.url, {
        headers: urlResult.downloadUrl.headers,
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const contentLength = response.headers.get("content-length");
      const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;
      let downloadedBytes = 0;

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Unable to read response body");
      }

      const chunks: Uint8Array[] = [];

      while (true) {
        const active = this.activeDownloads.get(downloadId);
        if (!active || active.isPaused) {
          reader.cancel();
          break;
        }

        const { done, value } = await reader.read();

        if (done) break;

        if (value) {
          chunks.push(value);
          downloadedBytes += value.length;
          this.emitProgress(downloadId, downloadedBytes, totalBytes);
        }
      }

      const active = this.activeDownloads.get(downloadId);
      if (active && !active.isPaused) {
        const totalLength = chunks.reduce(
          (acc, chunk) => acc + chunk.length,
          0
        );
        const combined = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
          combined.set(chunk, offset);
          offset += chunk.length;
        }

        await file.write(combined);

        const thumbnailPath = download.thumbnail
          ? await this.downloadThumbnail(downloadId, download.thumbnail)
          : null;

        store.updateDownload(downloadId, {
          status: "completed",
          progress: 1,
          localPath: file.uri,
          thumbnail: thumbnailPath ?? download.thumbnail,
          downloadedAt: new Date().toISOString(),
          fileSize: downloadedBytes,
        });

        const updatedDownload = store.downloads.find(
          (d) => d.id === downloadId
        );
        if (updatedDownload) {
          this.emitEvent({
            type: "complete",
            downloadId,
            download: updatedDownload,
          });
        }
      }

      this.activeDownloads.delete(downloadId);
      this.processQueue();
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }

      const errorMessage =
        err instanceof Error ? err.message : "Download failed";
      const active = this.activeDownloads.get(downloadId);

      if (!active?.isPaused) {
        store.updateDownload(downloadId, {
          status: "failed",
          error: errorMessage,
        });
        this.emitEvent({
          type: "fail",
          downloadId,
          download: { ...download, status: "failed", error: errorMessage },
          error: errorMessage,
        });
      }

      this.activeDownloads.delete(downloadId);
      this.processQueue();
    }
  }

  private async downloadThumbnail(
    downloadId: string,
    thumbnailUrl: string
  ): Promise<string | null> {
    try {
      const fileName = `${downloadId}.jpg`;
      const file = new File(this.thumbnailsDir, fileName);

      const response = await fetch(thumbnailUrl);
      if (!response.ok) return null;

      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      await file.write(uint8Array);

      return file.uri;
    } catch {
      return null;
    }
  }

  async pauseDownload(downloadId: string): Promise<boolean> {
    const active = this.activeDownloads.get(downloadId);
    if (!active || active.isPaused) {
      return false;
    }

    active.isPaused = true;
    active.abortController.abort();

    const store = useDownloadsStore.getState();
    store.updateDownload(downloadId, { status: "paused" });

    const download = store.downloads.find((d) => d.id === downloadId);
    if (download) {
      this.emitEvent({ type: "pause", downloadId, download });
    }

    this.processQueue();
    return true;
  }

  async resumeDownload(downloadId: string): Promise<boolean> {
    const store = useDownloadsStore.getState();
    const download = store.downloads.find((d) => d.id === downloadId);

    if (!download || download.status !== "paused") {
      return false;
    }

    this.activeDownloads.delete(downloadId);
    store.updateDownload(downloadId, { status: "pending", progress: 0 });

    const updatedDownload = store.downloads.find((d) => d.id === downloadId);
    if (updatedDownload) {
      this.emitEvent({ type: "resume", downloadId, download: updatedDownload });
    }

    this.processQueue();
    return true;
  }

  async cancelDownload(downloadId: string): Promise<boolean> {
    const active = this.activeDownloads.get(downloadId);

    if (active) {
      active.abortController.abort();
      this.activeDownloads.delete(downloadId);
    }

    const store = useDownloadsStore.getState();
    const download = store.downloads.find((d) => d.id === downloadId);

    if (download) {
      if (download.localPath) {
        try {
          const file = new File(download.localPath);
          if (file.exists) {
            file.delete();
          }
        } catch {
          // Ignore
        }
      }

      store.removeDownload(downloadId);
      this.emitEvent({ type: "cancel", downloadId, download });
    }

    this.processQueue();
    return true;
  }

  async retryDownload(downloadId: string): Promise<boolean> {
    const store = useDownloadsStore.getState();
    const download = store.downloads.find((d) => d.id === downloadId);

    if (!download || download.status !== "failed") {
      return false;
    }

    store.updateDownload(downloadId, {
      status: "pending",
      progress: 0,
      error: null,
    });

    this.processQueue();
    return true;
  }

  async deleteDownloadedFile(downloadId: string): Promise<boolean> {
    const store = useDownloadsStore.getState();
    const download = store.downloads.find((d) => d.id === downloadId);

    if (!download?.localPath) {
      return false;
    }

    try {
      const file = new File(download.localPath);
      if (file.exists) {
        file.delete();
      }

      if (download.thumbnail) {
        try {
          const thumbFile = new File(download.thumbnail);
          if (thumbFile.exists) {
            thumbFile.delete();
          }
        } catch {
          // Ignore
        }
      }

      store.removeDownload(downloadId);
      return true;
    } catch {
      return false;
    }
  }

  getDownloadStatus(downloadId: string): DownloadStatus | null {
    const store = useDownloadsStore.getState();
    const download = store.downloads.find((d) => d.id === downloadId);
    return download?.status ?? null;
  }

  isDownloadActive(downloadId: string): boolean {
    const active = this.activeDownloads.get(downloadId);
    return active !== undefined && !active.isPaused;
  }

  getActiveDownloadIds(): string[] {
    const ids: string[] = [];
    for (const [id, active] of this.activeDownloads) {
      if (!active.isPaused) {
        ids.push(id);
      }
    }
    return ids;
  }

  async getStorageUsed(): Promise<number> {
    try {
      if (!this.downloadsDir.exists) {
        return 0;
      }

      const contents = this.downloadsDir.list();
      let totalSize = 0;

      for (const item of contents) {
        if (item instanceof File) {
          const info = item.size;
          if (info !== undefined) {
            totalSize += info;
          }
        }
      }

      return totalSize;
    } catch {
      return 0;
    }
  }

  async clearAllDownloads(): Promise<void> {
    for (const downloadId of this.activeDownloads.keys()) {
      await this.cancelDownload(downloadId);
    }

    try {
      if (this.downloadsDir.exists) {
        this.downloadsDir.delete();
      }
      if (this.thumbnailsDir.exists) {
        this.thumbnailsDir.delete();
      }
    } catch {
      // Ignore
    }

    await this.ensureDirectoriesExist();

    const store = useDownloadsStore.getState();
    for (const download of [...store.downloads]) {
      store.removeDownload(download.id);
    }
  }
}

export const downloadManager = new DownloadManager();

export type { DownloadEvent, DownloadEventType, DownloadProgress };
