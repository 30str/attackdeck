import type { ClassDef } from "../types";
import { add, card, note, remove, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/gh/character/sun.json

export const ghSunkeeper: ClassDef = {
  id: "gh-sunkeeper",
  game: "gloomhaven",
  name: "Sunkeeper",
  codeName: "Sun",
  iconRef: "sun",
  rulesVariant: "gh",
  startingDeck: "base",
  perks: [
    remove("p01", 2, 2, card(-1), "Remove two -1 cards"),
    remove("p02", 1, 4, card(0), "Remove four +0 cards"),
    replace("p03", 1, 1, card(-2), 1, card(0), "Replace one -2 card with one +0 card"),
    replace("p04", 1, 1, card(0), 1, card(2), "Replace one +0 card with one +2 card"),
    add("p05", 2, 2, card(1, true), "Add two rolling +1 cards"),
    add("p06", 2, 2, card(0, true, "heal"), "Add two rolling Heal 1 (self) cards"),
    add("p07", 1, 1, card(0, true, "stun"), "Add one rolling Stun card"),
    add("p08", 2, 2, card(0, true, "light"), "Add two rolling LIGHT cards"),
    add("p09", 1, 2, card(0, true, "shield"), "Add two rolling Shield 1 (self) cards"),
    add("p10", 1, 2, card(1), "Ignore negative item effects: add two +1 cards"),
    note("p11", 1, "Ignore negative scenario effects"),
  ],
};
