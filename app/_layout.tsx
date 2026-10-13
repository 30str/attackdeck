import { useEffect } from "react";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { Link, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Dimensions, Pressable, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as ScreenOrientation from "expo-screen-orientation";
import "react-native-reanimated";
import { useTranslation } from "react-i18next";
import i18n, { detectDeviceLocale } from "@/src/i18n";
import { useSettings } from "@/src/state/settings";
import { UpdateChip, useUpdateRecheck } from "@/src/components/UpdateChip";
import { UpdateAppliedToast } from "@/src/components/UpdateAppliedToast";

export default function RootLayout() {
  const { t } = useTranslation();
  const languageOverride = useSettings((s) => s.languageOverride);
  useUpdateRecheck();

  useEffect(() => {
    const target = languageOverride ?? detectDeviceLocale();
    if (i18n.language !== target) {
      i18n.changeLanguage(target);
    }
  }, [languageOverride]);

  // Lock portrait on phones, but leave large screens (tablets/foldables)
  // rotatable. The manifest no longer restricts orientation (Android 16 ignores
  // that on large screens anyway) — we enforce it at runtime for phones only.
  useEffect(() => {
    const { width, height } = Dimensions.get("screen");
    const isLargeScreen = Math.min(width, height) >= 600;
    const apply = isLargeScreen
      ? ScreenOrientation.unlockAsync()
      : ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    apply.catch(() => {});
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={DarkTheme}>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: "#0a0a0a" },
            headerTintColor: "#f5f5f5",
            contentStyle: { backgroundColor: "#0a0a0a" },
            headerRight: () => <UpdateChip />,
          }}
        >
          <Stack.Screen
            name="index"
            options={{
              title: t("nav.party"),
              headerRight: () => (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <UpdateChip />
                  <Link href={"/settings" as never} asChild>
                    <Pressable hitSlop={12} style={{ paddingHorizontal: 8 }}>
                      <Text style={{ color: "#cbb26a", fontSize: 22 }}>⚙</Text>
                    </Pressable>
                  </Link>
                </View>
              ),
            }}
          />
          <Stack.Screen name="character/[id]" options={{ title: t("nav.character") }} />
          <Stack.Screen name="draw/[id]" options={{ title: t("nav.draw") }} />
          <Stack.Screen name="settings" options={{ title: t("nav.settings") }} />
        </Stack>
        <UpdateAppliedToast />
        <StatusBar style="light" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
