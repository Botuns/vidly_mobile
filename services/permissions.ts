import Constants from "expo-constants";
import * as MediaLibrary from "expo-media-library";
import * as Notifications from "expo-notifications";
import { Alert, Linking, Platform } from "react-native";

export type PermissionStatus = "granted" | "denied" | "undetermined";

export interface PermissionsState {
  notifications: PermissionStatus;
  mediaLibrary: PermissionStatus;
}

/**
 * Check if running in Expo Go (where some permissions don't work properly on Android).
 */
function isExpoGo(): boolean {
  return Constants.appOwnership === "expo";
}

/**
 * Get the current status of all required permissions.
 */
export async function getPermissionsStatus(): Promise<PermissionsState> {
  // On Android in Expo Go, permissions APIs have limitations
  if (Platform.OS === "android" && isExpoGo()) {
    return {
      notifications: "undetermined",
      mediaLibrary: "undetermined",
    };
  }

  const [notificationStatus, mediaLibraryStatus] = await Promise.all([
    getNotificationPermissionStatus(),
    getMediaLibraryPermissionStatus(),
  ]);

  return {
    notifications: notificationStatus,
    mediaLibrary: mediaLibraryStatus,
  };
}

/**
 * Check if all required permissions are granted.
 */
export async function areAllPermissionsGranted(): Promise<boolean> {
  const status = await getPermissionsStatus();
  return (
    status.notifications === "granted" && status.mediaLibrary === "granted"
  );
}

/**
 * Get notification permission status.
 */
async function getNotificationPermissionStatus(): Promise<PermissionStatus> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return mapExpoStatus(status);
  } catch (error) {
    // Notifications may not be fully supported in Expo Go on Android
    console.warn("Failed to get notification permission status:", error);
    return "undetermined";
  }
}

/**
 * Get media library permission status.
 */
async function getMediaLibraryPermissionStatus(): Promise<PermissionStatus> {
  try {
    const { status } = await MediaLibrary.getPermissionsAsync();
    return mapExpoStatus(status);
  } catch (error) {
    // Handle Android permission errors gracefully
    console.warn("Failed to get media library permission status:", error);
    return "undetermined";
  }
}

/**
 * Request notification permissions.
 */
export async function requestNotificationPermission(): Promise<PermissionStatus> {
  // On Android in Expo Go, notifications are limited
  if (Platform.OS === "android" && isExpoGo()) {
    return "granted"; // Assume granted since it's limited anyway
  }

  try {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();

    if (existingStatus === "granted") {
      return "granted";
    }

    const { status } = await Notifications.requestPermissionsAsync();

    if (status === "denied" && Platform.OS === "ios") {
      // On iOS, if denied, we need to direct user to settings
      showPermissionDeniedAlert("Notifications");
    }

    return mapExpoStatus(status);
  } catch (error) {
    console.warn("Failed to request notification permission:", error);
    return "undetermined";
  }
}

/**
 * Request media library permissions (read + write).
 */
export async function requestMediaLibraryPermission(): Promise<PermissionStatus> {
  // On Android in Expo Go, media library has limitations
  if (Platform.OS === "android" && isExpoGo()) {
    return "undetermined"; // Can't properly request in Expo Go
  }

  try {
    const { status: existingStatus } = await MediaLibrary.getPermissionsAsync();

    if (existingStatus === "granted") {
      return "granted";
    }

    const { status } = await MediaLibrary.requestPermissionsAsync();

    if (status === "denied") {
      showPermissionDeniedAlert("Photo Library");
    }

    return mapExpoStatus(status);
  } catch (error) {
    console.warn("Failed to request media library permission:", error);
    return "undetermined";
  }
}

/**
 * Request all permissions at once.
 */
export async function requestAllPermissions(): Promise<PermissionsState> {
  const [notifications, mediaLibrary] = await Promise.all([
    requestNotificationPermission(),
    requestMediaLibraryPermission(),
  ]);

  return { notifications, mediaLibrary };
}

/**
 * Map Expo permission status to our simplified status.
 */
function mapExpoStatus(
  status: MediaLibrary.PermissionStatus | Notifications.PermissionStatus
): PermissionStatus {
  switch (status) {
    case "granted":
      return "granted";
    case "denied":
      return "denied";
    default:
      return "undetermined";
  }
}

/**
 * Show alert when permission is denied, offering to open settings.
 */
function showPermissionDeniedAlert(permissionName: string): void {
  Alert.alert(
    `${permissionName} Access Required`,
    `Vidly needs ${permissionName.toLowerCase()} access to work properly. Please enable it in Settings.`,
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Open Settings",
        onPress: () => Linking.openSettings(),
      },
    ]
  );
}

/**
 * Open device settings.
 */
export async function openSettings(): Promise<void> {
  try {
    if (Platform.OS === "ios") {
      await Linking.openSettings();
    } else {
      // On Android, try to open app settings
      const canOpen = await Linking.canOpenURL("app-settings:");
      if (canOpen) {
        await Linking.openURL("app-settings:");
      } else {
        // Fallback to general settings
        await Linking.openSettings();
      }
    }
  } catch (error) {
    console.warn("Failed to open settings:", error);
    // Show a manual instruction if we can't open settings
    Alert.alert(
      "Open Settings",
      "Please open your device Settings app and navigate to Vidly to manage permissions.",
      [{ text: "OK" }]
    );
  }
}

/**
 * Get human-readable permission descriptions.
 */
export function getPermissionDescription(
  permission: keyof PermissionsState
): string {
  switch (permission) {
    case "notifications":
      return "Receive alerts when your downloads complete or fail";
    case "mediaLibrary":
      return "Save downloaded videos to your photo library";
    default:
      return "";
  }
}

/**
 * Get permission icon name.
 */
export function getPermissionIcon(
  permission: keyof PermissionsState
): "bell.fill" | "photo.fill" {
  switch (permission) {
    case "notifications":
      return "bell.fill";
    case "mediaLibrary":
      return "photo.fill";
    default:
      return "bell.fill";
  }
}
