import { View, StyleSheet, type ViewProps } from "react-native";

// Phone-first UI capped to a readable column so it doesn't stretch edge-to-edge
// on iPad. Screens and footer buttons center their content within this width.
export const CONTENT_MAX_WIDTH = 560;

export function Bounded({ style, ...rest }: ViewProps) {
  return <View style={[styles.bounded, style]} {...rest} />;
}

const styles = StyleSheet.create({
  bounded: { width: "100%", maxWidth: CONTENT_MAX_WIDTH, alignSelf: "center" },
});
