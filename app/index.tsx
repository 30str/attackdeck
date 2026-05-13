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
  const [name, setName] = useState("");
  const [classId, setClassId] = useState<string>(CLASSES[0]?.id ?? "");
  const [pendingUnlock, setPendingUnlock] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const dismissPendingDelete = () => setPendingDeleteId(null);

  const isAvailable = (id: string) => {
    const k = findClass(id);
    if (!k) return false;
    return !isUnlockable(k) || unlockedClasses.includes(id);
  };

  const handleClassPress = (k: typeof CLASSES[number]) => {
    if (!isUnlockable(k)) {
      setClassId(k.id);
      return;
    }
    if (unlockedClasses.includes(k.id)) {
      setClassId(k.id);
      return;
    }
    if (pendingUnlock === k.id) {
      unlock(k.id);
      setPendingUnlock(null);
      setClassId(k.id);
    } else {
      setPendingUnlock(k.id);
    }
  };

  const handleAdd = () => {
    const trimmed = name.trim();
    if (!trimmed || !classId || !isAvailable(classId)) return;
    const id = addCharacter(trimmed, classId);
    setName("");
    setAddOpen(false);
    setPendingUnlock(null);
    router.push(`/character/${id}`);
  };

  const handleCloseModal = () => {
    setAddOpen(false);
    setPendingUnlock(null);
  };

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
          setAddOpen(true);
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
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t("party.namePlaceholder")}
              placeholderTextColor="#666"
              style={styles.input}
              autoFocus
            />
            <Text style={styles.modalLabel}>{t("party.classLabel")}</Text>
            <ScrollView style={styles.classList} contentContainerStyle={{ gap: 6 }}>
              {(() => {
                const firstFanId = GAMES.find((g) => g.category === "fan")?.id;
                return GAMES.map((g) => {
                  const classesForGame = CLASSES.filter((c) => c.game === g.id);
                  if (classesForGame.length === 0) return null;
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
                        style={[styles.classRow, classId === c.id && styles.classRowSel]}
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
                      const selected = classId === c.id && unlocked;
                      return (
                        <Pressable
                          key={c.id}
                          onPress={() => handleClassPress(c)}
                          style={[
                            styles.classRow,
                            !unlocked && styles.classRowLocked,
                            pending && styles.classRowPending,
                            selected && styles.classRowSel,
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
              <Pressable
                style={[styles.btn, !isAvailable(classId) && styles.btnDisabled]}
                onPress={handleAdd}
                disabled={!isAvailable(classId)}
              >
                <Text style={styles.btnTxt}>{t("common.add")}</Text>
              </Pressable>
            </View>
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
  classList: { maxHeight: 420 },
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
  btnDisabled: { opacity: 0.4 },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 8 },
  btn: { flex: 1, backgroundColor: "#cbb26a", padding: 14, borderRadius: 10, alignItems: "center" },
  btnTxt: { color: "#0a0a0a", fontWeight: "700" },
  btnGhost: { flex: 1, backgroundColor: "#2a2a2a", padding: 14, borderRadius: 10, alignItems: "center" },
  btnGhostTxt: { color: "#f5f5f5", fontWeight: "600" },
});
