import { ScrollView, View, Text, Switch, Pressable, Alert, Linking, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { useSettings } from "@/src/state/settings";
import { CLASSES } from "@/src/data";
import { isUnlockable } from "@/src/data/types";
import { SUPPORTED_LOCALES, type SupportedLocale } from "@/src/i18n";

export default function SettingsScreen() {
  const { t } = useTranslation();
  const hapticsEnabled = useSettings((s) => s.hapticsEnabled);
  const setHapticsEnabled = useSettings((s) => s.setHapticsEnabled);
  const unlockedClasses = useSettings((s) => s.unlockedClasses);
  const relockAll = useSettings((s) => s.relockAll);
  const unlockAllAction = useSettings((s) => s.unlockAll);
  const languageOverride = useSettings((s) => s.languageOverride);
  const setLanguage = useSettings((s) => s.setLanguage);

  const lockableClasses = CLASSES.filter(isUnlockable);
  const lockableIds = lockableClasses.map((c) => c.id);
  const unlockedCount = unlockedClasses.filter((id) => lockableIds.includes(id)).length;

  const confirmRelock = () => {
    Alert.alert(t("settings.relockTitle"), t("settings.relockBody"), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("settings.relock"), style: "destructive", onPress: relockAll },
    ]);
  };

  const confirmUnlockAll = () => {
    Alert.alert(t("settings.revealTitle"), t("settings.revealBody"), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("settings.reveal"), style: "destructive", onPress: () => unlockAllAction(lockableIds) },
    ]);
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>
      <Text style={styles.section}>{t("settings.preferences")}</Text>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowLabel}>{t("settings.haptics")}</Text>
          <Text style={styles.rowSub}>{t("settings.hapticsSub")}</Text>
        </View>
        <Switch
          value={hapticsEnabled}
          onValueChange={setHapticsEnabled}
          trackColor={{ false: "#2a2a2a", true: "#cbb26a" }}
          thumbColor={hapticsEnabled ? "#0a0a0a" : "#888"}
        />
      </View>

      <Text style={styles.section}>{t("settings.language")}</Text>
      <View style={styles.block}>
        <Text style={styles.body}>{t("settings.languageSub")}</Text>
      </View>
      <Pressable
        style={[styles.langRow, languageOverride === null && styles.langRowSel]}
        onPress={() => setLanguage(null)}
      >
        <Text style={styles.langTxt}>{t("languages.auto")}</Text>
        {languageOverride === null ? <Text style={styles.langCheck}>✓</Text> : null}
      </Pressable>
      {SUPPORTED_LOCALES.map((loc) => (
        <Pressable
          key={loc}
          style={[styles.langRow, languageOverride === loc && styles.langRowSel]}
          onPress={() => setLanguage(loc as SupportedLocale)}
        >
          <Text style={styles.langTxt}>{t(`languages.${loc}`)}</Text>
          {languageOverride === loc ? <Text style={styles.langCheck}>✓</Text> : null}
        </Pressable>
      ))}

      <Text style={styles.section}>{t("settings.unlockedClasses")}</Text>
      <View style={styles.block}>
        <Text style={styles.body}>
          {t("settings.unlockedStatus", { unlocked: unlockedCount, total: lockableClasses.length })}
        </Text>
      </View>
      <Pressable style={styles.action} onPress={confirmRelock} disabled={unlockedCount === 0}>
        <Text style={[styles.actionTxt, unlockedCount === 0 && styles.actionTxtDisabled]}>
          {t("settings.relockAll")}
        </Text>
      </Pressable>
      <Pressable style={styles.action} onPress={confirmUnlockAll}>
        <Text style={styles.actionTxt}>{t("settings.revealAll")}</Text>
      </Pressable>

      <Text style={styles.section}>{t("settings.about")}</Text>
      <View style={styles.block}>
        <Text style={styles.body}>{t("settings.aboutBody")}</Text>
      </View>

      <Text style={styles.section}>{t("settings.gameData")}</Text>
      <View style={styles.block}>
        <Text style={styles.body}>{t("settings.gameDataBody", { count: CLASSES.length })}</Text>
        <Text style={[styles.body, styles.warn]}>{t("settings.gameDataWarn")}</Text>
      </View>

      <Text style={styles.section}>{t("settings.credits")}</Text>
      <View style={styles.block}>
        <Text style={styles.body}>{t("settings.creditsDesign")}</Text>
        <Text style={styles.body}>{t("settings.creditsData")}</Text>
        <Text style={styles.body}>{t("settings.creditsApp")}</Text>
        <Text
          style={[styles.body, styles.link]}
          onPress={() => Linking.openURL("https://30str.com")}
        >
          {t("settings.creditsCompany")}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0a0a" },
  scroll: { padding: 16, paddingBottom: 48, gap: 6 },
  section: { color: "#cbb26a", fontSize: 12, letterSpacing: 1.5, marginTop: 18, marginBottom: 6 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    gap: 12,
  },
  rowLabel: { color: "#f5f5f5", fontSize: 15, fontWeight: "600" },
  rowSub: { color: "#888", fontSize: 12, marginTop: 4 },
  block: {
    padding: 14,
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    gap: 8,
  },
  body: { color: "#cfcfcf", fontSize: 14, lineHeight: 20 },
  warn: { color: "#cbb26a", fontStyle: "italic" },
  link: { color: "#cbb26a" },
  action: {
    padding: 14,
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    alignItems: "center",
    marginTop: 8,
  },
  actionTxt: { color: "#cbb26a", fontWeight: "600" },
  actionTxtDisabled: { color: "#555" },
  langRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    marginTop: 4,
  },
  langRowSel: { borderColor: "#cbb26a", backgroundColor: "#1a1709" },
  langTxt: { color: "#f5f5f5", fontSize: 15, fontWeight: "500" },
  langCheck: { color: "#cbb26a", fontSize: 18, fontWeight: "700" },
});
