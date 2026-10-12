import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, Modal } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
  Easing,
  FadeIn,
  LinearTransition,
} from "react-native-reanimated";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { Image } from "expo-image";
import { useParty } from "@/src/state/party";
import { useSettings } from "@/src/state/settings";
import { Card } from "@/src/components/Card";
import { Bounded, CONTENT_MAX_WIDTH } from "@/src/components/Bounded";
import { DrawEffects, type EffectTier } from "@/src/components/DrawEffects";
import { ClassIcon } from "@/src/components/ClassIcon";
import {
  countBless,
  countCurse,
  countTemp,
  canUndo,
  TEMP_CARD_VALUES,
  type TempCardValue,
} from "@/src/engine/deck";
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

// Discard cascade: the last few previously drawn cards splay out behind the
// current card, offset diagonally up-left so each one's corner value peeks out.
const STACK_MAX = 3;
const STACK_OFF_LG = 26;
const STACK_OFF_MD = 18;

// Map the just-drawn cards to a reveal flourish. x2/bless celebrate; miss/curse
// get the negative effect; perk-added "deck modifier" cards (id `perk-*`) and
// scenario temp cards (id `temp-*`) get a subtle one. Plain base cards get
// nothing.
function tierForCards(sequences: CardData[][]): EffectTier | null {
  const cards = sequences.flat();
  if (cards.some((c) => c.value === "x2")) return "positive";
  if (cards.some((c) => c.value === "miss")) return "negative";
  if (cards.some((c) => c.id.startsWith("perk-") || c.id.startsWith("temp-"))) return "special";
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
  const addTempToCharacter = useParty((s) => s.addTempToCharacter);
  const removeTempFromCharacter = useParty((s) => s.removeTempFromCharacter);
  const hapticsEnabled = useSettings((s) => s.hapticsEnabled);
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<DrawMode>("normal");
  const [tempOpen, setTempOpen] = useState(false);
  const [isCoolingDown, setIsCoolingDown] = useState(false);
  const [cardArea, setCardArea] = useState({ w: 0, h: 0 });
  const [effect, setEffect] = useState<{ tier: EffectTier | null; nonce: number }>({
    tier: null,
    nonce: 0,
  });
  const [toast, setToast] = useState<{ text: string; nonce: number } | null>(null);
  const handleToastDone = useCallback(() => setToast(null), []);
  const cooldownFill = useSharedValue(1); // 1 = full / ready, 0 = just pressed
  const cooldownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear the tier once the flourish finishes so DrawEffects unmounts its
  // particle tree instead of keeping it alive (invisible) until the next draw.
  // Keep the nonce so the next trigger still remounts fresh particles.
  const handleEffectDone = useCallback(() => {
    setEffect((e) => (e.tier ? { ...e, tier: null } : e));
  }, []);

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
  const handleTempAdd = (value: TempCardValue) => {
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addTempToCharacter(character.id, value);
  };
  const handleTempRemove = (value: TempCardValue) => {
    if (hapticsEnabled) Haptics.selectionAsync();
    removeTempFromCharacter(character.id, value);
  };
  // Shuffling the un-drawn pile changes nothing visible (counts and display
  // stay the same), so confirm it happened with a haptic and a brief toast.
  const handleShuffleUndrawn = () => {
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    shuffleDrawPile(character.id);
    setToast((prev) => ({ text: t("draw.shuffledUndrawn"), nonce: (prev?.nonce ?? 0) + 1 }));
  };
  const handleShuffleAll = () => {
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    shuffleAll(character.id);
  };
  // Reset is undoable, so no confirm dialog — the toast says how to get the
  // deck back after an accidental tap.
  const handleReset = () => {
    if (hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    rebuildDeck(character.id);
    setToast((prev) => ({ text: t("draw.deckReset"), nonce: (prev?.nonce ?? 0) + 1 }));
  };

  const baseDrawLabel = mode === "normal" ? t("draw.drawBtn") : t("draw.drawTwice");
  const drawLabel = deck.needsShuffle ? t("draw.shuffleBtn") : baseDrawLabel;
  const showAdvHint = mode !== "normal" && sequences.length === 2;
  const advLabel = mode === "advantage" ? t("draw.pickBetter") : t("draw.pickWorse");
  const blessCount = countBless(deck);
  const curseCount = countCurse(deck);
  const tempTotal = countTemp(deck);
  const undoable = canUndo(deck);
  const klass = findClass(character.classId);
  const portrait = CLASS_PORTRAITS[character.classId];

  // The engine's recentDraws log is every card revealed by a draw, oldest
  // first — including drawn bless/curse, which leave the piles immediately
  // (one-shot) but still belong in the cascade. Minus the active cards (the
  // front display), the tail of the log is the stack. Undo rewinds the log
  // and a full shuffle clears it, so the display can't go stale.
  const activeIds = new Set(sequences.flat().map((c) => c.id));
  const stackCards = deck.recentDraws.filter((c) => !activeIds.has(c.id)).slice(-STACK_MAX);
  const frontIsSingle = sequences.length === 1 && sequences[0]!.length === 1;
  const stackExtent = frontIsSingle ? stackCards.length * STACK_OFF_LG : 0;

  const cardScale =
    cardArea.w && cardArea.h
      ? Math.max(
          0.5,
          Math.min(
            1.5,
            (cardArea.w - 16) / (CARD_LG_W + stackExtent),
            (cardArea.h - 16) / (CARD_LG_H + stackExtent),
          ),
        )
      : 1;

  return (
    <View style={styles.root}>
      <Bounded style={[styles.inner, { paddingBottom: 16 + insets.bottom }]}>
      <View style={styles.top}>
        <View style={styles.nameRow}>
          {klass ? <ClassIcon klass={klass} size={36} /> : null}
          <Text style={styles.name}>{character.name}</Text>
        </View>
        <Text style={styles.counts}>
          {t("draw.counts", { draw: deck.drawPile.length, discard: deck.discardPile.length })}
          {deck.needsShuffle ? `  · ${t("draw.shufflePending")}` : ""}
        </Text>
        <Pressable style={styles.tempPill} onPress={() => setTempOpen(true)} hitSlop={6}>
          <Text style={styles.tempPillTxt}>
            {`± ${t("draw.tempCards")}${tempTotal > 0 ? ` · ${tempTotal}` : ""}`}
          </Text>
        </Pressable>
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
            <View
              // Reserved frame: the stack peeks up-left of the card, so give it
              // room inside the scaled box instead of clipping at the cardArea.
              style={
                frontIsSingle && stackExtent > 0
                  ? {
                      width: CARD_LG_W + stackExtent,
                      height: CARD_LG_H + stackExtent,
                      alignItems: "flex-end",
                      justifyContent: "flex-end",
                    }
                  : undefined
              }
            >
              <CardStack cards={stackCards} size={frontIsSingle ? "lg" : "md"}>
                <SequenceView sequence={sequences[0]!} />
              </CardStack>
            </View>
          </View>
        ) : (
          <View style={styles.twoUp}>
            {showAdvHint ? <Text style={styles.advHint}>{advLabel}</Text> : null}
            <CardStack cards={stackCards} size="md">
              <View style={styles.twoUpRow}>
                {sequences.map((seq, i) => (
                  <View key={i} style={styles.twoUpCell}>
                    <SequenceView sequence={seq} size="md" />
                  </View>
                ))}
              </View>
            </CardStack>
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
          onPress={handleShuffleUndrawn}
          disabled={deck.drawPile.length === 0}
        >
          <Text style={[styles.actionTxt, deck.drawPile.length === 0 && styles.actionTxtDisabled]}>
            {t("draw.shuffleUndrawn")}
          </Text>
        </Pressable>
        <Pressable style={styles.action} onPress={handleShuffleAll}>
          <Text style={styles.actionTxt}>{t("draw.shuffleAll")}</Text>
        </Pressable>
        <Pressable style={styles.action} onPress={handleReset}>
          <Text style={styles.actionTxt}>{t("common.reset")}</Text>
        </Pressable>
      </View>

      <DrawButton
        label={drawLabel}
        onPress={handleDraw}
        disabled={isCoolingDown}
        fill={cooldownFill}
      />
      {toast ? (
        <Toast
          text={toast.text}
          nonce={toast.nonce}
          bottom={TOAST_BOTTOM + insets.bottom}
          onDone={handleToastDone}
        />
      ) : null}
      </Bounded>

      <Modal
        visible={tempOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setTempOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modal, { paddingBottom: 20 + insets.bottom }]}>
            <Text style={styles.modalTitle}>{t("draw.tempTitle")}</Text>
            <Text style={styles.modalBody}>{t("draw.tempBody")}</Text>
            {TEMP_CARD_VALUES.map((v) => (
              <TempCardRow
                key={v}
                value={v}
                count={countTemp(deck, v)}
                onAdd={() => handleTempAdd(v)}
                onRemove={() => handleTempRemove(v)}
              />
            ))}
            <Pressable style={styles.modalBtn} onPress={() => setTempOpen(false)}>
              <Text style={styles.modalBtnTxt}>{t("common.done")}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <DrawEffects tier={effect.tier} nonce={effect.nonce} onDone={handleEffectDone} />
    </View>
  );
}

// Brief self-dismissing confirmation pill shown above the draw button.
// Offset from the bottom of the content column (before the safe-area inset).
const TOAST_BOTTOM = 104;

function Toast({
  text,
  nonce,
  bottom,
  onDone,
}: {
  text: string;
  nonce: number;
  bottom: number;
  onDone: () => void;
}) {
  const fade = useSharedValue(0);
  useEffect(() => {
    fade.value = 0;
    fade.value = withSequence(
      withTiming(1, { duration: 160, easing: Easing.out(Easing.cubic) }),
      withDelay(
        900,
        withTiming(0, { duration: 260, easing: Easing.in(Easing.cubic) }, (finished) => {
          // Unmount once faded so the pill doesn't linger invisibly. A retrigger
          // bumps `nonce`, cancels this timing (finished=false), and restarts.
          if (finished) runOnJS(onDone)();
        }),
      ),
    );
  }, [nonce, fade, onDone]);
  const style = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [{ translateY: (1 - fade.value) * 8 }],
  }));
  return (
    <Animated.View style={[styles.toast, { bottom }, style]} pointerEvents="none">
      <Text style={styles.toastTxt}>{text}</Text>
    </Animated.View>
  );
}

function TempCardRow({
  value,
  count,
  onAdd,
  onRemove,
}: {
  value: TempCardValue;
  count: number;
  onAdd: () => void;
  onRemove: () => void;
}) {
  const label = value > 0 ? `+${value}` : String(value);
  const disabled = count <= 0;
  return (
    <View style={styles.tempRow}>
      <View style={styles.tempValueBadge}>
        <Text style={styles.tempValueTxt}>{label}</Text>
      </View>
      <Text style={[styles.tempCount, count === 0 && styles.tempCountZero]}>{count}</Text>
      <Pressable
        style={[styles.tempChip, disabled && styles.countChipDisabled]}
        onPress={onRemove}
        disabled={disabled}
        hitSlop={6}
      >
        <Text style={[styles.tempChipTxt, disabled && styles.countChipTxtDisabled]}>−</Text>
      </Pressable>
      <Pressable style={styles.tempChip} onPress={onAdd} hitSlop={6}>
        <Text style={styles.tempChipTxt}>＋</Text>
      </Pressable>
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
  // scaleX instead of width: width is a layout prop, so animating it forces a
  // re-layout every frame for the full cooldown second; a transform stays on
  // the compositor.
  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: fill.value }],
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

// Previously drawn cards splayed diagonally behind the current display, oldest
// deepest. Each new draw shifts the others back a slot (animated by the layout
// transition); keys are card ids so a card keeps its identity while sliding.
function CardStack({
  cards,
  size,
  children,
}: {
  cards: CardData[];
  size: "lg" | "md";
  children: ReactNode;
}) {
  const off = size === "lg" ? STACK_OFF_LG : STACK_OFF_MD;
  const n = cards.length;
  return (
    <View>
      {cards.map((c, i) => {
        const depth = n - i;
        return (
          <Animated.View
            key={c.id}
            entering={FadeIn.duration(160)}
            layout={LinearTransition.duration(200)}
            style={{
              position: "absolute",
              top: -depth * off,
              left: -depth * off,
              opacity: 1 - depth * 0.12,
            }}
          >
            <Card card={c} size={size} showCorner animateReveal={false} />
          </Animated.View>
        );
      })}
      {children}
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
  tempPill: {
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  tempPillTxt: { color: "#cbb26a", fontSize: 11, fontWeight: "600", letterSpacing: 1 },
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
    gap: 10,
  },
  modalTitle: { color: "#f5f5f5", fontSize: 18, fontWeight: "700" },
  modalBody: { color: "#888", fontSize: 13, lineHeight: 18, marginBottom: 4 },
  tempRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    padding: 8,
  },
  tempValueBadge: {
    width: 44,
    height: 58,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#3a3a3a",
    backgroundColor: "#101010",
    alignItems: "center",
    justifyContent: "center",
  },
  tempValueTxt: { color: "#f5f5f5", fontSize: 18, fontWeight: "700" },
  tempCount: { flex: 1, color: "#cbb26a", fontSize: 16, fontWeight: "700", textAlign: "center" },
  tempCountZero: { color: "#555" },
  tempChip: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
  },
  tempChipTxt: { color: "#cbb26a", fontSize: 20, fontWeight: "700" },
  modalBtn: {
    backgroundColor: "#cbb26a",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 6,
  },
  modalBtnTxt: { color: "#0a0a0a", fontWeight: "700" },
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
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#cbb26a",
    transformOrigin: "left",
  },
  drawTxt: { color: "#0a0a0a", fontWeight: "800", fontSize: 22, letterSpacing: 2 },
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
  toastTxt: { color: "#cbb26a", fontWeight: "600", fontSize: 13, letterSpacing: 0.5 },
});
