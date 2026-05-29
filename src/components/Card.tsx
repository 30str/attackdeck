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
  "custom",
]);

export type CardProps = {
  card: CardData;
  size?: "lg" | "md";
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

export function Card({ card, size = "lg" }: CardProps) {
  const { t } = useTranslation();
  const dim = size === "lg" ? styles.lg : styles.md;
  const flip = useSharedValue(0);
  const glow = useSharedValue(0);

  useEffect(() => {
    flip.value = 0;
    glow.value = 0;
    flip.value = withTiming(1, { duration: 480, easing: Easing.out(Easing.cubic) });
    glow.value = withSequence(
      withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) }),
      withDelay(120, withTiming(0, { duration: 520, easing: Easing.in(Easing.cubic) }))
    );
  }, [card.id, flip, glow]);

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
      {card.rolling ? <Text style={styles.rolling}>↻ ROLLING</Text> : null}
      <Text
        style={[styles.value, size === "lg" ? styles.valueLg : styles.valueMd]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.4}
      >
        {formatValue(card.value)}
      </Text>
      {card.effects.length > 0 ? (
        <View style={styles.effects}>
          {card.effects
            .filter((e) => RENDERED_EFFECTS.has(e))
            .map((e) => (
              <Text key={e} style={styles.effect}>
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
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#2a2a2a",
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  lg: { width: 260, height: 360 },
  md: { width: 90, height: 130 },
  rolling: {
    color: "#cbb26a",
    fontSize: 12,
    letterSpacing: 2,
    marginBottom: 8,
  },
  value: {
    color: "#f5f5f5",
    fontWeight: "700",
  },
  valueLg: { fontSize: 96 },
  valueMd: { fontSize: 32 },
  effects: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "center",
  },
  effect: {
    color: "#cbb26a",
    fontSize: 11,
    letterSpacing: 1.5,
    borderColor: "#3a3a3a",
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
});
