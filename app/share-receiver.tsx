import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Colors, Spacing, Typography } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  apiClient,
  type VideoMetadata,
  type VideoQuality,
} from "@/services/api-client";
import { useDownloadsStore } from "@/stores/downloads";
import { BlurView } from "expo-blur";
import { router, useLocalSearchParams } from "expo-router";
import type { SymbolViewProps } from "expo-symbols";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const MODAL_WIDTH = Math.min(SCREEN_WIDTH - 48, 380);

type LoadingState = "idle" | "extracting" | "ready" | "downloading" | "error";

export default function ShareReceiverScreen() {
  const { url } = useLocalSearchParams<{ url: string }>();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<VideoQuality | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const addDownload = useDownloadsStore((s) => s.addDownload);
  const getDownloadByUrl = useDownloadsStore((s) => s.getDownloadByUrl);

  const extractMetadata = useCallback(async () => {
    if (!url) {
      setErrorMessage("No URL provided");
      setLoadingState("error");
      return;
    }

    const existingDownload = getDownloadByUrl(url);
    if (existingDownload) {
      if (existingDownload.status === "completed") {
        setErrorMessage("This video has already been downloaded");
        setLoadingState("error");
        return;
      }
      if (
        existingDownload.status === "downloading" ||
        existingDownload.status === "pending"
      ) {
        router.back();
        router.push("/(tabs)");
        return;
      }
    }

    setLoadingState("extracting");
    setErrorMessage(null);

    const result = await apiClient.extractMetadata(url);

    if (!result.success) {
      setErrorMessage(result.error.message);
      setLoadingState("error");
      return;
    }

    setMetadata(result.metadata);

    if (result.metadata.qualities.length > 0) {
      const bestQuality = result.metadata.qualities.reduce((best, current) => {
        const currentHeight = parseInt(
          current.resolution?.replace("p", "") ?? "0",
          10
        );
        const bestHeight = parseInt(
          best.resolution?.replace("p", "") ?? "0",
          10
        );
        return currentHeight > bestHeight ? current : best;
      }, result.metadata.qualities[0]);
      setSelectedQuality(bestQuality);
    }

    setLoadingState("ready");
  }, [url, getDownloadByUrl]);

  useEffect(() => {
    if (url) {
      extractMetadata();
    }
  }, [url, extractMetadata]);

  const handleDownload = useCallback(() => {
    if (!metadata || !url) return;

    addDownload({
      sourceUrl: url,
      platform: metadata.platform,
      title: metadata.title,
      thumbnail: metadata.thumbnail,
      localPath: null,
      duration: metadata.duration,
      resolution: selectedQuality?.resolution ?? null,
      fileSize: selectedQuality?.fileSize ?? null,
      downloadedAt: null,
    });

    router.back();
    router.push("/(tabs)");
  }, [metadata, url, selectedQuality, addDownload]);

  const handleCancel = useCallback(() => {
    router.back();
  }, []);

  const handleRetry = useCallback(() => {
    extractMetadata();
  }, [extractMetadata]);

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return "";
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getPlatformIcon = (platform: string): SymbolViewProps["name"] => {
    const icons: Record<string, SymbolViewProps["name"]> = {
      youtube: "play.rectangle.fill",
      tiktok: "music.note",
      instagram: "camera.fill",
      twitter: "bubble.left.fill",
      facebook: "person.2.fill",
      vimeo: "play.circle.fill",
    };
    return icons[platform] ?? "link";
  };

  const styles = createStyles(colors, insets);

  const platformIconName = metadata
    ? getPlatformIcon(metadata.platform)
    : "link";

  return (
    <View style={styles.container}>
      <Pressable style={styles.backdrop} onPress={handleCancel}>
        <BlurView
          intensity={20}
          style={StyleSheet.absoluteFill}
          tint={colorScheme}
        />
      </Pressable>

      <View style={styles.modal}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Save Video</Text>
          <Pressable onPress={handleCancel} hitSlop={12}>
            <IconSymbol
              name="xmark.circle.fill"
              size={28}
              color={colors.textSecondary}
            />
          </Pressable>
        </View>

        {loadingState === "extracting" && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.tint} />
            <Text style={styles.loadingText}>Extracting video info...</Text>
            <Text style={styles.loadingUrl} numberOfLines={1}>
              {url}
            </Text>
          </View>
        )}

        {loadingState === "error" && (
          <View style={styles.errorContainer}>
            <IconSymbol
              name="exclamationmark.triangle.fill"
              size={48}
              color={colors.error}
            />
            <Text style={styles.errorText}>{errorMessage}</Text>
            <Pressable style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </Pressable>
          </View>
        )}

        {loadingState === "ready" && metadata && (
          <ScrollView
            style={styles.contentScroll}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {metadata.thumbnail && (
              <View style={styles.thumbnailContainer}>
                <Image
                  source={{ uri: metadata.thumbnail }}
                  style={styles.thumbnail}
                />
                {metadata.duration && (
                  <View style={styles.durationBadge}>
                    <Text style={styles.durationText}>
                      {formatDuration(metadata.duration)}
                    </Text>
                  </View>
                )}
              </View>
            )}

            <View style={styles.metadataSection}>
              <View style={styles.platformRow}>
                <IconSymbol
                  name={platformIconName}
                  size={16}
                  color={colors.tint}
                />
                <Text style={styles.platformText}>
                  {metadata.platform.charAt(0).toUpperCase() +
                    metadata.platform.slice(1)}
                </Text>
              </View>

              <Text style={styles.title} numberOfLines={2}>
                {metadata.title}
              </Text>

              {metadata.author && (
                <View style={styles.authorRow}>
                  {metadata.authorAvatar && (
                    <Image
                      source={{ uri: metadata.authorAvatar }}
                      style={styles.authorAvatar}
                    />
                  )}
                  <Text style={styles.authorText}>{metadata.author}</Text>
                </View>
              )}
            </View>

            {metadata.qualities.length > 1 && (
              <View style={styles.qualitySection}>
                <Text style={styles.sectionTitle}>Quality</Text>
                <View style={styles.qualityOptions}>
                  {metadata.qualities.map((quality) => {
                    const isSelected = selectedQuality?.id === quality.id;
                    return (
                      <Pressable
                        key={quality.id}
                        style={[
                          styles.qualityOption,
                          isSelected && styles.qualityOptionSelected,
                        ]}
                        onPress={() => setSelectedQuality(quality)}
                      >
                        <Text
                          style={[
                            styles.qualityLabel,
                            isSelected && styles.qualityLabelSelected,
                          ]}
                        >
                          {quality.label}
                        </Text>
                        {quality.fileSize && (
                          <Text
                            style={[
                              styles.qualitySize,
                              isSelected && styles.qualitySizeSelected,
                            ]}
                          >
                            {formatFileSize(quality.fileSize)}
                          </Text>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
          </ScrollView>
        )}

        {loadingState === "ready" && (
          <View style={styles.footer}>
            <Pressable style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.downloadButton} onPress={handleDownload}>
              <IconSymbol
                name="arrow.down.circle.fill"
                size={20}
                color="#FFFFFF"
              />
              <Text style={styles.downloadButtonText}>Download</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

function createStyles(
  colors: (typeof Colors)["light"] | (typeof Colors)["dark"],
  insets: { bottom: number }
) {
  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0, 0, 0, 0.4)",
    },
    modal: {
      width: MODAL_WIDTH,
      maxHeight: "80%",
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.xl,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 24,
      elevation: 16,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      ...Typography.headline,
      color: colors.text,
    },
    loadingContainer: {
      padding: Spacing["2xl"],
      alignItems: "center",
      gap: Spacing.md,
    },
    loadingText: {
      ...Typography.body,
      color: colors.text,
    },
    loadingUrl: {
      ...Typography.caption1,
      color: colors.textSecondary,
      maxWidth: "100%",
    },
    errorContainer: {
      padding: Spacing["2xl"],
      alignItems: "center",
      gap: Spacing.lg,
    },
    errorText: {
      ...Typography.body,
      color: colors.text,
      textAlign: "center",
    },
    retryButton: {
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.sm,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: BorderRadius.md,
    },
    retryButtonText: {
      ...Typography.callout,
      fontWeight: "600",
      color: colors.tint,
    },
    contentScroll: {
      flex: 1,
    },
    contentContainer: {
      padding: Spacing.lg,
      gap: Spacing.lg,
    },
    thumbnailContainer: {
      width: "100%",
      aspectRatio: 16 / 9,
      borderRadius: BorderRadius.lg,
      overflow: "hidden",
      backgroundColor: colors.surfaceSecondary,
    },
    thumbnail: {
      width: "100%",
      height: "100%",
    },
    durationBadge: {
      position: "absolute",
      bottom: Spacing.sm,
      right: Spacing.sm,
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.sm,
    },
    durationText: {
      ...Typography.caption1,
      fontWeight: "600",
      color: "#FFFFFF",
    },
    metadataSection: {
      gap: Spacing.sm,
    },
    platformRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs,
    },
    platformText: {
      ...Typography.footnote,
      fontWeight: "500",
      color: colors.tint,
    },
    title: {
      ...Typography.headline,
      color: colors.text,
    },
    authorRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
    },
    authorAvatar: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.surfaceSecondary,
    },
    authorText: {
      ...Typography.subheadline,
      color: colors.textSecondary,
    },
    qualitySection: {
      gap: Spacing.sm,
    },
    sectionTitle: {
      ...Typography.footnote,
      fontWeight: "600",
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    qualityOptions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.sm,
    },
    qualityOption: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.md,
      backgroundColor: colors.surfaceSecondary,
      borderWidth: 2,
      borderColor: "transparent",
    },
    qualityOptionSelected: {
      backgroundColor: colors.tint + "15",
      borderColor: colors.tint,
    },
    qualityLabel: {
      ...Typography.callout,
      fontWeight: "600",
      color: colors.text,
    },
    qualityLabelSelected: {
      color: colors.tint,
    },
    qualitySize: {
      ...Typography.caption2,
      color: colors.textSecondary,
      marginTop: 2,
    },
    qualitySizeSelected: {
      color: colors.tint,
    },
    footer: {
      flexDirection: "row",
      padding: Spacing.lg,
      gap: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: Spacing.md,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surfaceSecondary,
      borderRadius: BorderRadius.lg,
    },
    cancelButtonText: {
      ...Typography.callout,
      fontWeight: "600",
      color: colors.text,
    },
    downloadButton: {
      flex: 2,
      flexDirection: "row",
      paddingVertical: Spacing.md,
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing.sm,
      backgroundColor: colors.tint,
      borderRadius: BorderRadius.lg,
    },
    downloadButtonText: {
      ...Typography.callout,
      fontWeight: "600",
      color: "#FFFFFF",
    },
  });
}
