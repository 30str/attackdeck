import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { Image } from "expo-image";
import { useParty } from "@/src/state/party";
import { useSettings } from "@/src/state/settings";
import { Card } from "@/src/components/Card";
import { Bounded } from "@/src/components/Bounded";
import { DrawEffects, type EffectTier } from "@/src/components/DrawEffects";
import { ClassIcon } from "@/src/components/ClassIcon";
import { countBless, countCurse, canUndo } from "@/src/engine/deck";
import { findClass } from "@/src/data";
import { CLASS_PORTRAITS } from "@/src/assets/classPortraits";
import type { Card as CardData } from "@/src/data/types";

type DrawMode = "normal" | "advantage" | "disadvantage";

const DRAW_COOLDOWN_MS = 1000;

// Native footprint of a large card — must match Card.tsx's `lg` style.
// The card is scaled to fit its measured area so it never overflows onto
// the surrounding controls (the overlap/clipping bug on short screens).
const CARD_LG_W = 260;
const CARD_LG_H = 360;

// Map the just-drawn cards to a reveal flourish. x2/bless celebrate; miss/curse
// get the negative effect; perk-added "deck modifier" cards (id `perk-*`) get a
// subtle one. Plain base cards get nothing.
function tierForCards(sequences: CardData[][]): EffectTier | null {
  const cards = sequences.flat();
  if (cards.some((c) => c.value === "x2")) return "positive";
  if (cards.some((c) => c.value === "miss")) return "negative";
  if (cards.some((c) => c.id.startsWith("perk-"))) return "special";
  return null;
}

export default function DrawScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const character = useParty((s) => s.characters.find((c) => c.id === id));
  const drawCard = useParty((s) => s.drawCard);
  const drawCardAdvantage = useParty((s) => s.drawCardAdvantage);
  const undoDraw = useParty((s) => s.undoDraw);
  const shuffleAll = useParty((s) => s.shuffleAll);
  const shuffleDrawPile = useParty((s) => s.shuffleDrawPile);
  const rebuildDeck = useParty((s) => s.rebuildDeck);
  const blessCharacter = useParty((s) => s.blessCharacter);
  const curseCharacter = useParty((s) => s.curseCharacter);
  const removeBlessFromCharacter = useParty((s) => s.removeBlessFromCharacter);
  const removeCurseFromCharacter = useParty((s) => s.removeCurseFromCharacter);
  const hapticsEnabled = useSettings((s) => s.hapticsEnabled);

  const [mode, setMode] = useState<DrawMode>("normal");
  const [isCoolingDown, setIsCoolingDown] = useState(false);
  const [cardArea, setCardArea] = useState({ w: 0, h: 0 });
  const [effect, setEffect] = useState<{ tier: EffectTier | null; nonce: number }>({
    tier: null,
    nonce: 0,
  });
  const cooldownFill = useSharedValue(1); // 1 = full / ready, 0 = just pressed
  const cooldownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
    };
  }, []);

  if (!character) {
    return (
      <View style={styles.root}>
        <Text style={styles.empty}>{t("common.characterNotFound")}</Text>
      </View>
    );
  }

  const { deck } = character;
  const sequences = deck.active;

  const startCooldown = () => {
    setIsCoolingDown(true);
    cooldownFill.value = 0;
    cooldownFill.value = withTiming(1, {
      duration: DRAW_COOLDOWN_MS,
      easing: Easing.out(Easing.cubic),
    });
    if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
    cooldownTimer.current = setTimeout(() => setIsCoolingDown(false), DRAW_COOLDOWN_MS);
  };

  const handleDraw = () => {
    if (isCoolingDown) return;

    if (deck.needsShuffle) {
      if (hapticsEnabled) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      shuffleAll(character.id);
      startCooldown();
      return;
    }

    if (mode === "normal") {
      drawCard(character.id);
    } else {
      drawCardAdvantage(character.id);
    }

    // Store updates synchronously, so read back the freshly drawn cards to
    // pick the reveal flourish and a matching haptic.
    const updated = useParty.getState().characters.find((c) => c.id === character.id);
    const tier = updated ? tierForCards(updated.deck.active) : null;
    if (hapticsEnabled) {
      if (tier === "positive") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (tier === "negative") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }
    if (tier) setEffect((e) => ({ tier, nonce: e.nonce + 1 }));
    startCooldown();
  };

  const handleBlessAdd = () => {
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    blessCharacter(character.id);
  };
  const handleBlessRemove = () => {
    if (hapticsEnabled) Haptics.selectionAsync();
    removeBlessFromCharacter(character.id);
  };
  const handleCurseAdd = () => {
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    curseCharacter(character.id);
  };
  const handleCurseRemove = () => {
    if (hapticsEnabled) Haptics.selectionAsync();
    removeCurseFromCharacter(character.id);
  };

  const baseDrawLabel = mode === "normal" ? t("draw.drawBtn") : t("draw.drawTwice");
  const drawLabel = deck.needsShuffle ? t("draw.shuffleBtn") : baseDrawLabel;
  const showAdvHint = mode !== "normal" && sequences.length === 2;
  const advLabel = mode === "advantage" ? t("draw.pickBetter") : t("draw.pickWorse");
  const blessCount = countBless(deck);
  const curseCount = countCurse(deck);
  const undoable = canUndo(deck);
  const klass = findClass(character.classId);
  const portrait = CLASS_PORTRAITS[character.classId];
  const cardScale =
    cardArea.w && cardArea.h
      ? Math.max(
          0.5,
          Math.min(1.5, (cardArea.w - 16) / CARD_LG_W, (cardArea.h - 16) / CARD_LG_H),
        )
      : 1;

  return (
    <View style={styles.root}>
      <Bounded style={styles.inner}>
      <View style={styles.top}>
        <View style={styles.nameRow}>
          {klass ? <ClassIcon klass={klass} size={36} /> : null}
          <Text style={styles.name}>{character.name}</Text>
        </View>
        <Text style={styles.counts}>
          {t("draw.counts", { draw: deck.drawPile.length, discard: deck.discardPile.length })}
          {deck.needsShuffle ? `  · ${t("draw.shufflePending")}` : ""}
        </Text>
      </View>

      <View style={styles.modeRow}>
        <ModeBtn label={t("draw.modeNormal")} active={mode === "normal"} onPress={() => setMode("normal")} />
        <ModeBtn label={t("draw.modeAdvantage")} active={mode === "advantage"} onPress={() => setMode("advantage")} />
        <ModeBtn label={t("draw.modeDisadvantage")} active={mode === "disadvantage"} onPress={() => setMode("disadvantage")} />
      </View>

      <View
        style={styles.cardArea}
        onLayout={(e) =>
          setCardArea({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })
        }
      >
        {portrait ? (
          <Image
            source={portrait}
            style={styles.cardAreaBg}
            contentFit="contain"
            pointerEvents="none"
          />
        ) : null}
        {sequences.length === 0 ? (
          <Text style={styles.placeholder}>{t("draw.tapToDraw")}</Text>
        ) : sequences.length === 1 ? (
          <View style={{ transform: [{ scale: cardScale }] }}>
            <SequenceView sequence={sequences[0]!} />
          </View>
        ) : (
          <View style={styles.twoUp}>
            {showAdvHint ? <Text style={styles.advHint}>{advLabel}</Text> : null}
            <View style={styles.twoUpRow}>
              {sequences.map((seq, i) => (
                <View key={i} style={styles.twoUpCell}>
                  <SequenceView sequence={seq} size="md" />
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <Pressable
          style={[styles.action, !undoable && styles.actionDisabled]}
          onPress={() => undoDraw(character.id)}
          disabled={!undoable}
        >
          <Text style={[styles.actionTxt, !undoable && styles.actionTxtDisabled]}>{t("draw.undo")}</Text>
        </Pressable>
        <CountControl
          tone="bless"
          label={t("draw.blessLabel")}
          count={blessCount}
          onAdd={handleBlessAdd}
          onRemove={handleBlessRemove}
        />
        <CountControl
          tone="curse"
          label={t("draw.curseLabel")}
          count={curseCount}
          onAdd={handleCurseAdd}
          onRemove={handleCurseRemove}
        />
      </View>

      <View style={styles.actions}>
        <Pressable
          style={[styles.action, deck.drawPile.length === 0 && styles.actionDisabled]}
          onPress={() => shuffleDrawPile(character.id)}
          disabled={deck.drawPile.length === 0}
        >
          <Text style={[styles.actionTxt, deck.drawPile.length === 0 && styles.actionTxtDisabled]}>
            {t("draw.shuffleUndrawn")}
          </Text>
        </Pressable>
        <Pressable style={styles.action} onPress={() => shuffleAll(character.id)}>
          <Text style={styles.actionTxt}>{t("draw.shuffleAll")}</Text>
        </Pressable>
        <Pressable style={styles.action} onPress={() => rebuildDeck(character.id)}>
          <Text style={styles.actionTxt}>{t("common.reset")}</Text>
        </Pressable>
      </View>

      <DrawButton
        label={drawLabel}
        onPress={handleDraw}
        disabled={isCoolingDown}
        fill={cooldownFill}
      />
      </Bounded>
      <DrawEffects tier={effect.tier} nonce={effect.nonce} />
    </View>
  );
}

function DrawButton({
  label,
  onPress,
  disabled,
  fill,
}: {
  label: string;
  onPress: () => void;
  disabled: boolean;
  fill: ReturnType<typeof useSharedValue<number>>;
}) {
  const fillStyle = useAnimatedStyle(() => ({
    width: `${fill.value * 100}%`,
  }));
  return (
    <Pressable style={styles.drawBtn} onPress={onPress} disabled={disabled}>
      <Animated.View style={[styles.drawBtnFill, fillStyle]} />
      <Text style={styles.drawTxt}>{label}</Text>
    </Pressable>
  );
}

function ModeBtn({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      style={[styles.modeBtn, active && styles.modeBtnActive]}
      onPress={onPress}
    >
      <Text style={[styles.modeBtnTxt, active && styles.modeBtnTxtActive]}>{label}</Text>
    </Pressable>
  );
}

function CountControl({
  tone,
  label,
  count,
  onAdd,
  onRemove,
}: {
  tone: "bless" | "curse";
  label: string;
  count: number;
  onAdd: () => void;
  onRemove: () => void;
}) {
  const rowStyle = tone === "bless" ? styles.blessRow : styles.curseRow;
  const txtStyle = tone === "bless" ? styles.blessTxt : styles.curseTxt;
  const chipStyle = tone === "bless" ? styles.blessChip : styles.curseChip;
  const disabled = count <= 0;
  return (
    <View style={[styles.countCtl, rowStyle]}>
      <Pressable
        style={[styles.countChip, chipStyle, disabled && styles.countChipDisabled]}
        onPress={onRemove}
        disabled={disabled}
        hitSlop={6}
      >
        <Text style={[txtStyle, disabled && styles.countChipTxtDisabled]}>−</Text>
      </Pressable>
      <View style={styles.countCenter} pointerEvents="none">
        <Text style={[txtStyle, styles.countLabel]} numberOfLines={1}>
          {label}
        </Text>
        <Text style={[txtStyle, styles.countNum]} numberOfLines={1}>
          {count}
        </Text>
      </View>
      <Pressable
        style={[styles.countChip, chipStyle]}
        onPress={onAdd}
        hitSlop={6}
      >
        <Text style={txtStyle}>+</Text>
      </Pressable>
    </View>
  );
}

function SequenceView({ sequence, size = "lg" }: { sequence: CardData[]; size?: "lg" | "md" }) {
  if (sequence.length === 0) return null;
  if (sequence.length === 1) {
    return <Card card={sequence[0]!} size={size} />;
  }
  return (
    <ScrollView
      horizontal
      contentContainerStyle={styles.rolling}
      showsHorizontalScrollIndicator={false}
    >
      {sequence.map((c) => (
        <Card key={c.id} card={c} size="md" />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0a0a" },
  inner: { flex: 1, padding: 16 },
  empty: { color: "#888", padding: 24 },
  top: { alignItems: "center", marginBottom: 8 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  name: { color: "#f5f5f5", fontSize: 18, fontWeight: "600" },
  counts: { color: "#888", marginTop: 4, fontSize: 12 },
  modeRow: { flexDirection: "row", gap: 6, marginBottom: 8 },
  modeBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: "#1a1a1a", alignItems: "center", borderWidth: 1, borderColor: "#2a2a2a" },
  modeBtnActive: { borderColor: "#cbb26a", backgroundColor: "#1a1709" },
  modeBtnTxt: { color: "#888", fontSize: 12, fontWeight: "600", letterSpacing: 1 },
  modeBtnTxtActive: { color: "#cbb26a" },
  cardArea: { flex: 1, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  cardAreaBg: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    opacity: 0.22,
  },
  placeholder: { color: "#444", fontSize: 16 },
  rolling: { gap: 8, paddingHorizontal: 8, alignItems: "center" },
  twoUp: { flex: 1, justifyContent: "center", alignItems: "center", width: "100%" },
  twoUpRow: { flexDirection: "row", gap: 12, alignItems: "center", justifyContent: "center" },
  twoUpCell: { alignItems: "center", justifyContent: "center" },
  advHint: { color: "#cbb26a", fontSize: 12, letterSpacing: 1.5, marginBottom: 12 },
  actions: { flexDirection: "row", gap: 8, marginBottom: 8 },
  blessTxt: { color: "#cbb26a", fontWeight: "700" },
  curseTxt: { color: "#cc8888", fontWeight: "700" },
  action: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: "#1a1a1a", alignItems: "center" },
  actionTxt: { color: "#cbb26a", fontWeight: "600", fontSize: 13 },
  actionDisabled: { backgroundColor: "#141414" },
  actionTxtDisabled: { color: "#444" },
  countCtl: {
    flex: 2,
    flexDirection: "row",
    alignItems: "stretch",
    borderRadius: 10,
    overflow: "hidden",
  },
  blessRow: { backgroundColor: "#2a1f0a" },
  curseRow: { backgroundColor: "#2a0f0f" },
  countChip: {
    paddingHorizontal: 8,
    minWidth: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  blessChip: { backgroundColor: "#3a2c0e" },
  curseChip: { backgroundColor: "#3a1414" },
  countChipDisabled: { opacity: 0.35 },
  countChipTxtDisabled: { color: "#666" },
  countCenter: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 8 },
  countLabel: { fontSize: 11, letterSpacing: 0.5 },
  countNum: { fontSize: 14, marginTop: 1 },
  drawBtn: {
    backgroundColor: "#4a3f27",
    paddingVertical: 28,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  drawBtnFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#cbb26a",
  },
  drawTxt: { color: "#0a0a0a", fontWeight: "800", fontSize: 22, letterSpacing: 2 },
});
