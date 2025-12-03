import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { StyleSheet, View, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

interface ProgressBarProps {
  progress: number;
  height?: number;
  showPercentage?: boolean;
  color?: string;
  backgroundColor?: string;
  style?: ViewStyle;
}

export function ProgressBar({
  progress,
  height = 4,
  color,
  backgroundColor,
  style,
}: ProgressBarProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const clampedProgress = Math.min(100, Math.max(0, progress));

  const animatedStyle = useAnimatedStyle(() => ({
    width: withTiming(`${clampedProgress}%`, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    }),
  }));

  return (
    <View
      style={[
        styles.container,
        {
          height,
          backgroundColor: backgroundColor ?? colors.surfaceSecondary,
          borderRadius: height / 2,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.progress,
          {
            backgroundColor: color ?? colors.tint,
            borderRadius: height / 2,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
}

interface CircularProgressProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
}

export function CircularProgress({
  progress,
  size = 48,
  strokeWidth = 4,
  color,
  backgroundColor,
}: CircularProgressProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const clampedProgress = Math.min(100, Math.max(0, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset =
    circumference - (clampedProgress / 100) * circumference;

  return (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          styles.circularContainer,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: backgroundColor ?? colors.surfaceSecondary,
          },
        ]}
      />
      <View
        style={[
          styles.circularProgress,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: color ?? colors.tint,
            borderTopColor: "transparent",
            borderRightColor:
              clampedProgress > 25 ? color ?? colors.tint : "transparent",
            borderBottomColor:
              clampedProgress > 50 ? color ?? colors.tint : "transparent",
            borderLeftColor:
              clampedProgress > 75 ? color ?? colors.tint : "transparent",
            transform: [{ rotate: "-90deg" }],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    overflow: "hidden",
  },
  progress: {
    height: "100%",
  },
  circularContainer: {
    position: "absolute",
  },
  circularProgress: {
    position: "absolute",
  },
});
