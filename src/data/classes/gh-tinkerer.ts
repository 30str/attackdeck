import type { ClassDef } from "../types";
import { add, card, note, remove, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/gh/character/tinkerer.json

export const ghTinkerer: ClassDef = {
  id: "gh-tinkerer",
  game: "gloomhaven",
  name: "Tinkerer",
  iconRef: "tinkerer",
  rulesVariant: "gh",
  startingDeck: "base",
  perks: [
    remove("p01", 2, 2, card(-1), "Remove two -1 cards"),
    replace("p02", 1, 1, card(-2), 1, card(0), "Replace one -2 card with one +0 card"),
    add("p03", 1, 2, card(1), "Add two +1 cards"),
    add("p04", 1, 1, card(3), "Add one +3 card"),
    add("p05", 1, 2, card(0, true, "fire"), "Add two rolling FIRE cards"),
    add("p06", 1, 3, card(0, true, "muddle"), "Add three rolling Muddle cards"),
    add("p07", 2, 1, card(1, false, "wound"), "Add one +1 Wound card"),
    add("p08", 2, 1, card(1, false, "immobilize"), "Add one +1 Immobilize card"),
    add("p09", 2, 1, card(1, false, "heal"), "Add one +1 Heal 2 (self) card"),
    add("p10", 1, 1, card(0, false, "target"), "Add one +0 Target card"),
    note("p11", 1, "Ignore negative scenario effects"),
  ],
};
