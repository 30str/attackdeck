import { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, TextInput } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useTranslation } from "react-i18next";
import { useParty } from "@/src/state/party";
import { findClass } from "@/src/data";

export default function CharacterScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const character = useParty((s) => s.characters.find((c) => c.id === id));
  const togglePerk = useParty((s) => s.togglePerk);
  const rebuildDeck = useParty((s) => s.rebuildDeck);
  const renameCharacter = useParty((s) => s.renameCharacter);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState("");

  if (!character) {
    return (
      <View style={styles.root}>
        <Text style={styles.empty}>{t("common.characterNotFound")}</Text>
      </View>
    );
  }

  const klass = findClass(character.classId);
  if (!klass) {
    return (
      <View style={styles.root}>
        <Text style={styles.empty}>{t("common.unknownClass")}</Text>
      </View>
    );
  }

  const startEditingName = () => {
    setDraftName(character.name);
    setEditingName(true);
  };

  const commitName = () => {
    const trimmed = draftName.trim();
    renameCharacter(character.id, trimmed || klass.name);
    setEditingName(false);
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {editingName ? (
          <TextInput
            value={draftName}
            onChangeText={setDraftName}
            onSubmitEditing={commitName}
            onBlur={commitName}
            autoFocus
            selectTextOnFocus
            returnKeyType="done"
            placeholder={klass.name}
            placeholderTextColor="#444"
            style={styles.headingInput}
          />
        ) : (
          <Pressable
            onPress={startEditingName}
            accessibilityLabel={character.name}
            accessibilityHint={t("character.renameHint")}
            style={styles.headingRow}
          >
            <Text style={styles.heading}>{character.name}</Text>
            <Text style={styles.editGlyph}>✎</Text>
          </Pressable>
        )}
        <Text style={styles.sub}>{klass.name} · {t(`games.${klass.game}`)}</Text>

        <Text style={styles.section}>{t("common.perks")}</Text>
        {klass.perks.map((perk) => {
          const applied = character.perkCounts[perk.id] ?? 0;
          const description = t(`perks.${klass.id}.${perk.id}`, {
            defaultValue: perk.description,
          });
          return (
            <View key={perk.id} style={styles.perk}>
              <View style={{ flex: 1 }}>
                <Text style={styles.perkDesc}>{description}</Text>
                <Text style={styles.perkMeta}>
                  {applied} / {perk.count}
                </Text>
              </View>
              <View style={styles.counter}>
                <Pressable
                  style={styles.counterBtn}
                  onPress={() => togglePerk(character.id, perk.id, -1)}
                >
                  <Text style={styles.counterTxt}>−</Text>
                </Pressable>
                <Pressable
                  style={styles.counterBtn}
                  onPress={() => togglePerk(character.id, perk.id, 1)}
                  disabled={applied >= perk.count}
                >
                  <Text style={[styles.counterTxt, applied >= perk.count && styles.disabled]}>
                    +
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        })}

        <Pressable style={styles.secondary} onPress={() => rebuildDeck(character.id)}>
          <Text style={styles.secondaryTxt}>{t("character.resetDeck")}</Text>
        </Pressable>
      </ScrollView>

      <Pressable style={styles.fab} onPress={() => router.push(`/draw/${character.id}`)}>
        <Text style={styles.fabTxt}>{t("character.openDraw")}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0a0a" },
  scroll: { padding: 16, paddingBottom: 120, gap: 8 },
  empty: { color: "#888", padding: 24 },
  heading: { color: "#f5f5f5", fontSize: 28, fontWeight: "700" },
  headingRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  editGlyph: { color: "#888", fontSize: 18 },
  headingInput: {
    color: "#f5f5f5",
    fontSize: 28,
    fontWeight: "700",
    paddingVertical: 0,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#cbb26a",
  },
  sub: { color: "#888", marginBottom: 16 },
  section: { color: "#cbb26a", fontSize: 14, letterSpacing: 1.5, marginTop: 16, marginBottom: 8 },
  perk: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    gap: 12,
  },
  perkDesc: { color: "#f5f5f5", fontSize: 15 },
  perkMeta: { color: "#888", fontSize: 12, marginTop: 4 },
  counter: { flexDirection: "row", gap: 8 },
  counterBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
  },
  counterTxt: { color: "#f5f5f5", fontSize: 22, fontWeight: "700" },
  disabled: { color: "#444" },
  secondary: {
    marginTop: 24,
    padding: 14,
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    alignItems: "center",
  },
  secondaryTxt: { color: "#cbb26a", fontWeight: "600" },
  fab: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: "#cbb26a",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  fabTxt: { color: "#0a0a0a", fontWeight: "700", fontSize: 16 },
});
