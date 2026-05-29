import { useEffect, useMemo } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  interpolate,
  Extrapolation,
  Easing,
} from "react-native-reanimated";

// Reveal flourish keyed to the drawn card:
//   positive → full-screen gold splash: expanding glow + rings + radial burst (x2 / bless)
//   negative → red particle burst + red flash (miss / curse)
//   special  → subtle gold drift (perk-added "deck modifier" cards)
export type EffectTier = "positive" | "negative" | "special";

type Particle = {
  angle: number; // radians
  distance: number; // px from origin
  size: number;
  color: string;
};

const PALETTES: Record<EffectTier, string[]> = {
  positive: ["#cbb26a", "#ffe9a8", "#ffffff", "#f5d77a"],
  negative: ["#cc4444", "#7a1f1f", "#e06666", "#ff7a7a"],
  special: ["#cbb26a", "#9a8cff", "#ffe9a8"],
};

function buildParticles(tier: EffectTier, diag: number): Particle[] {
  const count = tier === "special" ? 8 : tier === "negative" ? 22 : 30;
  const palette = PALETTES[tier];
  // Positive fills the screen; negative reaches partway; special stays close.
  const reach = tier === "special" ? 46 : tier === "negative" ? diag * 0.34 : diag * 0.55;
  const out: Particle[] = [];
  for (let i = 0; i < count; i++) {
    let angle: number;
    if (tier === "negative") {
      angle = Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1; // downward-biased fan
    } else if (tier === "special") {
      angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.6; // gentle upward
    } else {
      angle = Math.random() * Math.PI * 2; // full radial burst
    }
    out.push({
      angle,
      distance: reach * (0.45 + Math.random() * 0.85),
      size: (tier === "special" ? 5 : tier === "negative" ? 7 : 8) + Math.random() * 7,
      color: palette[i % palette.length]!,
    });
  }
  return out;
}

type Shared = ReturnType<typeof useSharedValue<number>>;

export function DrawEffects({ tier, nonce }: { tier: EffectTier | null; nonce: number }) {
  const { width, height } = useWindowDimensions();
  const diag = Math.hypot(width, height);
  const progress = useSharedValue(0);
  const flash = useSharedValue(0);
  const particles = useMemo(
    () => (tier ? buildParticles(tier, diag) : []),
    // Regenerate the burst on every trigger, not just when the tier changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tier, nonce, diag],
  );

  useEffect(() => {
    if (!tier || nonce === 0) return;
    progress.value = 0;
    progress.value = withTiming(1, {
      duration: tier === "special" ? 1100 : tier === "positive" ? 1150 : 950,
      easing: Easing.out(Easing.cubic),
    });
    flash.value = withSequence(
      withTiming(1, { duration: tier === "positive" ? 130 : 90 }),
      withTiming(0, {
        duration: tier === "negative" ? 560 : tier === "positive" ? 620 : 380,
        easing: Easing.in(Easing.cubic),
      }),
    );
  }, [nonce, tier, progress, flash]);

  if (!tier) return null;

  const flashColor =
    tier === "negative"
      ? "rgba(180,40,40,0.42)"
      : tier === "positive"
        ? "rgba(203,178,106,0.40)"
        : "rgba(203,178,106,0.16)";

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Flash sv={flash} color={flashColor} />
      {tier === "positive" ? <Splash progress={progress} diag={diag} /> : null}
      <View style={styles.center} pointerEvents="none">
        <View style={styles.anchor}>
          {particles.map((p, i) => (
            <ParticleDot key={`${nonce}-${i}`} p={p} progress={progress} diag={diag} />
          ))}
        </View>
      </View>
    </View>
  );
}

// Full-screen celebration: a soft gold glow blooming from center plus a few
// concentric rings sweeping outward to fill the screen.
function Splash({ progress, diag }: { progress: Shared; diag: number }) {
  return (
    <View style={styles.center} pointerEvents="none">
      <Glow progress={progress} size={diag * 1.3} />
      <Ring progress={progress} size={diag} delay={0} />
      <Ring progress={progress} size={diag} delay={0.14} />
      <Ring progress={progress} size={diag} delay={0.28} />
    </View>
  );
}

function Glow({ progress, size }: { progress: Shared; size: number }) {
  const style = useAnimatedStyle(() => {
    const t = progress.value;
    return {
      opacity: interpolate(t, [0, 0.12, 0.5, 1], [0, 0.55, 0.3, 0], Extrapolation.CLAMP),
      transform: [{ scale: interpolate(t, [0, 1], [0.2, 1.15], Extrapolation.CLAMP) }],
    };
  });
  return (
    <Animated.View
      style={[
        { width: size, height: size, borderRadius: size / 2, backgroundColor: "#cbb26a" },
        styles.absCenter,
        style,
      ]}
    />
  );
}

function Ring({ progress, size, delay }: { progress: Shared; size: number; delay: number }) {
  const style = useAnimatedStyle(() => {
    const t = progress.value;
    return {
      opacity: interpolate(t, [delay, delay + 0.08, delay + 0.5, 1], [0, 0.85, 0.25, 0], Extrapolation.CLAMP),
      transform: [{ scale: interpolate(t, [delay, 1], [0, 1], Extrapolation.CLAMP) }],
    };
  });
  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 3,
          borderColor: "#ffe9a8",
        },
        styles.absCenter,
        style,
      ]}
    />
  );
}

function ParticleDot({ p, progress, diag }: { p: Particle; progress: Shared; diag: number }) {
  const gravity = diag * 0.06;
  const style = useAnimatedStyle(() => {
    const t = progress.value;
    const tx = Math.cos(p.angle) * p.distance * t - p.size / 2;
    const ty = Math.sin(p.angle) * p.distance * t + t * t * gravity - p.size / 2;
    return {
      opacity: interpolate(t, [0, 0.12, 0.7, 1], [0, 1, 1, 0], Extrapolation.CLAMP),
      transform: [
        { translateX: tx },
        { translateY: ty },
        { scale: interpolate(t, [0, 0.2, 1], [0.2, 1, 0.5], Extrapolation.CLAMP) },
      ],
    };
  });
  return (
    <Animated.View
      style={[
        styles.particle,
        { width: p.size, height: p.size, borderRadius: p.size / 2, backgroundColor: p.color },
        style,
      ]}
    />
  );
}

function Flash({ sv, color }: { sv: Shared; color: string }) {
  const style = useAnimatedStyle(() => ({ opacity: sv.value }));
  return <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: color }, style]} />;
}

const styles = StyleSheet.create({
  center: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  anchor: { width: 0, height: 0, alignItems: "center", justifyContent: "center" },
  absCenter: { position: "absolute" },
  particle: { position: "absolute", top: 0, left: 0 },
});
