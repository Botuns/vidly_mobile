import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#0A0A0B",
    textSecondary: "#6B7280",
    textTertiary: "#9CA3AF",
    background: "#FFFFFF",
    backgroundSecondary: "#F9FAFB",
    surface: "#FFFFFF",
    surfaceSecondary: "#F3F4F6",
    border: "#E5E7EB",
    borderSecondary: "#D1D5DB",
    tint: "#6366F1",
    tintSecondary: "#818CF8",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    icon: "#6B7280",
    tabIconDefault: "#9CA3AF",
    tabIconSelected: "#6366F1",
  },
  dark: {
    text: "#F9FAFB",
    textSecondary: "#9CA3AF",
    textTertiary: "#6B7280",
    background: "#0A0A0B",
    backgroundSecondary: "#111114",
    surface: "#18181B",
    surfaceSecondary: "#27272A",
    border: "#27272A",
    borderSecondary: "#3F3F46",
    tint: "#818CF8",
    tintSecondary: "#6366F1",
    success: "#34D399",
    warning: "#FBBF24",
    error: "#F87171",
    icon: "#9CA3AF",
    tabIconDefault: "#6B7280",
    tabIconSelected: "#818CF8",
  },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
  "4xl": 64,
} as const;

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  "2xl": 24,
  full: 9999,
} as const;

export const Typography = {
  largeTitle: {
    fontSize: 34,
    lineHeight: 41,
    fontWeight: "700" as const,
    letterSpacing: 0.37,
  },
  title1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700" as const,
    letterSpacing: 0.36,
  },
  title2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700" as const,
    letterSpacing: 0.35,
  },
  title3: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: "600" as const,
    letterSpacing: 0.38,
  },
  headline: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "600" as const,
    letterSpacing: -0.41,
  },
  body: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "400" as const,
    letterSpacing: -0.41,
  },
  callout: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "400" as const,
    letterSpacing: -0.32,
  },
  subheadline: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "400" as const,
    letterSpacing: -0.24,
  },
  footnote: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "400" as const,
    letterSpacing: -0.08,
  },
  caption1: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400" as const,
    letterSpacing: 0,
  },
  caption2: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: "400" as const,
    letterSpacing: 0.07,
  },
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export type ColorScheme = "light" | "dark";
export type ThemeColors = (typeof Colors)["light"] | (typeof Colors)["dark"];
export type SpacingScale = keyof typeof Spacing;
export type TypographyVariant = keyof typeof Typography;
