import type { ClassDef } from "../types";
import { add, card, remove, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/gh/character/three-spears.json

export const ghQuartermaster: ClassDef = {
  id: "gh-quartermaster",
  game: "gloomhaven",
  name: "Quartermaster",
  codeName: "Three Spears",
  iconRef: "three-spears",
  rulesVariant: "gh",
  startingDeck: "base",
  perks: [
    remove("p01", 2, 2, card(-1), "Remove two -1 cards"),
    remove("p02", 1, 4, card(0), "Remove four +0 cards"),
    replace("p03", 2, 1, card(0), 1, card(2), "Replace one +0 card with one +2 card"),
    add("p04", 2, 2, card(1, true), "Add two rolling +1 cards"),
    add("p05", 1, 3, card(0, true, "muddle"), "Add three rolling Muddle cards"),
    add("p06", 1, 2, card(0, true, "pierce"), "Add two rolling Pierce 3 cards"),
    add("p07", 1, 1, card(0, true, "stun"), "Add one rolling Stun card"),
    add("p08", 1, 1, card(0, true, "target"), "Add one rolling Target card"),
    add("p09", 3, 1, card(0, false, "refresh-item"), "Add one +0 Refresh Item card"),
    add("p10", 1, 2, card(1), "Ignore negative item effects: add two +1 cards"),
  ],
};
