import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ProgressBar } from "@/components/ui/progress-bar";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useDownloadsStore, type Download } from "@/stores";
import { useCallback } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function formatProgress(progress: number): string {
  return `${Math.round(progress)}%`;
}

type ThemeColors = typeof Colors.light | typeof Colors.dark;

function DownloadItem({
  download,
  colors,
}: {
  download: Download;
  colors: ThemeColors;
}) {
  const updateDownload = useDownloadsStore((state) => state.updateDownload);
  const removeDownload = useDownloadsStore((state) => state.removeDownload);

  const getStatusColor = () => {
    switch (download.status) {
      case "completed":
        return colors.success;
      case "failed":
        return colors.error;
      case "paused":
        return colors.warning;
      default:
        return colors.tint;
    }
  };

  const getStatusIcon = ():
    | "checkmark.circle.fill"
    | "xmark.circle.fill"
    | "pause.circle.fill"
    | "arrow.down.circle.fill"
    | "clock.fill" => {
    switch (download.status) {
      case "completed":
        return "checkmark.circle.fill";
      case "failed":
        return "xmark.circle.fill";
      case "paused":
        return "pause.circle.fill";
      case "downloading":
        return "arrow.down.circle.fill";
      default:
        return "clock.fill";
    }
  };

  const handlePauseResume = () => {
    if (download.status === "downloading") {
      updateDownload(download.id, { status: "paused" });
    } else if (download.status === "paused") {
      updateDownload(download.id, { status: "downloading" });
    }
  };

  const handleRetry = () => {
    updateDownload(download.id, {
      status: "pending",
      progress: 0,
      error: null,
    });
  };

  const handleCancel = () => {
    removeDownload(download.id);
  };

  return (
    <View
      style={[
        styles.downloadItem,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.downloadHeader}>
        <IconSymbol name={getStatusIcon()} size={20} color={getStatusColor()} />
        <View style={styles.downloadInfo}>
          <ThemedText numberOfLines={1} style={styles.downloadTitle}>
            {download.title || "Fetching video info..."}
          </ThemedText>
          <ThemedText
            style={[styles.downloadMeta, { color: colors.textSecondary }]}
          >
            {download.platform} •{" "}
            {download.status === "downloading"
              ? formatProgress(download.progress)
              : download.status}
          </ThemedText>
        </View>
      </View>

      {download.status === "downloading" && (
        <ProgressBar progress={download.progress} style={styles.progressBar} />
      )}

      {download.error && (
        <ThemedText style={[styles.errorText, { color: colors.error }]}>
          {download.error}
        </ThemedText>
      )}

      <View style={styles.downloadActions}>
        {download.status === "downloading" && (
          <Button
            title="Pause"
            variant="ghost"
            size="sm"
            onPress={handlePauseResume}
          />
        )}
        {download.status === "paused" && (
          <Button
            title="Resume"
            variant="ghost"
            size="sm"
            onPress={handlePauseResume}
          />
        )}
        {download.status === "failed" && (
          <Button
            title="Retry"
            variant="ghost"
            size="sm"
            onPress={handleRetry}
          />
        )}
        {download.status !== "completed" && (
          <Button
            title="Cancel"
            variant="ghost"
            size="sm"
            onPress={handleCancel}
          />
        )}
      </View>
    </View>
  );
}

export default function DownloadsScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const downloads = useDownloadsStore((state) => state.downloads);
  const activeDownloads = downloads.filter(
    (d) =>
      d.status === "downloading" ||
      d.status === "pending" ||
      d.status === "paused"
  );
  const completedDownloads = downloads.filter((d) => d.status === "completed");
  const failedDownloads = downloads.filter((d) => d.status === "failed");

  const renderItem = useCallback(
    ({ item }: { item: Download }) => (
      <DownloadItem download={item} colors={colors} />
    ),
    [colors]
  );

  const keyExtractor = useCallback((item: Download) => item.id, []);

  if (downloads.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <EmptyState
          icon={
            <IconSymbol
              name="arrow.down.circle"
              size={64}
              color={colors.textTertiary}
            />
          }
          title="No downloads"
          description="When you start downloading videos, they'll appear here. Share a video link from any app to get started."
        />
      </ThemedView>
    );
  }

  const sections = [
    { title: "Active", data: activeDownloads },
    { title: "Completed", data: completedDownloads },
    { title: "Failed", data: failedDownloads },
  ].filter((section) => section.data.length > 0);

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={downloads}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + Spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: Spacing.md,
  },
  downloadItem: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
  },
  downloadHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  downloadInfo: {
    flex: 1,
  },
  downloadTitle: {
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 20,
  },
  downloadMeta: {
    fontSize: 13,
    marginTop: Spacing.xs,
    textTransform: "capitalize",
  },
  progressBar: {
    marginTop: Spacing.md,
  },
  errorText: {
    fontSize: 13,
    marginTop: Spacing.sm,
  },
  downloadActions: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
});
