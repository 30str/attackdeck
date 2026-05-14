import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import type { ClassDef } from "../data/types";
import { CLASS_ICONS } from "../assets/classPortraits";

export type ClassIconProps = {
  klass: ClassDef;
  locked?: boolean;
  size?: number;
};

/**
 * Stable hash of a string to a hue 0–360. Cycles through different prime
 * multipliers so visually similar IDs land far apart on the wheel.
 */
function hueFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % 360;
}

function monogram(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0]![0]! + words[1]![0]!).toUpperCase();
  }
  const single = words[0] ?? "";
  return single.slice(0, 2).toUpperCase() || "??";
}

export function ClassIcon({ klass, locked = false, size = 36 }: ClassIconProps) {
  const hue = locked ? 0 : hueFromId(klass.id);
  const bg = locked ? "#1a1a1a" : `hsl(${hue}, 32%, 18%)`;
  const border = locked ? "#2a2a2a" : `hsl(${hue}, 38%, 42%)`;
  const radius = size * 0.22;

  // Show class icon glyph when we have one. Locked classes get a flat grey
  // silhouette via tintColor — the shape hints at the class without revealing
  // the brand colors / artwork.
  const icon = CLASS_ICONS[klass.id];
  if (icon) {
    const inset = Math.round(size * 0.12);
    return (
      <View
        style={[
          styles.box,
          {
            width: size,
            height: size,
            borderRadius: radius,
            backgroundColor: bg,
            borderColor: border,
          },
        ]}
      >
        <Image
          source={icon}
          style={{ width: size - inset * 2, height: size - inset * 2 }}
          contentFit="contain"
          tintColor={locked ? "#555" : null}
        />
      </View>
    );
  }

  const sourceName = locked ? klass.codeName ?? klass.name : klass.name;
  const text = locked ? "?" : monogram(sourceName);
  const fg = locked ? "#666" : `hsl(${hue}, 48%, 78%)`;
  const monoBg = locked ? "#1a1a1a" : `hsl(${hue}, 32%, 26%)`;

  return (
    <View
      style={[
        styles.box,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: monoBg,
          borderColor: border,
        },
      ]}
    >
      <Text
        style={[
          styles.txt,
          { fontSize: size * 0.42, color: fg },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    overflow: "hidden",
  },
  txt: {
    fontWeight: "800",
    letterSpacing: 1,
  },
});
