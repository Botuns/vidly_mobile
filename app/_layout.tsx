import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Redirect, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import "react-native-reanimated";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useShareIntent } from "@/hooks/use-share-intent";
import { useSettingsStore } from "@/stores";

SplashScreen.preventAutoHideAsync();

const VidlyLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.light.tint,
    background: Colors.light.background,
    card: Colors.light.surface,
    text: Colors.light.text,
    border: Colors.light.border,
  },
};

const VidlyDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.dark.tint,
    background: Colors.dark.background,
    card: Colors.dark.surface,
    text: Colors.dark.text,
    border: Colors.dark.border,
  },
};

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const hasCompletedOnboarding = useSettingsStore(
    (state) => state.hasCompletedOnboarding
  );
  const hasHydrated = useSettingsStore((state) => state._hasHydrated);
  const [isReady, setIsReady] = useState(false);

  // Initialize share intent handling
  useShareIntent();

  useEffect(() => {
    if (hasHydrated) {
      SplashScreen.hideAsync();
      setIsReady(true);
    }
  }, [hasHydrated]);

  if (!isReady) {
    return null;
  }

  if (!hasCompletedOnboarding) {
    return (
      <ThemeProvider
        value={colorScheme === "dark" ? VidlyDarkTheme : VidlyLightTheme}
      >
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="onboarding" />
        </Stack>
        <Redirect href="/onboarding" />
        <StatusBar style="auto" />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider
      value={colorScheme === "dark" ? VidlyDarkTheme : VidlyLightTheme}
    >
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen
          name="video/[id]"
          options={{
            title: "Video Details",
            headerStyle: {
              backgroundColor:
                colorScheme === "dark"
                  ? Colors.dark.surface
                  : Colors.light.surface,
            },
            headerTintColor:
              colorScheme === "dark" ? Colors.dark.text : Colors.light.text,
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="modal"
          options={{
            presentation: "modal",
            title: "Download Video",
            headerStyle: {
              backgroundColor:
                colorScheme === "dark"
                  ? Colors.dark.surface
                  : Colors.light.surface,
            },
            headerTintColor:
              colorScheme === "dark" ? Colors.dark.text : Colors.light.text,
          }}
        />
        <Stack.Screen
          name="share-receiver"
          options={{
            presentation: "transparentModal",
            animation: "fade",
            headerShown: false,
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
