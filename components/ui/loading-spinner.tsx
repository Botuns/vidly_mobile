import { Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  ActivityIndicator,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import { ThemedText } from "../themed-text";

interface LoadingSpinnerProps {
  size?: "small" | "large";
  color?: string;
  message?: string;
  fullScreen?: boolean;
  style?: ViewStyle;
}

export function LoadingSpinner({
  size = "large",
  color,
  message,
  fullScreen = false,
  style,
}: LoadingSpinnerProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const content = (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={color ?? colors.tint} />
      {message && (
        <ThemedText style={[styles.message, { color: colors.textSecondary }]}>
          {message}
        </ThemedText>
      )}
    </View>
  );

  if (fullScreen) {
    return (
      <View style={[styles.fullScreen, { backgroundColor: colors.background }]}>
        {content}
      </View>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
  },
  fullScreen: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  message: {
    marginTop: Spacing.md,
    fontSize: 15,
  },
});
