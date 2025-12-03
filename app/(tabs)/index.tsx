import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { EmptyState } from "@/components/ui/empty-state";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useLibraryStore, type Video } from "@/stores";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type ThemeColors = typeof Colors.light | typeof Colors.dark;

function VideoGridItem({
  video,
  colors,
  onPress,
}: {
  video: Video;
  colors: ThemeColors;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.gridItem, { backgroundColor: colors.surface }]}
      onPress={onPress}
    >
      <View style={styles.thumbnailContainer}>
        <Image
          source={{ uri: video.thumbnailPath }}
          style={styles.thumbnail}
          contentFit="cover"
        />
        <View style={styles.durationBadge}>
          <ThemedText style={styles.durationText}>
            {formatDuration(video.duration)}
          </ThemedText>
        </View>
        <View style={[styles.platformBadge, { backgroundColor: colors.tint }]}>
          <ThemedText style={styles.platformText}>
            {video.platform.charAt(0).toUpperCase()}
          </ThemedText>
        </View>
      </View>
      <View style={styles.videoInfo}>
        <ThemedText numberOfLines={2} style={styles.videoTitle}>
          {video.title}
        </ThemedText>
        <ThemedText style={[styles.metaText, { color: colors.textSecondary }]}>
          {formatFileSize(video.fileSize)} • {video.resolution}
        </ThemedText>
      </View>
    </Pressable>
  );
}

export default function LibraryScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  const rawVideos = useLibraryStore((state) => state.videos);
  const sortBy = useLibraryStore((state) => state.sortBy);
  const sortOrder = useLibraryStore((state) => state.sortOrder);
  const filterPlatform = useLibraryStore((state) => state.filterPlatform);
  const searchQuery = useLibraryStore((state) => state.searchQuery);

  const videos = useMemo(() => {
    let filtered = [...rawVideos];

    if (filterPlatform !== "all") {
      filtered = filtered.filter((v) => v.platform === filterPlatform);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((v) => v.title.toLowerCase().includes(query));
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
  }, [rawVideos, sortBy, sortOrder, filterPlatform, searchQuery]);

  const [numColumns] = useState(2);

  const renderItem = useCallback(
    ({ item }: { item: Video }) => (
      <VideoGridItem
        video={item}
        colors={colors}
        onPress={() => router.push(`/video/${item.id}`)}
      />
    ),
    [colors]
  );

  const keyExtractor = useCallback((item: Video) => item.id, []);

  if (videos.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <EmptyState
          icon={
            <IconSymbol
              name="square.and.arrow.down"
              size={64}
              color={colors.textTertiary}
            />
          }
          title="No videos yet"
          description="Share a video link from any app to start downloading. Tap the share button in your browser or social media app and select Vidly."
        />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={videos}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={numColumns}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + Spacing.lg },
        ]}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
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
  columnWrapper: {
    gap: Spacing.md,
  },
  gridItem: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    marginBottom: Spacing.md,
  },
  thumbnailContainer: {
    aspectRatio: 16 / 9,
    position: "relative",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  durationBadge: {
    position: "absolute",
    bottom: Spacing.xs,
    right: Spacing.xs,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  durationText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
  platformBadge: {
    position: "absolute",
    top: Spacing.xs,
    left: Spacing.xs,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  platformText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  videoInfo: {
    padding: Spacing.sm,
  },
  videoTitle: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 17,
  },
  metaText: {
    fontSize: 11,
    marginTop: Spacing.xs,
  },
});
