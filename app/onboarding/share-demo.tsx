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
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function OnboardingShareDemo() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  const handleNext = () => {
    router.push("/onboarding/permissions");
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />

      {/* Back button */}
      <Animated.View
        entering={FadeInUp.delay(300).duration(400)}
        style={[styles.backContainer, { top: insets.top + Spacing.md }]}
      >
        <Button
          title="Back"
          variant="ghost"
          size="sm"
          onPress={handleBack}
          icon={
            <IconSymbol name="chevron.left" size={16} color={colors.tint} />
          }
        />
      </Animated.View>

      {/* Content */}
      <View style={styles.content}>
        {/* Title */}
        <Animated.View entering={FadeInDown.delay(100).duration(600)}>
          <ThemedText style={styles.title}>How It Works</ThemedText>
          <ThemedText
            style={[styles.subtitle, { color: colors.textSecondary }]}
          >
            It&apos;s as easy as sharing a link
          </ThemedText>
        </Animated.View>

        {/* Demo Animation */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(600)}
          style={styles.demoContainer}
        >
          <ShareDemoAnimation colors={colors} />
        </Animated.View>

        {/* Steps */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(600)}
          style={styles.steps}
        >
          <StepItem
            number={1}
            title="Find a video"
            description="Browse your favorite app"
            colors={colors}
          />
          <StepItem
            number={2}
            title="Tap Share"
            description="Select Vidly from the share menu"
            colors={colors}
          />
          <StepItem
            number={3}
            title="Done!"
            description="Video downloads automatically"
            colors={colors}
          />
        </Animated.View>
      </View>

      {/* Bottom */}
      <Animated.View
        entering={FadeInUp.delay(500).duration(600)}
        style={[styles.bottom, { paddingBottom: insets.bottom + Spacing.lg }]}
      >
        <Button title="Continue" onPress={handleNext} fullWidth />
        <View style={styles.pagination}>
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

function ShareDemoAnimation({ colors }: { colors: ThemeColors }) {
  const shareIconOpacity = useSharedValue(0);
  const shareIconScale = useSharedValue(0.5);
  const vidlyOpacity = useSharedValue(0);
  const vidlyScale = useSharedValue(0.8);
  const checkOpacity = useSharedValue(0);
  const checkScale = useSharedValue(0);

  useEffect(() => {
    // Animation sequence
    shareIconOpacity.value = withDelay(
      500,
      withSequence(
        withTiming(1, { duration: 400 }),
        withDelay(1500, withTiming(0, { duration: 300 }))
      )
    );
    shareIconScale.value = withDelay(
      500,
      withSequence(
        withTiming(1, { duration: 400, easing: Easing.out(Easing.back(1.5)) }),
        withDelay(1500, withTiming(0.5, { duration: 300 }))
      )
    );

    vidlyOpacity.value = withDelay(
      2300,
      withSequence(
        withTiming(1, { duration: 400 }),
        withDelay(1200, withTiming(0, { duration: 300 }))
      )
    );
    vidlyScale.value = withDelay(
      2300,
      withSequence(
        withTiming(1, { duration: 400, easing: Easing.out(Easing.back(1.5)) }),
        withDelay(1200, withTiming(0.8, { duration: 300 }))
      )
    );

    checkOpacity.value = withDelay(
      4000,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withDelay(1500, withTiming(0, { duration: 300 })),
          withDelay(500, withTiming(0))
        ),
        -1
      )
    );
    checkScale.value = withDelay(
      4000,
      withRepeat(
        withSequence(
          withTiming(1.2, {
            duration: 200,
            easing: Easing.out(Easing.back(2)),
          }),
          withTiming(1, { duration: 200 }),
          withDelay(1500, withTiming(0, { duration: 300 })),
          withDelay(500, withTiming(0))
        ),
        -1
      )
    );

    // Restart sequence
    const interval = setInterval(() => {
      shareIconOpacity.value = withSequence(
        withTiming(1, { duration: 400 }),
        withDelay(1500, withTiming(0, { duration: 300 }))
      );
      shareIconScale.value = withSequence(
        withTiming(1, { duration: 400, easing: Easing.out(Easing.back(1.5)) }),
        withDelay(1500, withTiming(0.5, { duration: 300 }))
      );

      vidlyOpacity.value = withDelay(
        1800,
        withSequence(
          withTiming(1, { duration: 400 }),
          withDelay(1200, withTiming(0, { duration: 300 }))
        )
      );
      vidlyScale.value = withDelay(
        1800,
        withSequence(
          withTiming(1, {
            duration: 400,
            easing: Easing.out(Easing.back(1.5)),
          }),
          withDelay(1200, withTiming(0.8, { duration: 300 }))
        )
      );

      checkOpacity.value = withDelay(
        3500,
        withSequence(
          withTiming(1, { duration: 400 }),
          withDelay(1500, withTiming(0, { duration: 300 }))
        )
      );
      checkScale.value = withDelay(
        3500,
        withSequence(
          withTiming(1.2, {
            duration: 200,
            easing: Easing.out(Easing.back(2)),
          }),
          withTiming(1, { duration: 200 }),
          withDelay(1500, withTiming(0, { duration: 300 }))
        )
      );
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  const shareIconStyle = useAnimatedStyle(() => ({
    opacity: shareIconOpacity.value,
    transform: [{ scale: shareIconScale.value }],
  }));

  const vidlyStyle = useAnimatedStyle(() => ({
    opacity: vidlyOpacity.value,
    transform: [{ scale: vidlyScale.value }],
  }));

  const checkStyle = useAnimatedStyle(() => ({
    opacity: checkOpacity.value,
    transform: [{ scale: checkScale.value }],
  }));

  return (
    <View
      style={[
        styles.demoBox,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      {/* Phone mockup */}
      <View
        style={[
          styles.phoneMockup,
          { backgroundColor: colors.surfaceSecondary },
        ]}
      >
        {/* Video placeholder */}
        <View
          style={[
            styles.videoPlaceholder,
            { backgroundColor: colors.background },
          ]}
        >
          <IconSymbol name="play.fill" size={24} color={colors.textTertiary} />
        </View>

        {/* Animated share icon */}
        <Animated.View style={[styles.floatingIcon, shareIconStyle]}>
          <View style={[styles.iconBubble, { backgroundColor: colors.tint }]}>
            <IconSymbol name="square.and.arrow.up" size={20} color="#FFFFFF" />
          </View>
        </Animated.View>

        {/* Animated Vidly selection */}
        <Animated.View style={[styles.floatingIcon, vidlyStyle]}>
          <View style={[styles.vidlyBubble, { backgroundColor: colors.tint }]}>
            <IconSymbol
              name="arrow.down.circle.fill"
              size={16}
              color="#FFFFFF"
            />
            <ThemedText style={styles.vidlyText}>Vidly</ThemedText>
          </View>
        </Animated.View>

        {/* Animated checkmark */}
        <Animated.View style={[styles.floatingIcon, checkStyle]}>
          <View
            style={[styles.checkBubble, { backgroundColor: colors.success }]}
          >
            <IconSymbol name="checkmark" size={24} color="#FFFFFF" />
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

function StepItem({
  number,
  title,
  description,
  colors,
}: {
  number: number;
  title: string;
  description: string;
  colors: ThemeColors;
}) {
  return (
    <View style={styles.stepItem}>
      <View style={[styles.stepNumber, { backgroundColor: colors.tint }]}>
        <ThemedText style={styles.stepNumberText}>{number}</ThemedText>
      </View>
      <View style={styles.stepContent}>
        <ThemedText style={styles.stepTitle}>{title}</ThemedText>
        <ThemedText
          style={[styles.stepDescription, { color: colors.textSecondary }]}
        >
          {description}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backContainer: {
    position: "absolute",
    left: Spacing.sm,
    zIndex: 10,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    textAlign: "center",
    marginTop: Spacing.sm,
  },
  demoContainer: {
    marginVertical: Spacing["2xl"],
  },
  demoBox: {
    width: 280,
    height: 200,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  phoneMockup: {
    width: 120,
    height: 160,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    position: "relative",
  },
  videoPlaceholder: {
    flex: 1,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  floatingIcon: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -20,
    marginTop: -20,
  },
  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  vidlyBubble: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  vidlyText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  checkBubble: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  steps: {
    width: "100%",
    gap: Spacing.lg,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  stepDescription: {
    fontSize: 14,
    marginTop: 2,
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
