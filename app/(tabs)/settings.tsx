import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  getPermissionsStatus,
  openSettings,
  type PermissionsState,
} from "@/services/permissions";
import { useLibraryStore, useSettingsStore } from "@/stores";
import Constants from "expo-constants";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  AppState,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface SettingRowProps {
  icon: React.ComponentProps<typeof IconSymbol>["name"];
  iconColor?: string;
  title: string;
  subtitle?: string;
  value?: React.ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
}

function SettingRow({
  icon,
  iconColor,
  title,
  subtitle,
  value,
  onPress,
  showChevron = false,
}: SettingRowProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const content = (
    <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: iconColor ?? colors.tint },
        ]}
      >
        <IconSymbol name={icon} size={18} color="#FFFFFF" />
      </View>
      <View style={styles.settingContent}>
        <ThemedText style={styles.settingTitle}>{title}</ThemedText>
        {subtitle && (
          <ThemedText
            style={[styles.settingSubtitle, { color: colors.textSecondary }]}
          >
            {subtitle}
          </ThemedText>
        )}
      </View>
      {value}
      {showChevron && (
        <IconSymbol
          name="chevron.right"
          size={16}
          color={colors.textTertiary}
        />
      )}
    </View>
  );

  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }
  return content;
}

function SettingSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  return (
    <View style={styles.section}>
      <ThemedText
        style={[styles.sectionTitle, { color: colors.textSecondary }]}
      >
        {title}
      </ThemedText>
      <View
        style={[
          styles.sectionContent,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function SettingsScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  const [permissions, setPermissions] = useState<PermissionsState>({
    notifications: "undetermined",
    mediaLibrary: "undetermined",
  });

  const {
    defaultQuality,
    wifiOnlyDownload,
    clipboardDetectionEnabled,
    notificationsEnabled,
    setWifiOnlyDownload,
    setClipboardDetectionEnabled,
    setNotificationsEnabled,
  } = useSettingsStore();

  const storageUsed = useLibraryStore((state) => state.getTotalStorageUsed());
  const videoCount = useLibraryStore((state) => state.videos.length);

  const appVersion = Constants.expoConfig?.version ?? "1.0.0";

  const checkPermissions = useCallback(async () => {
    const status = await getPermissionsStatus();
    setPermissions(status);
  }, []);

  useEffect(() => {
    checkPermissions();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        checkPermissions();
      }
    });
    return () => subscription.remove();
  }, [checkPermissions]);

  const getPermissionStatus = (status: PermissionsState["notifications"]) => {
    switch (status) {
      case "granted":
        return { text: "Enabled", color: colors.success };
      case "denied":
        return { text: "Denied", color: colors.error };
      default:
        return { text: "Not Set", color: colors.textTertiary };
    }
  };

  const notificationStatus = getPermissionStatus(permissions.notifications);
  const mediaLibraryStatus = getPermissionStatus(permissions.mediaLibrary);

  const handleOpenSettings = useCallback(async () => {
    await openSettings();
  }, []);

  const handleSendFeedback = useCallback(async () => {
    const mailtoUrl = "mailto:support@vidly.app";
    try {
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
      } else {
        Alert.alert(
          "Email Not Available",
          "Please email us at support@vidly.app",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      Alert.alert(
        "Email Not Available",
        "Please email us at support@vidly.app",
        [{ text: "OK" }]
      );
    }
  }, []);

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <SettingSection title="Downloads">
          <SettingRow
            icon="arrow.down.circle.fill"
            iconColor={colors.tint}
            title="Default Quality"
            subtitle={
              defaultQuality === "highest"
                ? "Highest Available"
                : defaultQuality
            }
            showChevron
          />
          <SettingRow
            icon="wifi"
            iconColor="#34D399"
            title="Wi-Fi Only"
            subtitle="Only download when connected to Wi-Fi"
            value={
              <Switch
                value={wifiOnlyDownload}
                onValueChange={setWifiOnlyDownload}
                trackColor={{
                  false: colors.surfaceSecondary,
                  true: colors.tint,
                }}
              />
            }
          />
        </SettingSection>

        <SettingSection title="Behavior">
          <SettingRow
            icon="doc.on.clipboard.fill"
            iconColor="#F59E0B"
            title="Clipboard Detection"
            subtitle="Prompt when video URL is copied"
            value={
              <Switch
                value={clipboardDetectionEnabled}
                onValueChange={setClipboardDetectionEnabled}
                trackColor={{
                  false: colors.surfaceSecondary,
                  true: colors.tint,
                }}
              />
            }
          />
          <SettingRow
            icon="bell.fill"
            iconColor="#EF4444"
            title="Notifications"
            subtitle="Download status notifications"
            value={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{
                  false: colors.surfaceSecondary,
                  true: colors.tint,
                }}
              />
            }
          />
        </SettingSection>

        <SettingSection title="Storage">
          <SettingRow
            icon="internaldrive.fill"
            iconColor="#6366F1"
            title="Storage Used"
            subtitle={`${videoCount} videos`}
            value={
              <ThemedText
                style={[styles.valueText, { color: colors.textSecondary }]}
              >
                {formatBytes(storageUsed)}
              </ThemedText>
            }
          />
          <SettingRow
            icon="trash.fill"
            iconColor="#EF4444"
            title="Clear All Downloads"
            onPress={() => {}}
            showChevron
          />
        </SettingSection>

        <SettingSection title="Permissions">
          <SettingRow
            icon="bell.fill"
            iconColor="#EF4444"
            title="Notifications"
            subtitle="Download status alerts"
            value={
              <ThemedText
                style={[styles.statusText, { color: notificationStatus.color }]}
              >
                {notificationStatus.text}
              </ThemedText>
            }
            onPress={handleOpenSettings}
            showChevron
          />
          <SettingRow
            icon="photo.fill"
            iconColor="#10B981"
            title="Photo Library"
            subtitle="Save videos to camera roll"
            value={
              <ThemedText
                style={[styles.statusText, { color: mediaLibraryStatus.color }]}
              >
                {mediaLibraryStatus.text}
              </ThemedText>
            }
            onPress={handleOpenSettings}
            showChevron
          />
        </SettingSection>

        <SettingSection title="About">
          <SettingRow
            icon="star.fill"
            iconColor="#FBBF24"
            title="Rate Vidly"
            onPress={() => {}}
            showChevron
          />
          <SettingRow
            icon="envelope.fill"
            iconColor="#10B981"
            title="Send Feedback"
            onPress={handleSendFeedback}
            showChevron
          />
          <SettingRow
            icon="doc.text.fill"
            iconColor="#6B7280"
            title="Privacy Policy"
            onPress={() => {}}
            showChevron
          />
          <SettingRow
            icon="info.circle.fill"
            iconColor={colors.tint}
            title="Version"
            value={
              <ThemedText
                style={[styles.valueText, { color: colors.textSecondary }]}
              >
                {appVersion}
              </ThemedText>
            }
          />
        </SettingSection>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  sectionContent: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  settingSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  valueText: {
    fontSize: 15,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "500",
  },
});
