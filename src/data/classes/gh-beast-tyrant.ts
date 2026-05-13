import type { ClassDef } from "../types";
import { add, card, note, remove, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/gh/character/two-mini.json

export const ghBeastTyrant: ClassDef = {
  id: "gh-beast-tyrant",
  game: "gloomhaven",
  name: "Beast Tyrant",
  codeName: "Two Mini",
  iconRef: "two-mini",
  rulesVariant: "gh",
  startingDeck: "base",
  perks: [
    remove("p01", 1, 2, card(-1), "Remove two -1 cards"),
    replace("p02", 3, 1, card(-1), 1, card(1), "Replace one -1 card with one +1 card"),
    replace("p03", 2, 1, card(0), 1, card(2), "Replace one +0 card with one +2 card"),
    add("p04", 2, 1, card(1, false, "wound"), "Add one +1 Wound card"),
    add("p05", 2, 1, card(1, false, "immobilize"), "Add one +1 Immobilize card"),
    add("p06", 3, 2, card(0, true, "heal"), "Add two rolling Heal 1 (self) cards"),
    add("p07", 1, 2, card(0, true, "earth"), "Add two rolling EARTH cards"),
    note("p08", 1, "Ignore negative scenario effects"),
  ],
};
