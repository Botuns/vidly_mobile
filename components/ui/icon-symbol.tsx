// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolViewProps, SymbolWeight } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type MaterialIconName = ComponentProps<typeof MaterialIcons>["name"];
type IconMapping = Record<string, MaterialIconName>;

/**
 * SF Symbols to Material Icons mappings.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING: IconMapping = {
  // Navigation
  "house.fill": "home",
  "square.grid.2x2.fill": "grid-view",
  "arrow.down.circle.fill": "download",
  "arrow.down.circle": "download",
  "gearshape.fill": "settings",
  "chevron.right": "chevron-right",

  // Status icons
  "checkmark.circle.fill": "check-circle",
  checkmark: "check",
  "xmark.circle.fill": "cancel",
  "exclamationmark.triangle.fill": "warning",
  "info.circle.fill": "info",
  "pause.circle.fill": "pause-circle-filled",
  "clock.fill": "schedule",

  // Actions
  "square.and.arrow.down": "file-download",
  "square.and.arrow.up": "share",
  "play.fill": "play-arrow",
  link: "link",
  "trash.fill": "delete",
  "star.fill": "star",
  "envelope.fill": "email",
  "doc.fill": "insert-drive-file",
  sparkles: "auto-awesome",
  calendar: "calendar-today",

  // Settings
  wifi: "wifi",
  "doc.on.clipboard.fill": "content-paste",
  "bell.fill": "notifications",
  "internaldrive.fill": "storage",
  "doc.text.fill": "description",

  // Misc
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.left": "chevron-left",
  "bolt.fill": "bolt",
  "folder.fill": "folder",
  "lock.shield.fill": "security",
  "photo.fill": "photo-library",
  xmark: "close",
  "lightbulb.fill": "lightbulb",

  // Share extension / platform icons
  "play.rectangle.fill": "smart-display",
  "music.note": "music-note",
  "camera.fill": "camera-alt",
  "bubble.left.fill": "chat-bubble",
  "person.2.fill": "people",
  "play.circle.fill": "play-circle-filled",
};

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: SymbolViewProps["name"];
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  const iconName = MAPPING[name] ?? "help-outline";
  return (
    <MaterialIcons color={color} size={size} name={iconName} style={style} />
  );
}
