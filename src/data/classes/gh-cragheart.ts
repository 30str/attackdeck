import type { ClassDef } from "../types";
import { add, card, multi, note, remove, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/gh/character/cragheart.json

export const ghCragheart: ClassDef = {
  id: "gh-cragheart",
  game: "gloomhaven",
  name: "Cragheart",
  iconRef: "cragheart",
  rulesVariant: "gh",
  startingDeck: "base",
  perks: [
    remove("p01", 1, 4, card(0), "Remove four +0 cards"),
    replace("p02", 3, 1, card(-1), 1, card(1), "Replace one -1 card with one +1 card"),
    multi(
      "p03",
      1,
      "Add one -2 and two +2 cards",
      { op: "add", card: card(-2), count: 1 },
      { op: "add", card: card(2), count: 2 }
    ),
    add("p04", 2, 1, card(1, false, "immobilize"), "Add one +1 Immobilize card"),
    add("p05", 2, 1, card(2, false, "muddle"), "Add one +2 Muddle card"),
    add("p06", 1, 2, card(0, true, "push"), "Add two rolling Push 2 cards"),
    add("p07", 2, 2, card(0, true, "earth"), "Add two rolling EARTH cards"),
    add("p08", 1, 2, card(0, true, "air"), "Add two rolling AIR cards"),
    note("p09", 1, "Ignore negative item effects"),
    note("p10", 1, "Ignore negative scenario effects"),
  ],
};
