import { useEffect, useState } from "react";
import { Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Updates from "expo-updates";
import Constants from "expo-constants";
import { useTranslation } from "react-i18next";
import { useSettings } from "../state/settings";
import { shouldAnnounceUpdate } from "./announceUpdate";

// Below the navigation header (which already sits under the top inset).
const TOP_OFFSET = 64;
const HOLD_MS = 3200;

/** "Updated to v1.0.6 · Oct 13" on the first launch of a new OTA update.
 * Every OTA for one binary shares its version (runtimeVersion follows it), so
 * the publish date is what tells updates apart. Mount once (root layout). */
export function UpdateAppliedToast() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState<string | null>(null);
  const fade = useSharedValue(0);

  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled) return;
    // lastSeenUpdateId is persisted, so wait for the settings store to load.
    const check = () => {
      const { lastSeenUpdateId, setLastSeenUpdateId } = useSettings.getState();
      const running = { updateId: Updates.updateId, isEmbeddedLaunch: Updates.isEmbeddedLaunch };
      if (shouldAnnounceUpdate(running, lastSeenUpdateId)) {
        const version = Constants.expoConfig?.version ?? "";
        const date = Updates.createdAt
          ? Updates.createdAt.toLocaleDateString(i18n.language, { month: "short", day: "numeric" })
          : "";
        setText(t("update.applied", { version, date }));
      }
      if (Updates.updateId && Updates.updateId !== lastSeenUpdateId) {
        setLastSeenUpdateId(Updates.updateId);
      }
    };
    if (useSettings.persist.hasHydrated()) {
      check();
      return;
    }
    return useSettings.persist.onFinishHydration(check);
    // Launch-only: the running update can't change without a reload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!text) return;
    fade.value = withSequence(
      withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) }),
      withDelay(
        HOLD_MS,
        withTiming(0, { duration: 400, easing: Easing.in(Easing.cubic) }, (finished) => {
          if (finished) runOnJS(setText)(null);
        }),
      ),
    );
  }, [text, fade]);

  const style = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [{ translateY: (1 - fade.value) * -8 }],
  }));

  if (!text) return null;
  return (
    <Animated.View style={[styles.toast, { top: insets.top + TOP_OFFSET }, style]} pointerEvents="none">
      <Text style={styles.txt}>{`✓ ${text}`}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    alignSelf: "center",
    backgroundColor: "#1a1a1a",
    borderColor: "#cbb26a",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  txt: { color: "#cbb26a", fontWeight: "600", fontSize: 13, letterSpacing: 0.5 },
});
