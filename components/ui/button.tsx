import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import * as Haptics from "expo-haptics";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type PressableProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { ThemedText } from "../themed-text";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends Omit<PressableProps, "style"> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export type { ButtonProps };

export function Button({
  title,
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  iconPosition = "left",
  fullWidth = false,
  disabled,
  onPress,
  style,
  textStyle,
  ...props
}: ButtonProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handlePress = (e: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(e);
  };

  const getBackgroundColor = (): string => {
    if (disabled) return colors.surfaceSecondary;
    switch (variant) {
      case "primary":
        return colors.tint;
      case "secondary":
        return colors.surfaceSecondary;
      case "ghost":
        return "transparent";
      case "danger":
        return colors.error;
      default:
        return colors.tint;
    }
  };

  const getTextColor = (): string => {
    if (disabled) return colors.textTertiary;
    switch (variant) {
      case "primary":
        return "#FFFFFF";
      case "secondary":
        return colors.text;
      case "ghost":
        return colors.tint;
      case "danger":
        return "#FFFFFF";
      default:
        return "#FFFFFF";
    }
  };

  const getSizeStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (size) {
      case "sm":
        return {
          container: {
            paddingVertical: Spacing.sm,
            paddingHorizontal: Spacing.md,
          },
          text: { fontSize: 14 },
        };
      case "md":
        return {
          container: {
            paddingVertical: Spacing.md,
            paddingHorizontal: Spacing.lg,
          },
          text: { fontSize: 16 },
        };
      case "lg":
        return {
          container: {
            paddingVertical: Spacing.lg,
            paddingHorizontal: Spacing.xl,
          },
          text: { fontSize: 18 },
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled || loading}
      style={[
        styles.container,
        sizeStyles.container,
        { backgroundColor: getBackgroundColor() },
        variant === "ghost" && { borderWidth: 1, borderColor: colors.border },
        fullWidth && styles.fullWidth,
        animatedStyle,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {icon && iconPosition === "left" && icon}
          <ThemedText
            style={[
              styles.text,
              sizeStyles.text,
              { color: getTextColor() },
              icon && iconPosition === "left"
                ? { marginLeft: Spacing.sm }
                : undefined,
              icon && iconPosition === "right"
                ? { marginRight: Spacing.sm }
                : undefined,
              textStyle,
            ]}
          >
            {title}
          </ThemedText>
          {icon && iconPosition === "right" && icon}
        </>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.lg,
  },
  fullWidth: {
    width: "100%",
  },
  text: {
    fontWeight: "600",
  },
});
