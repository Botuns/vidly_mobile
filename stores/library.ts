import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Platform } from "./downloads";
import { zustandStorage } from "./storage";

export interface Video {
  id: string;
  sourceUrl: string;
  platform: Platform;
  title: string;
  thumbnailPath: string;
  videoPath: string;
  duration: number;
  resolution: string;
  fileSize: number;
  downloadedAt: string;
}

export type SortBy = "date" | "name" | "size" | "duration";
export type SortOrder = "asc" | "desc";

interface LibraryState {
  videos: Video[];
  sortBy: SortBy;
  sortOrder: SortOrder;
  filterPlatform: Platform | "all";
  searchQuery: string;

  addVideo: (video: Video) => void;
  removeVideo: (id: string) => void;
  removeVideos: (ids: string[]) => void;
  clearLibrary: () => void;
  setSortBy: (sortBy: SortBy) => void;
  setSortOrder: (order: SortOrder) => void;
  setFilterPlatform: (platform: Platform | "all") => void;
  setSearchQuery: (query: string) => void;
  getFilteredVideos: () => Video[];
  getTotalStorageUsed: () => number;
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      videos: [],
      sortBy: "date",
      sortOrder: "desc",
      filterPlatform: "all",
      searchQuery: "",

      addVideo: (video) => {
        set((state) => ({
          videos: [video, ...state.videos],
        }));
      },

      removeVideo: (id) => {
        set((state) => ({
          videos: state.videos.filter((v) => v.id !== id),
        }));
      },

      removeVideos: (ids) => {
        set((state) => ({
          videos: state.videos.filter((v) => !ids.includes(v.id)),
        }));
      },

      clearLibrary: () => {
        set({ videos: [] });
      },

      setSortBy: (sortBy) => {
        set({ sortBy });
      },

      setSortOrder: (order) => {
        set({ sortOrder: order });
      },

      setFilterPlatform: (platform) => {
        set({ filterPlatform: platform });
      },

      setSearchQuery: (query) => {
        set({ searchQuery: query });
      },

      getFilteredVideos: () => {
        const { videos, sortBy, sortOrder, filterPlatform, searchQuery } =
          get();

        let filtered = [...videos];

        if (filterPlatform !== "all") {
          filtered = filtered.filter((v) => v.platform === filterPlatform);
        }

        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter((v) =>
            v.title.toLowerCase().includes(query)
          );
        }

        filtered.sort((a, b) => {
          let comparison = 0;
          switch (sortBy) {
            case "date":
              comparison =
                new Date(a.downloadedAt).getTime() -
                new Date(b.downloadedAt).getTime();
              break;
            case "name":
              comparison = a.title.localeCompare(b.title);
              break;
            case "size":
              comparison = a.fileSize - b.fileSize;
              break;
            case "duration":
              comparison = a.duration - b.duration;
              break;
          }
          return sortOrder === "asc" ? comparison : -comparison;
        });

        return filtered;
      },

      getTotalStorageUsed: () => {
        return get().videos.reduce((total, v) => total + v.fileSize, 0);
      },
    }),
    {
      name: "library-storage",
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
