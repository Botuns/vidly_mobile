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
import {
  getPermissionsStatus,
  type PermissionsState,
  type PermissionStatus,
  requestMediaLibraryPermission,
  requestNotificationPermission,
} from "@/services/permissions";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface PermissionItemData {
  key: keyof PermissionsState;
  icon: React.ComponentProps<typeof IconSymbol>["name"];
  iconColor: string;
  title: string;
  description: string;
}

export default function OnboardingPermissions() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  const [permissionsState, setPermissionsState] = useState<PermissionsState>({
    notifications: "undetermined",
    mediaLibrary: "undetermined",
  });

  const permissions: PermissionItemData[] = [
    {
      key: "notifications",
      icon: "bell.fill",
      iconColor: "#EF4444",
      title: "Notifications",
      description: "Get notified when downloads complete",
    },
    {
      key: "mediaLibrary",
      icon: "photo.fill",
      iconColor: "#10B981",
      title: "Photo Library",
      description: "Save videos to your camera roll",
    },
  ];

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const status = await getPermissionsStatus();
    setPermissionsState(status);
  };

  const handleRequestPermission = async (key: keyof PermissionsState) => {
    let status: PermissionStatus;

    if (key === "notifications") {
      status = await requestNotificationPermission();
    } else {
      status = await requestMediaLibraryPermission();
    }

    setPermissionsState((prev) => ({ ...prev, [key]: status }));
  };

  const handleNext = () => {
    router.push("/onboarding/complete");
  };

  const handleBack = () => {
    router.back();
  };

  const allGranted =
    permissionsState.notifications === "granted" &&
    permissionsState.mediaLibrary === "granted";

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
        {/* Icon */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(600)}
          style={[
            styles.iconContainer,
            { backgroundColor: colors.surfaceSecondary },
          ]}
        >
          <IconSymbol name="lock.shield.fill" size={48} color={colors.tint} />
        </Animated.View>

        {/* Title */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)}>
          <ThemedText style={styles.title}>Enable Permissions</ThemedText>
          <ThemedText
            style={[styles.subtitle, { color: colors.textSecondary }]}
          >
            Vidly needs a few permissions to work its magic
          </ThemedText>
        </Animated.View>

        {/* Permission Items */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(600)}
          style={styles.permissionsList}
        >
          {permissions.map((permission, index) => (
            <PermissionItem
              key={permission.key}
              permission={permission}
              status={permissionsState[permission.key]}
              onRequest={() => handleRequestPermission(permission.key)}
              colors={colors}
              delay={index * 100}
            />
          ))}
        </Animated.View>

        {/* Note */}
        <Animated.View entering={FadeInDown.delay(500).duration(600)}>
          <ThemedText style={[styles.note, { color: colors.textTertiary }]}>
            You can change these anytime in Settings
          </ThemedText>
        </Animated.View>
      </View>

      {/* Bottom */}
      <Animated.View
        entering={FadeInUp.delay(600).duration(600)}
        style={[styles.bottom, { paddingBottom: insets.bottom + Spacing.lg }]}
      >
        <Button
          title={allGranted ? "Continue" : "Skip for Now"}
          variant={allGranted ? "primary" : "secondary"}
          onPress={handleNext}
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
            style={[
              styles.dot,
              styles.dotActive,
              { backgroundColor: colors.tint },
            ]}
          />
          <View
            style={[styles.dot, { backgroundColor: colors.surfaceSecondary }]}
          />
        </View>
      </Animated.View>
    </ThemedView>
  );
}

function PermissionItem({
  permission,
  status,
  onRequest,
  colors,
  delay,
}: {
  permission: PermissionItemData;
  status: PermissionStatus;
  onRequest: () => void;
  colors: ThemeColors;
  delay: number;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  const isGranted = status === "granted";
  const isDenied = status === "denied";

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={!isGranted ? onRequest : undefined}
        style={[
          styles.permissionItem,
          {
            backgroundColor: colors.surface,
            borderColor: isGranted ? colors.success : colors.border,
            borderWidth: isGranted ? 2 : 1,
          },
        ]}
      >
        <View
          style={[
            styles.permissionIcon,
            { backgroundColor: permission.iconColor },
          ]}
        >
          <IconSymbol name={permission.icon} size={20} color="#FFFFFF" />
        </View>

        <View style={styles.permissionContent}>
          <ThemedText style={styles.permissionTitle}>
            {permission.title}
          </ThemedText>
          <ThemedText
            style={[
              styles.permissionDescription,
              { color: colors.textSecondary },
            ]}
          >
            {permission.description}
          </ThemedText>
        </View>

        {isGranted ? (
          <View
            style={[styles.statusBadge, { backgroundColor: colors.success }]}
          >
            <IconSymbol name="checkmark" size={14} color="#FFFFFF" />
          </View>
        ) : isDenied ? (
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: colors.surfaceSecondary },
            ]}
          >
            <IconSymbol name="xmark" size={14} color={colors.textTertiary} />
          </View>
        ) : (
          <View style={[styles.enableButton, { backgroundColor: colors.tint }]}>
            <ThemedText style={styles.enableText}>Enable</ThemedText>
          </View>
        )}
      </Pressable>
    </Animated.View>
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
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
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
  permissionsList: {
    width: "100%",
    marginTop: Spacing["2xl"],
    gap: Spacing.md,
  },
  permissionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  permissionIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  permissionContent: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  permissionDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  statusBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  enableButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  enableText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  note: {
    fontSize: 13,
    textAlign: "center",
    marginTop: Spacing.xl,
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
