import { useState } from "react";
import { View, Text, FlatList, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, Modal } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { useParty } from "@/src/state/party";
import { useSettings } from "@/src/state/settings";
import { CLASSES, GAMES, findClass } from "@/src/data";
import { isUnlockable } from "@/src/data/types";
import { ClassIcon } from "@/src/components/ClassIcon";

export default function PartyScreen() {
  const { t } = useTranslation();
  const characters = useParty((s) => s.characters);
  const addCharacter = useParty((s) => s.addCharacter);
  const removeCharacter = useParty((s) => s.removeCharacter);
  const unlockedClasses = useSettings((s) => s.unlockedClasses);
  const unlock = useSettings((s) => s.unlock);

  const [addOpen, setAddOpen] = useState(false);
  const [step, setStep] = useState<"class" | "name">("class");
  const [name, setName] = useState("");
  const [classId, setClassId] = useState<string>("");
  const [query, setQuery] = useState("");
  const [pendingUnlock, setPendingUnlock] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const dismissPendingDelete = () => setPendingDeleteId(null);

  const isAvailable = (id: string) => {
    const k = findClass(id);
    if (!k) return false;
    return !isUnlockable(k) || unlockedClasses.includes(id);
  };

  const openAddModal = () => {
    setStep("class");
    setName("");
    setClassId("");
    setQuery("");
    setPendingUnlock(null);
    setAddOpen(true);
  };

  const handleClassPress = (k: typeof CLASSES[number]) => {
    if (!isUnlockable(k)) {
      setClassId(k.id);
      setStep("name");
      return;
    }
    if (unlockedClasses.includes(k.id)) {
      setClassId(k.id);
      setStep("name");
      return;
    }
    if (pendingUnlock === k.id) {
      unlock(k.id);
      setPendingUnlock(null);
      setClassId(k.id);
      setStep("name");
    } else {
      setPendingUnlock(k.id);
    }
  };

  const handleAdd = () => {
    if (!classId || !isAvailable(classId)) return;
    const klass = findClass(classId);
    if (!klass) return;
    const finalName = name.trim() || klass.name;
    addCharacter(finalName, classId);
    setAddOpen(false);
    setStep("class");
    setName("");
    setClassId("");
    setQuery("");
    setPendingUnlock(null);
  };

  const handleCloseModal = () => {
    setAddOpen(false);
    setStep("class");
    setPendingUnlock(null);
  };

  const handleBackToClass = () => {
    setStep("class");
    setName("");
  };

  const chosenClass = step === "name" ? findClass(classId) : null;

  const handleRowPress = (id: string) => {
    if (pendingDeleteId) {
      dismissPendingDelete();
      return;
    }
    router.push(`/draw/${id}`);
  };

  const handlePerksPress = (id: string) => {
    if (pendingDeleteId) {
      dismissPendingDelete();
      return;
    }
    router.push(`/character/${id}`);
  };

  const handleConfirmRemove = (id: string) => {
    removeCharacter(id);
    dismissPendingDelete();
  };

  return (
    <Pressable
      style={styles.root}
      onPress={pendingDeleteId ? dismissPendingDelete : undefined}
      // Make the wrapping Pressable inert when nothing is pending so it
      // doesn't interfere with scroll/tap on the inner FlatList rows.
    >
      {characters.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>{t("party.emptyTitle")}</Text>
          <Text style={styles.emptyBody}>{t("party.emptyBody")}</Text>
        </View>
      ) : (
        <FlatList
          data={characters}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const klass = findClass(item.classId);
            const pending = pendingDeleteId === item.id;
            return (
              <Pressable
                style={[styles.row, pending && styles.rowPending]}
                onPress={() => handleRowPress(item.id)}
                onLongPress={() => setPendingDeleteId(item.id)}
              >
                {klass ? <ClassIcon klass={klass} size={44} /> : null}
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowName}>{item.name}</Text>
                  <Text style={styles.rowSub}>{klass?.name ?? t("common.unknownClass")}</Text>
                </View>
                {pending ? (
                  <Pressable
                    hitSlop={12}
                    onPress={() => handleConfirmRemove(item.id)}
                    style={styles.remove}
                  >
                    <Text style={styles.removeTxt}>{t("party.remove")}</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    hitSlop={12}
                    onPress={() => handlePerksPress(item.id)}
                    style={styles.edit}
                  >
                    <Text style={styles.editTxt}>{t("common.perks")}</Text>
                  </Pressable>
                )}
              </Pressable>
            );
          }}
        />
      )}

      <Pressable
        style={styles.fab}
        onPress={() => {
          if (pendingDeleteId) {
            dismissPendingDelete();
            return;
          }
          openAddModal();
        }}
      >
        <Text style={styles.fabTxt}>{t("party.addBtn")}</Text>
      </Pressable>

      <Modal visible={addOpen} transparent animationType="slide" onRequestClose={handleCloseModal}>
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{t("party.newCharacter")}</Text>
            {step === "class" ? (
              <>
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder={t("party.searchClasses")}
                  placeholderTextColor="#666"
                  style={styles.input}
                  autoFocus
                  autoCorrect={false}
                  autoCapitalize="none"
                />
                <ScrollView
                  style={styles.classList}
                  contentContainerStyle={{ gap: 6 }}
                  keyboardShouldPersistTaps="handled"
                >
                  {(() => {
                    const firstFanId = GAMES.find((g) => g.category === "fan")?.id;
                    const q = query.trim().toLowerCase();
                    const matches = (c: typeof CLASSES[number]) => {
                      if (!q) return true;
                      const unlocked = !isUnlockable(c) || unlockedClasses.includes(c.id);
                      const haystack = unlocked ? c.name : c.codeName ?? c.name;
                      return haystack.toLowerCase().includes(q);
                    };
                    const visibleGames = GAMES.filter((g) =>
                      CLASSES.some((c) => c.game === g.id && matches(c))
                    );
                    if (visibleGames.length === 0) {
                      return (
                        <Text style={styles.emptySearch}>{t("party.noMatches")}</Text>
                      );
                    }
                    return visibleGames.map((g) => {
                      const classesForGame = CLASSES.filter((c) => c.game === g.id && matches(c));
                      const starters = classesForGame.filter((c) => !isUnlockable(c));
                      const lockable = classesForGame.filter((c) => isUnlockable(c));
                      const showFanDivider = g.id === firstFanId;
                      return (
                        <View key={g.id} style={{ gap: 6 }}>
                          {showFanDivider ? (
                            <Text style={styles.categoryHeader}>
                              {t("party.fanExpansionsHeader")}
                            </Text>
                          ) : null}
                          <Text style={styles.gameHeader}>{t(`games.${g.id}`)}</Text>
                          {starters.map((c) => (
                            <Pressable
                              key={c.id}
                              onPress={() => handleClassPress(c)}
                              style={styles.classRow}
                            >
                              <ClassIcon klass={c} size={32} />
                              <Text style={styles.classRowTxt}>{c.name}</Text>
                            </Pressable>
                          ))}
                          {lockable.length > 0 ? (
                            <Text style={styles.subHeader}>{t("party.unlockableHeader")}</Text>
                          ) : null}
                          {lockable.map((c) => {
                            const unlocked = unlockedClasses.includes(c.id);
                            const pending = pendingUnlock === c.id;
                            return (
                              <Pressable
                                key={c.id}
                                onPress={() => handleClassPress(c)}
                                style={[
                                  styles.classRow,
                                  !unlocked && styles.classRowLocked,
                                  pending && styles.classRowPending,
                                ]}
                              >
                                <ClassIcon klass={c} locked={!unlocked} size={32} />
                                {unlocked ? (
                                  <Text style={styles.classRowTxt}>{c.name}</Text>
                                ) : pending ? (
                                  <View style={{ flex: 1 }}>
                                    <Text style={styles.classRowTxt}>{c.codeName}</Text>
                                    <Text style={styles.unlockHint}>{t("party.tapAgainToReveal")}</Text>
                                  </View>
                                ) : (
                                  <Text style={styles.classRowLockedTxt}>{c.codeName}</Text>
                                )}
                              </Pressable>
                            );
                          })}
                        </View>
                      );
                    });
                  })()}
                </ScrollView>
                <View style={styles.modalActions}>
                  <Pressable style={styles.btnGhost} onPress={handleCloseModal}>
                    <Text style={styles.btnGhostTxt}>{t("common.cancel")}</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                {chosenClass ? (
                  <View style={styles.chosenRow}>
                    <ClassIcon klass={chosenClass} size={36} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.chosenName}>{chosenClass.name}</Text>
                      <Text style={styles.chosenGame}>{t(`games.${chosenClass.game}`)}</Text>
                    </View>
                  </View>
                ) : null}
                <Text style={styles.modalLabel}>{t("party.nameLabel")}</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder={chosenClass?.name ?? t("party.namePlaceholder")}
                  placeholderTextColor="#666"
                  style={styles.input}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleAdd}
                />
                <View style={styles.modalActions}>
                  <Pressable style={styles.btnGhost} onPress={handleBackToClass}>
                    <Text style={styles.btnGhostTxt}>{t("common.back")}</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.btn, !isAvailable(classId) && styles.btnDisabled]}
                    onPress={handleAdd}
                    disabled={!isAvailable(classId)}
                  >
                    <Text style={styles.btnTxt}>{t("common.add")}</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0a0a" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyTitle: { color: "#f5f5f5", fontSize: 20, fontWeight: "600" },
  emptyBody: { color: "#888", marginTop: 8 },
  list: { padding: 16, gap: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  rowPending: { borderColor: "#5a1f25", backgroundColor: "#1f1010" },
  rowName: { color: "#f5f5f5", fontSize: 18, fontWeight: "600" },
  rowSub: { color: "#888", marginTop: 4 },
  edit: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: "#2a2a2a", borderRadius: 8 },
  editTxt: { color: "#cbb26a", fontWeight: "600" },
  remove: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: "#5a1f25", borderRadius: 8 },
  removeTxt: { color: "#f5d5d5", fontWeight: "700", letterSpacing: 1 },
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
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modal: {
    backgroundColor: "#0f0f0f",
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 1,
    borderColor: "#2a2a2a",
    gap: 12,
    maxHeight: "90%",
    flexShrink: 1,
  },
  modalTitle: { color: "#f5f5f5", fontSize: 18, fontWeight: "700" },
  modalLabel: { color: "#888", marginTop: 4 },
  input: {
    color: "#f5f5f5",
    backgroundColor: "#1a1a1a",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  classRow: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  classRowSel: { borderColor: "#cbb26a", backgroundColor: "#1a1709" },
  classRowLocked: { backgroundColor: "#141414", borderStyle: "dashed" },
  classRowLockedTxt: { color: "#666", fontWeight: "500", fontStyle: "italic" },
  classRowPending: { borderColor: "#cbb26a", backgroundColor: "#1a1709" },
  unlockHint: { color: "#cbb26a", fontSize: 11, marginTop: 4, letterSpacing: 1 },
  classRowTxt: { color: "#f5f5f5", fontWeight: "600" },
  classRowGame: { color: "#888", fontSize: 12 },
  classList: { maxHeight: 420, flexShrink: 1, minHeight: 120 },
  gameHeader: { color: "#cbb26a", fontSize: 12, letterSpacing: 1.5, marginTop: 8, marginBottom: 2 },
  categoryHeader: {
    color: "#888",
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: "#2a2a2a",
  },
  subHeader: { color: "#666", fontSize: 11, letterSpacing: 1.2, marginTop: 4, marginBottom: 2, fontStyle: "italic" },
  emptySearch: { color: "#666", textAlign: "center", padding: 24, fontStyle: "italic" },
  chosenRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  chosenName: { color: "#f5f5f5", fontWeight: "700", fontSize: 16 },
  chosenGame: { color: "#888", fontSize: 12, marginTop: 2 },
  btnDisabled: { opacity: 0.4 },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 8 },
  btn: { flex: 1, backgroundColor: "#cbb26a", padding: 14, borderRadius: 10, alignItems: "center" },
  btnTxt: { color: "#0a0a0a", fontWeight: "700" },
  btnGhost: { flex: 1, backgroundColor: "#2a2a2a", padding: 14, borderRadius: 10, alignItems: "center" },
  btnGhostTxt: { color: "#f5f5f5", fontWeight: "600" },
});
