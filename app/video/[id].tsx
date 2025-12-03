import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button } from "@/components/ui/button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useLibraryStore } from "@/stores";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Dimensions,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getPlatformDisplayName(platform: string): string {
  const names: Record<string, string> = {
    youtube: "YouTube",
    tiktok: "TikTok",
    instagram: "Instagram",
    twitter: "X (Twitter)",
    facebook: "Facebook",
    vimeo: "Vimeo",
  };
  return (
    names[platform] ?? platform.charAt(0).toUpperCase() + platform.slice(1)
  );
}

interface MetadataRowProps {
  icon: React.ComponentProps<typeof IconSymbol>["name"];
  label: string;
  value: string;
}

function MetadataRow({ icon, label, value }: MetadataRowProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  return (
    <View style={styles.metadataRow}>
      <IconSymbol name={icon} size={18} color={colors.textSecondary} />
      <ThemedText
        style={[styles.metadataLabel, { color: colors.textSecondary }]}
      >
        {label}
      </ThemedText>
      <ThemedText style={styles.metadataValue}>{value}</ThemedText>
    </View>
  );
}

export default function VideoDetailScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isPlaying, setIsPlaying] = useState(false);

  const video = useLibraryStore(
    useCallback((state) => state.videos.find((v) => v.id === id), [id])
  );
  const removeVideo = useLibraryStore((state) => state.removeVideo);

  const handlePlay = () => {
    setIsPlaying(true);
    // TODO: Implement video playback with expo-av
  };

  const handleShare = async () => {
    if (!video) return;

    try {
      await Share.share({
        message: `Check out this video: ${video.title}`,
        url: video.videoPath,
      });
    } catch {
      // User cancelled or error
    }
  };

  const handleOpenSource = () => {
    if (!video) return;
    // TODO: Open source URL in browser
  };

  const handleDelete = () => {
    if (!video) return;

    Alert.alert(
      "Delete Video",
      "Are you sure you want to delete this video? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            removeVideo(video.id);
            router.back();
          },
        },
      ]
    );
  };

  if (!video) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.notFound}>
          <IconSymbol
            name="exclamationmark.triangle.fill"
            size={48}
            color={colors.textTertiary}
          />
          <ThemedText
            style={[styles.notFoundText, { color: colors.textSecondary }]}
          >
            Video not found
          </ThemedText>
          <Button
            title="Go Back"
            variant="secondary"
            onPress={() => router.back()}
          />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Video Preview */}
        <Pressable onPress={handlePlay} style={styles.videoContainer}>
          <Image
            source={{ uri: video.thumbnailPath }}
            style={styles.thumbnail}
            contentFit="cover"
          />
          <View style={styles.playOverlay}>
            <View style={[styles.playButton, { backgroundColor: colors.tint }]}>
              <IconSymbol name="play.fill" size={32} color="#FFFFFF" />
            </View>
          </View>
          <View style={styles.durationBadge}>
            <ThemedText style={styles.durationText}>
              {formatDuration(video.duration)}
            </ThemedText>
          </View>
        </Pressable>

        {/* Video Title */}
        <View style={styles.titleSection}>
          <ThemedText style={styles.title}>{video.title}</ThemedText>
          <View
            style={[
              styles.platformTag,
              { backgroundColor: colors.surfaceSecondary },
            ]}
          >
            <ThemedText style={[styles.platformText, { color: colors.tint }]}>
              {getPlatformDisplayName(video.platform)}
            </ThemedText>
          </View>
        </View>

        {/* Metadata */}
        <View
          style={[
            styles.metadataCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <MetadataRow
            icon="doc.fill"
            label="Size"
            value={formatFileSize(video.fileSize)}
          />
          <MetadataRow
            icon="sparkles"
            label="Quality"
            value={video.resolution}
          />
          <MetadataRow
            icon="calendar"
            label="Downloaded"
            value={formatDate(video.downloadedAt)}
          />
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Play Video"
            onPress={handlePlay}
            fullWidth
            icon={<IconSymbol name="play.fill" size={18} color="#FFFFFF" />}
          />
          <View style={styles.secondaryActions}>
            <Button
              title="Share"
              variant="secondary"
              onPress={handleShare}
              style={styles.halfButton}
              icon={
                <IconSymbol
                  name="square.and.arrow.up"
                  size={18}
                  color={colors.tint}
                />
              }
            />
            <Button
              title="Source"
              variant="secondary"
              onPress={handleOpenSource}
              style={styles.halfButton}
              icon={<IconSymbol name="link" size={18} color={colors.tint} />}
            />
          </View>
          <Button
            title="Delete Video"
            variant="ghost"
            onPress={handleDelete}
            fullWidth
            icon={
              <IconSymbol name="trash.fill" size={18} color={colors.error} />
            }
            textStyle={{ color: colors.error }}
          />
        </View>
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
  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.lg,
    padding: Spacing.xl,
  },
  notFoundText: {
    fontSize: 17,
    textAlign: "center",
  },
  videoContainer: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    position: "relative",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
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
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  titleSection: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 28,
  },
  platformTag: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  platformText: {
    fontSize: 13,
    fontWeight: "600",
  },
  metadataCard: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  metadataRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  metadataLabel: {
    fontSize: 14,
    flex: 1,
  },
  metadataValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  actions: {
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  secondaryActions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  halfButton: {
    flex: 1,
  },
});
