import type { ClassDef } from "../types";
import { add, card, note, remove, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/gh2e/character/lightning.json
// Note: GH2E Berserker has a ×2 card flagged "shuffle: false" — engine still
// triggers shuffle on x2. Apply manually until the engine grows a
// shuffleBehavior override.

export const gh2eBerserker: ClassDef = {
  id: "gh2e-berserker",
  game: "gloomhaven-2e",
  name: "Berserker",
  codeName: "Lightning",
  iconRef: "lightning",
  rulesVariant: "fh",
  startingDeck: "base",
  perks: [
    remove("p01", 1, 1, card(-2), "Remove one -2 card"),
    replace("p02", 3, 1, card(-1), 1, card(0, true, "heal"), "Replace one -1 card with one rolling Heal 1 (self) card"),
    replace("p03", 2, 2, card(0), 1, card(1, false, "custom"), "Replace two +0 cards with one +1 ★ card"),
    replace("p04", 1, 1, card(0), 2, card(0, true, "wound"), "Replace one +0 card with two rolling Wound cards"),
    add("p05", 2, 1, card(2, false, "fire"), "Add one +2 FIRE card"),
    add("p06", 1, 1, card(0, true, "stun"), "Add one rolling Stun card"),
    add("p07", 1, 1, card("x2", false, "custom"), "Add one ×2 ★ (does NOT trigger shuffle) card"),
    add("p08", 1, 1, card(1), "Ignore negative item effects: add one +1 card"),
    note("p09", 1, "★ Berserker scenario perk"),
    note("p10", 2, "★ Berserker scenario perk (combined)"),
    note("p11", 3, "★ Berserker scenario perk (combined)"),
  ],
};
