import { View, Text, StyleSheet } from "react-native";
import type { ClassDef } from "../data/types";

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
  const sourceName = locked ? klass.codeName ?? klass.name : klass.name;
  const text = locked ? "?" : monogram(sourceName);
  const hue = locked ? 0 : hueFromId(klass.id);
  const bg = locked ? "#1a1a1a" : `hsl(${hue}, 32%, 26%)`;
  const border = locked ? "#2a2a2a" : `hsl(${hue}, 38%, 42%)`;
  const fg = locked ? "#666" : `hsl(${hue}, 48%, 78%)`;

  return (
    <View
      style={[
        styles.box,
        {
          width: size,
          height: size,
          borderRadius: size * 0.22,
          backgroundColor: bg,
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
  },
  txt: {
    fontWeight: "800",
    letterSpacing: 1,
  },
});
