import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button } from "@/components/ui/button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useSettingsStore } from "@/stores";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function OnboardingComplete() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const setOnboardingComplete = useSettingsStore(
    (state) => state.setOnboardingComplete
  );

  const checkScale = useSharedValue(0);
  const checkOpacity = useSharedValue(0);
  const ringScale = useSharedValue(0.8);
  const ringOpacity = useSharedValue(0);

  useEffect(() => {
    // Trigger haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Animate checkmark
    checkScale.value = withDelay(
      300,
      withSpring(1, { damping: 12, stiffness: 200 })
    );
    checkOpacity.value = withDelay(300, withTiming(1, { duration: 300 }));

    // Animate ring
    ringOpacity.value = withDelay(400, withTiming(1, { duration: 200 }));
    ringScale.value = withDelay(
      400,
      withSequence(
        withTiming(1.2, { duration: 400, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 200 })
      )
    );
  }, []);

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkOpacity.value,
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  const handleGetStarted = () => {
    setOnboardingComplete();
    router.replace("/(tabs)");
  };

  return (
    <ThemedView style={styles.container}>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />

      {/* Content */}
      <View style={styles.content}>
        {/* Success Animation */}
        <View style={styles.successContainer}>
          <Animated.View
            style={[
              styles.successRing,
              { borderColor: colors.success },
              ringStyle,
            ]}
          />
          <Animated.View
            style={[
              styles.successCircle,
              { backgroundColor: colors.success },
              checkStyle,
            ]}
          >
            <IconSymbol name="checkmark" size={48} color="#FFFFFF" />
          </Animated.View>
        </View>

        {/* Title */}
        <Animated.View entering={FadeInDown.delay(500).duration(600)}>
          <ThemedText style={styles.title}>You&apos;re All Set!</ThemedText>
          <ThemedText
            style={[styles.subtitle, { color: colors.textSecondary }]}
          >
            Vidly is ready to download videos for you
          </ThemedText>
        </Animated.View>

        {/* Tips */}
        <Animated.View
          entering={FadeInDown.delay(700).duration(600)}
          style={[
            styles.tipsContainer,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <ThemedText
            style={[styles.tipsTitle, { color: colors.textSecondary }]}
          >
            Quick Tip
          </ThemedText>
          <View style={styles.tipItem}>
            <IconSymbol
              name="lightbulb.fill"
              size={20}
              color={colors.warning}
            />
            <ThemedText style={styles.tipText}>
              To download a video, open any app, find a video, tap Share, and
              select Vidly!
            </ThemedText>
          </View>
        </Animated.View>
      </View>

      {/* Bottom */}
      <Animated.View
        entering={FadeInUp.delay(900).duration(600)}
        style={[styles.bottom, { paddingBottom: insets.bottom + Spacing.lg }]}
      >
        <Button
          title="Start Downloading"
          onPress={handleGetStarted}
          fullWidth
        />
        <View style={styles.pagination}>
          <View
            style={[styles.dot, { backgroundColor: colors.surfaceSecondary }]}
          />
          <View
            style={[styles.dot, { backgroundColor: colors.surfaceSecondary }]}
          />
          <View
            style={[styles.dot, { backgroundColor: colors.surfaceSecondary }]}
          />
          <View
            style={[
              styles.dot,
              styles.dotActive,
              { backgroundColor: colors.tint },
            ]}
          />
        </View>
      </Animated.View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  successContainer: {
    width: 120,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing["2xl"],
  },
  successRing: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
  },
  successCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    textAlign: "center",
    marginTop: Spacing.sm,
    lineHeight: 24,
  },
  tipsContainer: {
    width: "100%",
    marginTop: Spacing["2xl"],
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  tipsTitle: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  tipText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
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
