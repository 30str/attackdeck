import { useEffect } from "react";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { Link, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, Text } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { useTranslation } from "react-i18next";
import i18n, { detectDeviceLocale } from "@/src/i18n";
import { useSettings } from "@/src/state/settings";

export default function RootLayout() {
  const { t } = useTranslation();
  const languageOverride = useSettings((s) => s.languageOverride);

  useEffect(() => {
    const target = languageOverride ?? detectDeviceLocale();
    if (i18n.language !== target) {
      i18n.changeLanguage(target);
    }
  }, [languageOverride]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={DarkTheme}>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: "#0a0a0a" },
            headerTintColor: "#f5f5f5",
            contentStyle: { backgroundColor: "#0a0a0a" },
          }}
        >
          <Stack.Screen
            name="index"
            options={{
              title: t("nav.party"),
              headerRight: () => (
                <Link href={"/settings" as never} asChild>
                  <Pressable hitSlop={12} style={{ paddingHorizontal: 8 }}>
                    <Text style={{ color: "#cbb26a", fontSize: 22 }}>⚙</Text>
                  </Pressable>
                </Link>
              ),
            }}
          />
          <Stack.Screen name="character/[id]" options={{ title: t("nav.character") }} />
          <Stack.Screen name="draw/[id]" options={{ title: t("nav.draw") }} />
          <Stack.Screen name="settings" options={{ title: t("nav.settings") }} />
        </Stack>
        <StatusBar style="light" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
