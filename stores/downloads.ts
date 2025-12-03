import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { zustandStorage } from "./storage";

export type DownloadStatus =
  | "pending"
  | "downloading"
  | "completed"
  | "failed"
  | "paused";
export type Platform =
  | "youtube"
  | "tiktok"
  | "instagram"
  | "twitter"
  | "facebook"
  | "vimeo"
  | "other";

export interface Download {
  id: string;
  sourceUrl: string;
  platform: Platform;
  title: string;
  thumbnail: string | null;
  localPath: string | null;
  duration: number | null;
  resolution: string | null;
  fileSize: number | null;
  downloadedAt: string | null;
  status: DownloadStatus;
  progress: number;
  error: string | null;
  createdAt: string;
}

interface DownloadsState {
  downloads: Download[];
  activeDownloadIds: string[];
  maxConcurrentDownloads: number;

  addDownload: (
    download: Omit<
      Download,
      "id" | "createdAt" | "status" | "progress" | "error"
    >
  ) => string;
  updateDownload: (id: string, updates: Partial<Download>) => void;
  removeDownload: (id: string) => void;
  clearCompleted: () => void;
  clearFailed: () => void;
  getDownloadByUrl: (url: string) => Download | undefined;
  getActiveDownloads: () => Download[];
  getPendingDownloads: () => Download[];
  getCompletedDownloads: () => Download[];
}

export const useDownloadsStore = create<DownloadsState>()(
  persist(
    (set, get) => ({
      downloads: [],
      activeDownloadIds: [],
      maxConcurrentDownloads: 2,

      addDownload: (download) => {
        const id = `dl_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const newDownload: Download = {
          ...download,
          id,
          status: "pending",
          progress: 0,
          error: null,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          downloads: [newDownload, ...state.downloads],
        }));
        return id;
      },

      updateDownload: (id, updates) => {
        set((state) => ({
          downloads: state.downloads.map((dl) =>
            dl.id === id ? { ...dl, ...updates } : dl
          ),
        }));
      },

      removeDownload: (id) => {
        set((state) => ({
          downloads: state.downloads.filter((dl) => dl.id !== id),
          activeDownloadIds: state.activeDownloadIds.filter(
            (dlId) => dlId !== id
          ),
        }));
      },

      clearCompleted: () => {
        set((state) => ({
          downloads: state.downloads.filter((dl) => dl.status !== "completed"),
        }));
      },

      clearFailed: () => {
        set((state) => ({
          downloads: state.downloads.filter((dl) => dl.status !== "failed"),
        }));
      },

      getDownloadByUrl: (url) => {
        return get().downloads.find((dl) => dl.sourceUrl === url);
      },

      getActiveDownloads: () => {
        return get().downloads.filter((dl) => dl.status === "downloading");
      },

      getPendingDownloads: () => {
        return get().downloads.filter((dl) => dl.status === "pending");
      },

      getCompletedDownloads: () => {
        return get().downloads.filter((dl) => dl.status === "completed");
      },
    }),
    {
      name: "downloads-storage",
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
