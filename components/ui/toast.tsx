import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '../themed-text';
import { IconSymbol } from './icon-symbol';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onDismiss: () => void;
}

export function Toast({
  visible,
  message,
  type = 'info',
  duration = 3000,
  onDismiss,
}: ToastProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 15, stiffness: 300 });
      opacity.value = withTiming(1, { duration: 200 });

      if (duration > 0) {
        timeoutRef.current = setTimeout(() => {
          onDismiss();
        }, duration);
      }
    } else {
      translateY.value = withTiming(-100, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visible, duration, onDismiss, translateY, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const getTypeColor = () => {
    switch (type) {
      case 'success':
        return colors.success;
      case 'error':
        return colors.error;
      case 'warning':
        return colors.warning;
      case 'info':
      default:
        return colors.tint;
    }
  };

  const getTypeIcon = (): 'checkmark.circle.fill' | 'xmark.circle.fill' | 'exclamationmark.triangle.fill' | 'info.circle.fill' => {
    switch (type) {
      case 'success':
        return 'checkmark.circle.fill';
      case 'error':
        return 'xmark.circle.fill';
      case 'warning':
        return 'exclamationmark.triangle.fill';
      case 'info':
      default:
        return 'info.circle.fill';
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + Spacing.sm,
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        animatedStyle,
      ]}
    >
      <Pressable onPress={onDismiss} style={styles.content}>
        <IconSymbol name={getTypeIcon()} size={20} color={getTypeColor()} />
        <ThemedText style={styles.message} numberOfLines={2}>
          {message}
        </ThemedText>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 9999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  message: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
  },
});
