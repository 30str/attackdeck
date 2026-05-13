import type { ClassDef } from "../types";
import { add, card, note, remove, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/gh/character/lightning.json

export const ghBerserker: ClassDef = {
  id: "gh-berserker",
  game: "gloomhaven",
  name: "Berserker",
  codeName: "Lightning",
  iconRef: "lightning",
  rulesVariant: "gh",
  startingDeck: "base",
  perks: [
    remove("p01", 1, 2, card(-1), "Remove two -1 cards"),
    remove("p02", 1, 4, card(0), "Remove four +0 cards"),
    replace("p03", 2, 1, card(-1), 1, card(1), "Replace one -1 card with one +1 card"),
    replace("p04", 2, 1, card(0), 1, card(2, true), "Replace one +0 card with one rolling +2 card"),
    add("p05", 2, 2, card(0, true, "wound"), "Add two rolling Wound cards"),
    add("p06", 2, 1, card(0, true, "stun"), "Add one rolling Stun card"),
    add("p07", 1, 1, card(1, true, "disarm"), "Add one rolling +1 Disarm card"),
    add("p08", 1, 2, card(0, true, "heal"), "Add two rolling Heal 1 (self) cards"),
    add("p09", 2, 1, card(2, false, "fire"), "Add one +2 FIRE card"),
    note("p10", 1, "Ignore negative item effects"),
  ],
};
