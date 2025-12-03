import type { Download } from "@/stores";
import Constants from "expo-constants";
import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { downloadManager } from "./download-manager";
import { getPlatformDisplayName } from "./url-processor";

const CHANNEL_ID = "downloads";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface NotificationData {
  type: "download_complete" | "download_failed" | "download_started";
  downloadId: string;
  action?: "view" | "retry";
  [key: string]: unknown;
}

type NotificationActionCallback = (data: NotificationData) => void;

class NotificationService {
  private isInitialized = false;
  private responseSubscription: Notifications.Subscription | null = null;
  private actionCallback: NotificationActionCallback | null = null;
  private downloadEventUnsubscribe: (() => void) | null = null;

  private isExpoGo(): boolean {
    return Constants.appOwnership === "expo";
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    if (Platform.OS === "android") {
      await this.createNotificationChannel();
    }

    this.setupNotificationResponseListener();
    this.setupDownloadEventListener();
    this.isInitialized = true;
  }

  private async createNotificationChannel(): Promise<void> {
    if (Platform.OS !== "android") return;

    try {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: "Downloads",
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#6366F1",
        lockscreenVisibility:
          Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: false,
        description: "Notifications for video download status",
      });
    } catch (err) {
      console.warn("Failed to create notification channel:", err);
    }
  }

  private setupNotificationResponseListener(): void {
    this.responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const rawData = response.notification.request.content.data;

        if (
          rawData &&
          typeof rawData === "object" &&
          "type" in rawData &&
          "downloadId" in rawData
        ) {
          const data = rawData as NotificationData;

          if (this.actionCallback) {
            if (
              response.actionIdentifier === "retry" &&
              data.type === "download_failed"
            ) {
              this.actionCallback({ ...data, action: "retry" });
            } else {
              this.actionCallback({ ...data, action: "view" });
            }
          }
        }
      });
  }

  private setupDownloadEventListener(): void {
    this.downloadEventUnsubscribe = downloadManager.addEventListener(
      (event) => {
        switch (event.type) {
          case "start":
            this.notifyDownloadStarted(event.download);
            break;
          case "complete":
            this.notifyDownloadComplete(event.download);
            break;
          case "fail":
            this.notifyDownloadFailed(event.download, event.error);
            break;
        }
      }
    );
  }

  setActionCallback(callback: NotificationActionCallback | null): void {
    this.actionCallback = callback;
  }

  private async notifyDownloadStarted(download: Download): Promise<void> {
    if (this.isExpoGo() && Platform.OS === "android") {
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Download Started",
          body: `Downloading: ${this.truncateTitle(download.title)}`,
          data: {
            type: "download_started",
            downloadId: download.id,
          } as NotificationData,
          ...(Platform.OS === "android" && { channelId: CHANNEL_ID }),
        },
        trigger: null,
      });
    } catch (err) {
      console.warn("Failed to send download started notification:", err);
    }
  }

  private async notifyDownloadComplete(download: Download): Promise<void> {
    if (this.isExpoGo() && Platform.OS === "android") {
      return;
    }

    try {
      await this.dismissDownloadStartedNotification(download.id);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Download Complete",
          body: `${this.truncateTitle(download.title)} is ready to watch`,
          data: {
            type: "download_complete",
            downloadId: download.id,
          } as NotificationData,
          ...(Platform.OS === "android" && { channelId: CHANNEL_ID }),
        },
        trigger: null,
      });
    } catch (err) {
      console.warn("Failed to send download complete notification:", err);
    }
  }

  private async notifyDownloadFailed(
    download: Download,
    error?: string
  ): Promise<void> {
    if (this.isExpoGo() && Platform.OS === "android") {
      return;
    }

    try {
      await this.dismissDownloadStartedNotification(download.id);

      const platformName = getPlatformDisplayName(download.platform);
      const errorMessage = error ?? "An error occurred";

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Download Failed",
          body: `Failed to download ${platformName} video: ${this.truncateMessage(
            errorMessage
          )}`,
          data: {
            type: "download_failed",
            downloadId: download.id,
          } as NotificationData,
          ...(Platform.OS === "android" && { channelId: CHANNEL_ID }),
          categoryIdentifier: "download_failed",
        },
        trigger: null,
      });
    } catch (err) {
      console.warn("Failed to send download failed notification:", err);
    }
  }

  private async dismissDownloadStartedNotification(
    downloadId: string
  ): Promise<void> {
    try {
      const presentedNotifications =
        await Notifications.getPresentedNotificationsAsync();

      for (const notification of presentedNotifications) {
        const rawData = notification.request.content.data;
        if (
          rawData &&
          typeof rawData === "object" &&
          "downloadId" in rawData &&
          "type" in rawData &&
          rawData.downloadId === downloadId &&
          rawData.type === "download_started"
        ) {
          await Notifications.dismissNotificationAsync(
            notification.request.identifier
          );
        }
      }
    } catch {
      // Ignore errors when dismissing
    }
  }

  private truncateTitle(title: string, maxLength = 40): string {
    if (title.length <= maxLength) return title;
    return `${title.slice(0, maxLength - 3)}...`;
  }

  private truncateMessage(message: string, maxLength = 60): string {
    if (message.length <= maxLength) return message;
    return `${message.slice(0, maxLength - 3)}...`;
  }

  async clearAllNotifications(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
    } catch {
      // Ignore
    }
  }

  async cancelScheduledNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch {
      // Ignore
    }
  }

  async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch {
      return 0;
    }
  }

  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch {
      // Ignore
    }
  }

  cleanup(): void {
    if (this.responseSubscription) {
      this.responseSubscription.remove();
      this.responseSubscription = null;
    }
    if (this.downloadEventUnsubscribe) {
      this.downloadEventUnsubscribe();
      this.downloadEventUnsubscribe = null;
    }
    this.actionCallback = null;
    this.isInitialized = false;
  }
}

export const notificationService = new NotificationService();

export async function setupNotificationCategories(): Promise<void> {
  if (Platform.OS !== "ios") return;

  try {
    await Notifications.setNotificationCategoryAsync("download_failed", [
      {
        identifier: "retry",
        buttonTitle: "Retry",
        options: {
          opensAppToForeground: true,
        },
      },
    ]);
  } catch {
    // Ignore
  }
}

export function createVideoDeepLink(downloadId: string): string {
  return Linking.createURL(`video/${downloadId}`);
}

export type { NotificationActionCallback, NotificationData };
