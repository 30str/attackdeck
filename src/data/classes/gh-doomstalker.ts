import type { ClassDef } from "../types";
import { add, card, note, remove, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/gh/character/angry-face.json
// Code name: "Angry Face". Real name resolved via gh/label/spoiler/en.json.

export const ghDoomstalker: ClassDef = {
  id: "gh-doomstalker",
  game: "gloomhaven",
  name: "Doomstalker",
  codeName: "Angry Face",
  iconRef: "angry-face",
  rulesVariant: "gh",
  startingDeck: "base",
  perks: [
    remove("p01", 2, 2, card(-1), "Remove two -1 cards"),
    replace("p02", 3, 2, card(0), 2, card(1), "Replace two +0 cards with two +1 cards"),
    add("p03", 2, 2, card(1, true), "Add two rolling +1 cards"),
    add("p04", 1, 1, card(2, false, "muddle"), "Add one +2 Muddle card"),
    add("p05", 1, 1, card(1, false, "poison"), "Add one +1 Poison card"),
    add("p06", 1, 1, card(1, false, "wound"), "Add one +1 Wound card"),
    add("p07", 1, 1, card(1, false, "immobilize"), "Add one +1 Immobilize card"),
    add("p08", 1, 1, card(0, false, "stun"), "Add one +0 Stun card"),
    add("p09", 2, 1, card(0, true, "target"), "Add one rolling Target card"),
    note("p10", 1, "Ignore negative scenario effects"),
  ],
};
