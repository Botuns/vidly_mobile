import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { zustandStorage } from "./storage";

export type VideoQuality = "highest" | "1080p" | "720p" | "480p" | "360p";
export type StorageLocation = "app" | "photos";

interface SettingsState {
  _hasHydrated: boolean;
  hasCompletedOnboarding: boolean;
  defaultQuality: VideoQuality;
  storageLocation: StorageLocation;
  wifiOnlyDownload: boolean;
  clipboardDetectionEnabled: boolean;
  notificationsEnabled: boolean;
  lastProcessedClipboardUrl: string | null;

  setHasHydrated: (state: boolean) => void;
  setOnboardingComplete: () => void;
  setDefaultQuality: (quality: VideoQuality) => void;
  setStorageLocation: (location: StorageLocation) => void;
  setWifiOnlyDownload: (enabled: boolean) => void;
  setClipboardDetectionEnabled: (enabled: boolean) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setLastProcessedClipboardUrl: (url: string | null) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      _hasHydrated: false,
      hasCompletedOnboarding: false,
      defaultQuality: "highest",
      storageLocation: "app",
      wifiOnlyDownload: false,
      clipboardDetectionEnabled: true,
      notificationsEnabled: true,
      lastProcessedClipboardUrl: null,

      setHasHydrated: (state) => {
        set({ _hasHydrated: state });
      },

      setOnboardingComplete: () => {
        set({ hasCompletedOnboarding: true });
      },

      setDefaultQuality: (quality) => {
        set({ defaultQuality: quality });
      },

      setStorageLocation: (location) => {
        set({ storageLocation: location });
      },

      setWifiOnlyDownload: (enabled) => {
        set({ wifiOnlyDownload: enabled });
      },

      setClipboardDetectionEnabled: (enabled) => {
        set({ clipboardDetectionEnabled: enabled });
      },

      setNotificationsEnabled: (enabled) => {
        set({ notificationsEnabled: enabled });
      },

      setLastProcessedClipboardUrl: (url) => {
        set({ lastProcessedClipboardUrl: url });
      },
    }),
    {
      name: "settings-storage",
      storage: createJSONStorage(() => zustandStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
