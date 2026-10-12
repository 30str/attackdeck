import { memo, useCallback, useMemo, useState } from "react";
import { View, Text, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, Modal } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useParty, type Character } from "@/src/state/party";
import { useSettings } from "@/src/state/settings";
import { CLASSES, GAMES, findClass } from "@/src/data";
import { isUnlockable } from "@/src/data/types";
import { ClassIcon } from "@/src/components/ClassIcon";
import { CONTENT_MAX_WIDTH } from "@/src/components/Bounded";

type ClassEntry = (typeof CLASSES)[number];

// Flat row model for the class-picker FlatList: headers and class rows in one
// virtualized list instead of ~100 always-mounted rows in a ScrollView.
type PickerItem =
  | { kind: "fan-divider"; key: string }
  | { kind: "game-header"; key: string; gameId: string }
  | { kind: "unlockable-header"; key: string }
  | { kind: "class"; key: string; klass: ClassEntry; unlockable: boolean };

export default function PartyScreen() {
  const { t } = useTranslation();
  const characters = useParty((s) => s.characters);
  const addCharacter = useParty((s) => s.addCharacter);
  const removeCharacter = useParty((s) => s.removeCharacter);
  const unlockedClasses = useSettings((s) => s.unlockedClasses);
  const unlock = useSettings((s) => s.unlock);
  const insets = useSafeAreaInsets();

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

  const handleClassPress = useCallback(
    (k: ClassEntry) => {
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
    },
    [pendingUnlock, unlockedClasses, unlock]
  );

  // Rebuilt only when the search text or unlock set changes — not on every
  // render — and consumed by a virtualized FlatList below.
  const pickerItems = useMemo<PickerItem[]>(() => {
    const firstFanId = GAMES.find((g) => g.category === "fan")?.id;
    const q = query.trim().toLowerCase();
    const matches = (c: ClassEntry) => {
      if (!q) return true;
      const unlocked = !isUnlockable(c) || unlockedClasses.includes(c.id);
      const haystack = unlocked ? c.name : c.codeName ?? c.name;
      return haystack.toLowerCase().includes(q);
    };
    const items: PickerItem[] = [];
    for (const g of GAMES) {
      const classesForGame = CLASSES.filter((c) => c.game === g.id && matches(c));
      if (classesForGame.length === 0) continue;
      if (g.id === firstFanId) {
        items.push({ kind: "fan-divider", key: "fan-divider" });
      }
      items.push({ kind: "game-header", key: `game-${g.id}`, gameId: g.id });
      for (const c of classesForGame) {
        if (!isUnlockable(c)) items.push({ kind: "class", key: c.id, klass: c, unlockable: false });
      }
      const lockable = classesForGame.filter((c) => isUnlockable(c));
      if (lockable.length > 0) {
        items.push({ kind: "unlockable-header", key: `unlockable-${g.id}` });
        for (const c of lockable) {
          items.push({ kind: "class", key: c.id, klass: c, unlockable: true });
        }
      }
    }
    return items;
  }, [query, unlockedClasses]);

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

  // Stable identities so the memoized CharacterRow only re-renders when its
  // own character or pending-delete flag changes — not on every party update.
  const handleRowPress = useCallback(
    (id: string) => {
      if (pendingDeleteId) {
        setPendingDeleteId(null);
        return;
      }
      router.push(`/draw/${id}`);
    },
    [pendingDeleteId]
  );

  const handlePerksPress = useCallback(
    (id: string) => {
      if (pendingDeleteId) {
        setPendingDeleteId(null);
        return;
      }
      router.push(`/character/${id}`);
    },
    [pendingDeleteId]
  );

  const handleConfirmRemove = useCallback(
    (id: string) => {
      removeCharacter(id);
      setPendingDeleteId(null);
    },
    [removeCharacter]
  );

  const handleRowLongPress = useCallback((id: string) => setPendingDeleteId(id), []);

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
          // Bottom padding clears the floating Add button so the last row
          // can scroll out from under it.
          contentContainerStyle={[styles.list, { paddingBottom: 120 + insets.bottom }]}
          extraData={pendingDeleteId}
          renderItem={({ item }) => (
            <CharacterRow
              character={item}
              pending={pendingDeleteId === item.id}
              onPress={handleRowPress}
              onLongPress={handleRowLongPress}
              onPerks={handlePerksPress}
              onConfirmRemove={handleConfirmRemove}
            />
          )}
        />
      )}

      <View style={[styles.fabBar, { bottom: 24 + insets.bottom }]} pointerEvents="box-none">
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
      </View>

      <Modal visible={addOpen} transparent animationType="slide" onRequestClose={handleCloseModal}>
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={[styles.modal, { paddingBottom: 20 + insets.bottom }]}>
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
                <FlatList
                  style={styles.classList}
                  contentContainerStyle={styles.classListContent}
                  keyboardShouldPersistTaps="handled"
                  data={pickerItems}
                  keyExtractor={(item) => item.key}
                  extraData={pendingUnlock}
                  ListEmptyComponent={
                    <Text style={styles.emptySearch}>{t("party.noMatches")}</Text>
                  }
                  renderItem={({ item }) => {
                    switch (item.kind) {
                      case "fan-divider":
                        return (
                          <Text style={styles.categoryHeader}>
                            {t("party.fanExpansionsHeader")}
                          </Text>
                        );
                      case "game-header":
                        return <Text style={styles.gameHeader}>{t(`games.${item.gameId}`)}</Text>;
                      case "unlockable-header":
                        return <Text style={styles.subHeader}>{t("party.unlockableHeader")}</Text>;
                      case "class":
                        return (
                          <ClassPickerRow
                            klass={item.klass}
                            unlockable={item.unlockable}
                            unlocked={
                              !item.unlockable || unlockedClasses.includes(item.klass.id)
                            }
                            pending={pendingUnlock === item.klass.id}
                            onPress={handleClassPress}
                          />
                        );
                    }
                  }}
                />
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
                    <View style={styles.flex1}>
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

// Memoized so background party updates (a draw on another screen) and
// pending-delete toggles only re-render the rows whose props actually changed.
const CharacterRow = memo(function CharacterRow({
  character,
  pending,
  onPress,
  onLongPress,
  onPerks,
  onConfirmRemove,
}: {
  character: Character;
  pending: boolean;
  onPress: (id: string) => void;
  onLongPress: (id: string) => void;
  onPerks: (id: string) => void;
  onConfirmRemove: (id: string) => void;
}) {
  const { t } = useTranslation();
  const klass = findClass(character.classId);
  return (
    <Pressable
      style={[styles.row, pending && styles.rowPending]}
      onPress={() => onPress(character.id)}
      onLongPress={() => onLongPress(character.id)}
    >
      {klass ? <ClassIcon klass={klass} size={44} /> : null}
      <View style={styles.flex1}>
        <Text style={styles.rowName}>{character.name}</Text>
        <Text style={styles.rowSub}>{klass?.name ?? t("common.unknownClass")}</Text>
      </View>
      {pending ? (
        <Pressable
          hitSlop={12}
          onPress={() => onConfirmRemove(character.id)}
          style={styles.remove}
        >
          <Text style={styles.removeTxt}>{t("party.remove")}</Text>
        </Pressable>
      ) : (
        <Pressable
          hitSlop={12}
          onPress={() => onPerks(character.id)}
          style={styles.edit}
        >
          <Text style={styles.editTxt}>{t("common.perks")}</Text>
        </Pressable>
      )}
    </Pressable>
  );
});

const ClassPickerRow = memo(function ClassPickerRow({
  klass,
  unlockable,
  unlocked,
  pending,
  onPress,
}: {
  klass: ClassEntry;
  unlockable: boolean;
  unlocked: boolean;
  pending: boolean;
  onPress: (k: ClassEntry) => void;
}) {
  const { t } = useTranslation();
  if (!unlockable) {
    return (
      <Pressable onPress={() => onPress(klass)} style={styles.classRow}>
        <ClassIcon klass={klass} size={32} />
        <Text style={styles.classRowTxt}>{klass.name}</Text>
      </Pressable>
    );
  }
  return (
    <Pressable
      onPress={() => onPress(klass)}
      style={[
        styles.classRow,
        !unlocked && styles.classRowLocked,
        pending && styles.classRowPending,
      ]}
    >
      <ClassIcon klass={klass} locked={!unlocked} size={32} />
      {unlocked ? (
        <Text style={styles.classRowTxt}>{klass.name}</Text>
      ) : pending ? (
        <View style={styles.flex1}>
          <Text style={styles.classRowTxt}>{klass.codeName}</Text>
          <Text style={styles.unlockHint}>{t("party.tapAgainToReveal")}</Text>
        </View>
      ) : (
        <Text style={styles.classRowLockedTxt}>{klass.codeName}</Text>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  root: { flex: 1, backgroundColor: "#0a0a0a" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyTitle: { color: "#f5f5f5", fontSize: 20, fontWeight: "600" },
  emptyBody: { color: "#888", marginTop: 8 },
  list: { padding: 16, gap: 12, width: "100%", maxWidth: CONTENT_MAX_WIDTH, alignSelf: "center" },
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
  fabBar: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  fab: {
    width: "100%",
    maxWidth: CONTENT_MAX_WIDTH,
    backgroundColor: "#cbb26a",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  fabTxt: { color: "#0a0a0a", fontWeight: "700", fontSize: 16 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modal: {
    width: "100%",
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: "center",
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
  classListContent: { gap: 6 },
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
