import { useEffect, useRef } from "react";
import { AppState, Pressable, Text, StyleSheet } from "react-native";
import * as Updates from "expo-updates";
import { useTranslation } from "react-i18next";
import { flushAll } from "../state/storage";

// expo-updates checks once per cold launch and downloads in the background,
// but only applies the update on the NEXT launch — and a phone that stays in
// the background between sessions may not cold-launch for days. So: also
// check whenever the app comes back to the foreground, and once an update is
// downloaded, offer a one-tap restart from the header.
const RECHECK_MS = 15 * 60 * 1000;

/** Re-checks for an OTA update on foreground. Mount once (root layout). */
export function useUpdateRecheck() {
  const lastCheck = useRef(Date.now());
  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled) return;
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active" || Date.now() - lastCheck.current < RECHECK_MS) return;
      lastCheck.current = Date.now();
      Updates.checkForUpdateAsync()
        .then((r) => (r.isAvailable ? Updates.fetchUpdateAsync() : undefined))
        .catch(() => {});
    });
    return () => sub.remove();
  }, []);
}

/** Header chip shown once a downloaded update is waiting; tap to restart into it. */
export function UpdateChip() {
  const { t } = useTranslation();
  const { isUpdatePending } = Updates.useUpdates();
  if (!isUpdatePending) return null;
  const restart = () => {
    // The party store's writes are debounced; a reload doesn't background the
    // app, so flush first or the last action would be lost.
    flushAll()
      .then(() => Updates.reloadAsync())
      .catch(() => {});
  };
  return (
    <Pressable
      style={styles.chip}
      onPress={restart}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={t("update.readyA11y")}
    >
      <Text style={styles.txt} numberOfLines={1}>{`↻ ${t("update.ready")}`}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: "#cbb26a",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginHorizontal: 4,
  },
  txt: { color: "#0a0a0a", fontWeight: "700", fontSize: 12 },
});
