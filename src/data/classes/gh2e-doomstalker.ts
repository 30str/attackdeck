import type { ClassDef } from "../types";
import { add, card, note, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/gh2e/character/angry-face.json
// Code name "Angry Face" (same as GH1).

export const gh2eDoomstalker: ClassDef = {
  id: "gh2e-doomstalker",
  game: "gloomhaven-2e",
  name: "Doomstalker",
  codeName: "Angry Face",
  iconRef: "angry-face",
  rulesVariant: "fh",
  startingDeck: "base",
  perks: [
    replace("p01", 1, 1, card(-2), 1, card(0), "Replace one -2 card with one +0 card"),
    replace("p02", 3, 1, card(-1), 1, card(-1, false, "custom"), "Replace one -1 card with one -1 ★ Doom card"),
    replace("p03", 2, 2, card(0), 2, card(1), "Replace two +0 cards with two +1 cards"),
    add("p04", 2, 1, card(0, false, "custom"), "Add one +0 ★ Doom-tag card"),
    add("p05", 2, 1, card(3), "Add one +3 card"),
    add("p06", 2, 1, card(0, true, "stun"), "Add one rolling Stun card"),
    add("p07", 1, 1, card(1, true), "Ignore scenario effects: add one rolling +1 card"),
    note("p08", 1, "★ Doomstalker scenario perk"),
    note("p09", 2, "★ Doomstalker scenario perk (combined)"),
    note("p10", 2, "★ Doomstalker scenario perk (combined)"),
  ],
};
