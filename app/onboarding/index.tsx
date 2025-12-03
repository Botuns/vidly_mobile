import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button } from "@/components/ui/button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import {
  BorderRadius,
  Colors,
  Spacing,
  type ThemeColors,
} from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function OnboardingWelcome() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  const handleNext = () => {
    router.push("/onboarding/share-demo");
  };

  const handleSkip = () => {
    router.replace("/(tabs)");
  };

  return (
    <ThemedView style={styles.container}>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />

      {/* Skip button */}
      <Animated.View
        entering={FadeInUp.delay(600).duration(400)}
        style={[styles.skipContainer, { top: insets.top + Spacing.md }]}
      >
        <Button title="Skip" variant="ghost" size="sm" onPress={handleSkip} />
      </Animated.View>

      {/* Content */}
      <View style={styles.content}>
        {/* Icon */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(600)}
          style={[styles.iconContainer, { backgroundColor: colors.tint }]}
        >
          <IconSymbol name="arrow.down.circle.fill" size={64} color="#FFFFFF" />
        </Animated.View>

        {/* Title */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)}>
          <ThemedText style={styles.title}>
            Download Videos{"\n"}Without Leaving
          </ThemedText>
        </Animated.View>

        {/* Subtitle */}
        <Animated.View entering={FadeInDown.delay(300).duration(600)}>
          <ThemedText
            style={[styles.subtitle, { color: colors.textSecondary }]}
          >
            See a video you love? Just tap share and Vidly handles the rest. No
            copy-paste. No switching apps.
          </ThemedText>
        </Animated.View>

        {/* Features */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(600)}
          style={styles.features}
        >
          <FeatureItem
            icon="square.and.arrow.up"
            text="Share from any app"
            colors={colors}
          />
          <FeatureItem
            icon="bolt.fill"
            text="Instant downloads"
            colors={colors}
          />
          <FeatureItem
            icon="folder.fill"
            text="Organized library"
            colors={colors}
          />
        </Animated.View>
      </View>

      {/* Bottom */}
      <Animated.View
        entering={FadeInUp.delay(500).duration(600)}
        style={[styles.bottom, { paddingBottom: insets.bottom + Spacing.lg }]}
      >
        <Button title="Get Started" onPress={handleNext} fullWidth />
        <View style={styles.pagination}>
          <View
            style={[
              styles.dot,
              styles.dotActive,
              { backgroundColor: colors.tint },
            ]}
          />
          <View
            style={[styles.dot, { backgroundColor: colors.surfaceSecondary }]}
          />
          <View
            style={[styles.dot, { backgroundColor: colors.surfaceSecondary }]}
          />
          <View
            style={[styles.dot, { backgroundColor: colors.surfaceSecondary }]}
          />
        </View>
      </Animated.View>
    </ThemedView>
  );
}

function FeatureItem({
  icon,
  text,
  colors,
}: {
  icon: React.ComponentProps<typeof IconSymbol>["name"];
  text: string;
  colors: ThemeColors;
}) {
  return (
    <View style={styles.featureItem}>
      <View
        style={[
          styles.featureIcon,
          { backgroundColor: colors.surfaceSecondary },
        ]}
      >
        <IconSymbol name={icon} size={20} color={colors.tint} />
      </View>
      <ThemedText style={styles.featureText}>{text}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipContainer: {
    position: "absolute",
    right: Spacing.md,
    zIndex: 10,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing["2xl"],
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    textAlign: "center",
    lineHeight: 24,
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  features: {
    marginTop: Spacing["2xl"],
    gap: Spacing.md,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    fontSize: 16,
    fontWeight: "500",
  },
  bottom: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
  },
});
