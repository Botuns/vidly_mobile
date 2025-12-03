import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Image } from "expo-image";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { ThemedText } from "../themed-text";

interface CardProps {
  children?: React.ReactNode;
  style?: ViewStyle;
  padding?: keyof typeof Spacing;
}

export function Card({ children, style, padding = "lg" }: CardProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          padding: Spacing[padding],
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

interface VideoCardProps {
  title: string;
  thumbnail: string | null;
  duration?: string;
  platform?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export function VideoCard({
  title,
  thumbnail,
  duration,
  platform,
  style,
}: VideoCardProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  return (
    <View
      style={[
        styles.videoCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
        style,
      ]}
    >
      <View style={styles.thumbnailContainer}>
        {thumbnail ? (
          <Image
            source={{ uri: thumbnail }}
            style={styles.thumbnail}
            contentFit="cover"
          />
        ) : (
          <View
            style={[
              styles.thumbnailPlaceholder,
              { backgroundColor: colors.surfaceSecondary },
            ]}
          />
        )}
        {duration && (
          <View style={styles.durationBadge}>
            <ThemedText style={styles.durationText}>{duration}</ThemedText>
          </View>
        )}
      </View>
      <View style={styles.videoInfo}>
        <ThemedText numberOfLines={2} style={styles.videoTitle}>
          {title}
        </ThemedText>
        {platform && (
          <ThemedText
            style={[styles.platformText, { color: colors.textSecondary }]}
          >
            {platform}
          </ThemedText>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  videoCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  thumbnailContainer: {
    aspectRatio: 16 / 9,
    position: "relative",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  thumbnailPlaceholder: {
    width: "100%",
    height: "100%",
  },
  durationBadge: {
    position: "absolute",
    bottom: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  durationText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
  },
  videoInfo: {
    padding: Spacing.md,
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 18,
  },
  platformText: {
    fontSize: 12,
    marginTop: Spacing.xs,
    textTransform: "capitalize",
  },
});
