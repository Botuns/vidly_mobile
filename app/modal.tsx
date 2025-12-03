import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button } from "@/components/ui/button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { detectPlatform, getPlatformDisplayName, isVideoUrl } from "@/services";
import { useDownloadsStore } from "@/stores";

export default function DownloadModal() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const params = useLocalSearchParams<{ url?: string }>();
  const [url, setUrl] = useState(params.url ?? "");
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addDownload = useDownloadsStore((state) => state.addDownload);

  useEffect(() => {
    if (params.url) {
      validateUrl(params.url);
    }
  }, [params.url]);

  const validateUrl = async (inputUrl: string) => {
    setIsValidating(true);
    setError(null);

    if (!isVideoUrl(inputUrl)) {
      setError("This URL is not from a supported video platform.");
      setIsValidating(false);
      return false;
    }

    setIsValidating(false);
    return true;
  };

  const handlePaste = async () => {
    // This would use clipboard, but for now just validate the input
    if (url) {
      await validateUrl(url);
    }
  };

  const handleDownload = async () => {
    if (!url) {
      setError("Please enter a video URL");
      return;
    }

    const isValid = await validateUrl(url);
    if (!isValid) return;

    const platform = detectPlatform(url);

    addDownload({
      sourceUrl: url,
      platform,
      title: "Fetching video info...",
      thumbnail: null,
      localPath: null,
      duration: null,
      resolution: null,
      fileSize: null,
      downloadedAt: null,
    });

    router.back();
  };

  const platform = url && isVideoUrl(url) ? detectPlatform(url) : null;

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: colors.surfaceSecondary },
          ]}
        >
          <IconSymbol name="link" size={32} color={colors.tint} />
        </View>

        <ThemedText style={styles.title}>Download Video</ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
          Paste a video URL from YouTube, TikTok, Instagram, or Twitter
        </ThemedText>

        <Input
          placeholder="https://..."
          value={url}
          onChangeText={(text) => {
            setUrl(text);
            setError(null);
          }}
          error={error ?? undefined}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          containerStyle={styles.input}
          rightIcon={
            isValidating ? (
              <LoadingSpinner size="small" />
            ) : platform ? (
              <View
                style={[
                  styles.platformIndicator,
                  { backgroundColor: colors.success },
                ]}
              >
                <IconSymbol name="checkmark" size={12} color="#FFFFFF" />
              </View>
            ) : null
          }
        />

        {platform && (
          <View
            style={[
              styles.platformBadge,
              { backgroundColor: colors.surfaceSecondary },
            ]}
          >
            <ThemedText
              style={[styles.platformText, { color: colors.textSecondary }]}
            >
              Detected: {getPlatformDisplayName(platform)}
            </ThemedText>
          </View>
        )}

        <View style={styles.actions}>
          <Button
            title="Download"
            onPress={handleDownload}
            disabled={!url || isValidating}
            fullWidth
          />
          <Button
            title="Cancel"
            variant="ghost"
            onPress={() => router.back()}
            fullWidth
          />
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: Spacing.xl,
    alignItems: "center",
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
    marginTop: Spacing["2xl"],
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  input: {
    width: "100%",
    marginBottom: Spacing.md,
  },
  platformIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  platformBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.xl,
  },
  platformText: {
    fontSize: 13,
    fontWeight: "500",
  },
  actions: {
    width: "100%",
    gap: Spacing.md,
    marginTop: "auto",
    paddingBottom: Spacing.xl,
  },
});
