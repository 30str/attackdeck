import { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  interpolate,
  interpolateColor,
  Easing,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import type { Card as CardData } from "../data/types";
import { CARD_W, CARD_H } from "./cardLayout";

// Effect tags that have a translation entry under "effects.<key>".
// Filtering here keeps unknown effects from rendering as a key-string.
const RENDERED_EFFECTS = new Set<string>([
  "fire", "ice", "earth", "air", "light", "dark", "wild",
  "wound", "poison", "immobilize", "stun", "muddle", "disarm",
  "bless", "curse", "invisible",
  "push", "pull", "pierce", "target", "advantage",
  "heal", "shield", "retaliate", "regenerate",
  "brittle", "ward", "strengthen", "impair", "bane",
  "chill", "dodge", "safeguard",
  "refresh-item", "refresh-spent",
  "temp", "custom",
]);

export type CardProps = {
  card: CardData;
  /** Multiplier on the native CARD_W × CARD_H design. Labels have a minimum
   * size so a small card (wrapped rolling chain, advantage pair) stays
   * readable instead of shrinking its text proportionally. */
  scale?: number;
  /** Playing-card style value index in the top-left corner, so the card stays
   * readable when splayed behind another card in the discard stack. */
  showCorner?: boolean;
  /** Skip the flip/glow reveal — stack cards already had their reveal when
   * they were drawn and must not re-flip on every re-render of the stack. */
  animateReveal?: boolean;
};

function formatValue(value: CardData["value"]): string {
  if (value === "miss") return "MISS";
  if (value === "x2") return "×2";
  if (typeof value === "number" && value > 0) return `+${value}`;
  return String(value);
}

function bgFor(card: CardData): string {
  if (card.effects.includes("bless")) return "#3b2a0f";
  if (card.effects.includes("curse")) return "#2a0f0f";
  if (card.value === "miss") return "#3a0f12";
  if (card.value === "x2") return "#0f3a12";
  return "#1a1a1a";
}

export function Card({ card, scale = 1, showCorner = false, animateReveal = true }: CardProps) {
  const { t } = useTranslation();
  const s = scale;
  const label = formatValue(card.value);
  // Word values ("MISS") get an explicit smaller size: adjustsFontSizeToFit
  // is ignored on web and unreliable on Android, which left "MI…" ellipsis.
  const valueSize = (label.length > 2 ? 52 : 96) * s;
  const dim = {
    width: CARD_W * s,
    height: CARD_H * s,
    borderRadius: Math.max(8, 14 * s),
    padding: Math.max(6, 16 * s),
  };
  const flip = useSharedValue(animateReveal ? 0 : 1);
  const glow = useSharedValue(0);

  useEffect(() => {
    if (!animateReveal) return;
    flip.value = 0;
    glow.value = 0;
    flip.value = withTiming(1, { duration: 480, easing: Easing.out(Easing.cubic) });
    glow.value = withSequence(
      withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) }),
      withDelay(120, withTiming(0, { duration: 520, easing: Easing.in(Easing.cubic) }))
    );
  }, [card.id, flip, glow, animateReveal]);

  const animatedStyle = useAnimatedStyle(() => {
    "worklet";
    const idleBorder = card.value === "miss" ? "#5a1f25" : card.value === "x2" ? "#1f5a25" : "#2a2a2a";
    return {
      opacity: Math.min(1, flip.value * 1.4),
      backfaceVisibility: "hidden",
      transform: [
        { perspective: 900 },
        { rotateY: `${(1 - flip.value) * 90}deg` },
        { scale: interpolate(flip.value, [0, 0.55, 1], [0.72, 1.12, 1.0]) },
      ],
      borderColor: interpolateColor(glow.value, [0, 1], [idleBorder, "#cbb26a"]),
      borderWidth: interpolate(glow.value, [0, 1], [2, 3]),
    };
  });

  return (
    <Animated.View style={[styles.card, dim, { backgroundColor: bgFor(card) }, animatedStyle]}>
      {showCorner ? (
        <Text
          style={[
            styles.corner,
            { top: 6 * s, left: 9 * s, fontSize: Math.max(10, 15 * s) },
          ]}
        >
          {`${card.rolling ? "↻" : ""}${label}`}
        </Text>
      ) : null}
      {card.rolling ? (
        <Text
          style={[
            styles.rolling,
            { fontSize: Math.max(9, 12 * s), letterSpacing: s < 0.6 ? 1 : 2, marginBottom: 8 * s },
          ]}
          numberOfLines={1}
        >
          {/* The word no longer fits on the smallest cards (long rolling
              chains in advantage); the glyph alone still reads. */}
          {s < 0.3 ? "↻" : "↻ ROLLING"}
        </Text>
      ) : null}
      <Text
        style={[styles.value, { fontSize: valueSize }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.4}
      >
        {label}
      </Text>
      {card.effects.length > 0 ? (
        <View style={[styles.effects, { marginTop: 12 * s }]}>
          {card.effects
            .filter((e) => RENDERED_EFFECTS.has(e))
            .map((e) => (
              <Text
                key={e}
                style={[
                  styles.effect,
                  { fontSize: Math.max(9, 11 * s), letterSpacing: s < 0.6 ? 0.5 : 1.5 },
                ]}
              >
                {t(`effects.${e}`)}
              </Text>
            ))}
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 2,
    borderColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
  },
  rolling: { color: "#cbb26a" },
  corner: { position: "absolute", color: "#f5f5f5", fontWeight: "800" },
  value: {
    color: "#f5f5f5",
    fontWeight: "700",
  },
  effects: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "center",
  },
  effect: {
    color: "#cbb26a",
    borderColor: "#3a3a3a",
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
});
