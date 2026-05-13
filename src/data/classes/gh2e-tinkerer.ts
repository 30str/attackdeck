import type { ClassDef } from "../types";
import { add, card, note, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/gh2e/character/tinkerer.json

export const gh2eTinkerer: ClassDef = {
  id: "gh2e-tinkerer",
  game: "gloomhaven-2e",
  name: "Tinkerer",
  iconRef: "tinkerer",
  rulesVariant: "fh",
  startingDeck: "base",
  perks: [
    replace("p01", 1, 1, card(-2), 1, card(0), "Replace one -2 card with one +0 card"),
    replace("p02", 3, 1, card(-1), 1, card(0, false, "heal"), "Replace one -1 card with one +0 Heal 1 (ally) card"),
    replace("p03", 2, 1, card(0), 1, card(1, false, "wound"), "Replace one +0 card with one +1 Wound card"),
    replace("p04", 2, 1, card(0), 1, card(1, false, "poison"), "Replace one +0 card with one +1 Poison card"),
    replace("p05", 2, 1, card(0), 1, card(1, false, "immobilize"), "Replace one +0 card with one +1 Immobilize card"),
    add("p06", 3, 1, card(2, false, "strengthen"), "Add one +2 Strengthen (ally) card"),
    add("p07", 1, 1, card(0, false, "heal"), "Ignore scenario effects: add one +0 Heal 1 (ally) card"),
    note("p08", 1, "★ Tinkerer scenario perk"),
    note("p09", 1, "★ Tinkerer scenario perk"),
    note("p10", 2, "★ Tinkerer scenario perk (combined)"),
  ],
};
