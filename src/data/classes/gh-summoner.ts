import type { ClassDef } from "../types";
import { add, card, multi, remove, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/gh/character/circles.json

export const ghSummoner: ClassDef = {
  id: "gh-summoner",
  game: "gloomhaven",
  name: "Summoner",
  codeName: "Circles",
  iconRef: "circles",
  rulesVariant: "gh",
  startingDeck: "base",
  perks: [
    remove("p01", 1, 2, card(-1), "Remove two -1 cards"),
    replace("p02", 1, 1, card(-2), 1, card(0), "Replace one -2 card with one +0 card"),
    replace("p03", 3, 1, card(-1), 1, card(1), "Replace one -1 card with one +1 card"),
    add("p04", 2, 1, card(2), "Add one +2 card"),
    add("p05", 1, 2, card(0, true, "wound"), "Add two rolling Wound cards"),
    add("p06", 1, 2, card(0, true, "poison"), "Add two rolling Poison cards"),
    add("p07", 3, 2, card(0, true, "heal"), "Add two rolling Heal 1 (self) cards"),
    multi(
      "p08",
      1,
      "Add one rolling FIRE and one rolling AIR card",
      { op: "add", card: card(0, true, "fire"), count: 1 },
      { op: "add", card: card(0, true, "air"), count: 1 }
    ),
    multi(
      "p09",
      1,
      "Add one rolling DARK and one rolling EARTH card",
      { op: "add", card: card(0, true, "dark"), count: 1 },
      { op: "add", card: card(0, true, "earth"), count: 1 }
    ),
    add("p10", 1, 2, card(1), "Ignore negative scenario effects: add two +1 cards"),
  ],
};
