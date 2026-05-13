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
import { useParty } from "@/src/state/party";
import { useSettings } from "@/src/state/settings";
import { Card } from "@/src/components/Card";
import type { Card as CardData } from "@/src/data/types";

type DrawMode = "normal" | "advantage" | "disadvantage";

const DRAW_COOLDOWN_MS = 1000;

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
  const hapticsEnabled = useSettings((s) => s.hapticsEnabled);

  const [mode, setMode] = useState<DrawMode>("normal");
  const [isCoolingDown, setIsCoolingDown] = useState(false);
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

  const handleDraw = () => {
    if (isCoolingDown) return;

    if (hapticsEnabled) {
      if (deck.needsShuffle) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }
    if (mode === "normal") {
      drawCard(character.id);
    } else {
      drawCardAdvantage(character.id);
    }

    setIsCoolingDown(true);
    cooldownFill.value = 0;
    cooldownFill.value = withTiming(1, {
      duration: DRAW_COOLDOWN_MS,
      easing: Easing.out(Easing.cubic),
    });
    if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
    cooldownTimer.current = setTimeout(() => setIsCoolingDown(false), DRAW_COOLDOWN_MS);
  };

  const handleShuffleNow = () => {
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    shuffleAll(character.id);
  };

  const baseDrawLabel = mode === "normal" ? t("draw.drawBtn") : t("draw.drawTwice");
  const drawLabel = deck.needsShuffle
    ? t("draw.shuffleAndDraw", { label: baseDrawLabel })
    : baseDrawLabel;
  const showAdvHint = mode !== "normal" && sequences.length === 2;
  const advLabel = mode === "advantage" ? t("draw.pickBetter") : t("draw.pickWorse");

  return (
    <View style={styles.root}>
      <View style={styles.top}>
        <Text style={styles.name}>{character.name}</Text>
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

      <View style={styles.cardArea}>
        {sequences.length === 0 ? (
          <Text style={styles.placeholder}>{t("draw.tapToDraw")}</Text>
        ) : sequences.length === 1 ? (
          <SequenceView sequence={sequences[0]!} />
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

      {deck.needsShuffle ? (
        <Pressable style={styles.shuffleNow} onPress={handleShuffleNow}>
          <Text style={styles.shuffleNowTxt}>{t("draw.shuffleNow")}</Text>
        </Pressable>
      ) : null}

      <View style={styles.actions}>
        <Pressable
          style={[styles.action, !deck.previous && styles.actionDisabled]}
          onPress={() => undoDraw(character.id)}
          disabled={!deck.previous}
        >
          <Text style={[styles.actionTxt, !deck.previous && styles.actionTxtDisabled]}>{t("draw.undo")}</Text>
        </Pressable>
        <Pressable style={styles.bless} onPress={() => blessCharacter(character.id)}>
          <Text style={styles.blessTxt}>{t("draw.bless")}</Text>
        </Pressable>
        <Pressable style={styles.curse} onPress={() => curseCharacter(character.id)}>
          <Text style={styles.curseTxt}>{t("draw.curse")}</Text>
        </Pressable>
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
  root: { flex: 1, backgroundColor: "#0a0a0a", padding: 16 },
  empty: { color: "#888", padding: 24 },
  top: { alignItems: "center", marginBottom: 8 },
  name: { color: "#f5f5f5", fontSize: 18, fontWeight: "600" },
  counts: { color: "#888", marginTop: 4, fontSize: 12 },
  modeRow: { flexDirection: "row", gap: 6, marginBottom: 8 },
  modeBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: "#1a1a1a", alignItems: "center", borderWidth: 1, borderColor: "#2a2a2a" },
  modeBtnActive: { borderColor: "#cbb26a", backgroundColor: "#1a1709" },
  modeBtnTxt: { color: "#888", fontSize: 12, fontWeight: "600", letterSpacing: 1 },
  modeBtnTxtActive: { color: "#cbb26a" },
  cardArea: { flex: 1, alignItems: "center", justifyContent: "center" },
  placeholder: { color: "#444", fontSize: 16 },
  rolling: { gap: 8, paddingHorizontal: 8, alignItems: "center" },
  twoUp: { flex: 1, justifyContent: "center", alignItems: "center", width: "100%" },
  twoUpRow: { flexDirection: "row", gap: 12, alignItems: "center", justifyContent: "center" },
  twoUpCell: { alignItems: "center", justifyContent: "center" },
  advHint: { color: "#cbb26a", fontSize: 12, letterSpacing: 1.5, marginBottom: 12 },
  actions: { flexDirection: "row", gap: 8, marginBottom: 8 },
  bless: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: "#2a1f0a", alignItems: "center" },
  blessTxt: { color: "#cbb26a", fontWeight: "600" },
  curse: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: "#2a0f0f", alignItems: "center" },
  curseTxt: { color: "#cc8888", fontWeight: "600" },
  action: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: "#1a1a1a", alignItems: "center" },
  actionTxt: { color: "#cbb26a", fontWeight: "600", fontSize: 13 },
  actionDisabled: { backgroundColor: "#141414" },
  actionTxtDisabled: { color: "#444" },
  shuffleNow: {
    backgroundColor: "#1a1709",
    borderColor: "#cbb26a",
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 8,
  },
  shuffleNowTxt: { color: "#cbb26a", fontWeight: "700", letterSpacing: 1.2 },
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
