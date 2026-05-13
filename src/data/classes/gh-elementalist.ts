import type { ClassDef } from "../types";
import { add, card, multi, remove, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/gh/character/triangles.json

export const ghElementalist: ClassDef = {
  id: "gh-elementalist",
  game: "gloomhaven",
  name: "Elementalist",
  codeName: "Triangles",
  iconRef: "triangles",
  rulesVariant: "gh",
  startingDeck: "base",
  perks: [
    remove("p01", 2, 2, card(-1), "Remove two -1 cards"),
    replace("p02", 1, 1, card(-1), 1, card(1), "Replace one -1 card with one +1 card"),
    replace("p03", 2, 1, card(0), 1, card(2), "Replace one +0 card with one +2 card"),
    add("p04", 1, 3, card(0, false, "fire"), "Add three +0 FIRE cards"),
    add("p05", 1, 3, card(0, false, "ice"), "Add three +0 ICE cards"),
    add("p06", 1, 3, card(0, false, "air"), "Add three +0 AIR cards"),
    add("p07", 1, 3, card(0, false, "earth"), "Add three +0 EARTH cards"),
    multi(
      "p08",
      1,
      "Replace two +0 cards with one +0 FIRE and one +0 EARTH card",
      { op: "remove", card: card(0), count: 2 },
      { op: "add", card: card(0, false, "fire"), count: 1 },
      { op: "add", card: card(0, false, "earth"), count: 1 }
    ),
    multi(
      "p09",
      1,
      "Replace two +0 cards with one +0 ICE and one +0 AIR card",
      { op: "remove", card: card(0), count: 2 },
      { op: "add", card: card(0, false, "ice"), count: 1 },
      { op: "add", card: card(0, false, "air"), count: 1 }
    ),
    add("p10", 1, 2, card(1, false, "push"), "Add two +1 Push 1 cards"),
    add("p11", 1, 1, card(1, false, "wound"), "Add one +1 Wound card"),
    add("p12", 1, 1, card(0, false, "stun"), "Add one +0 Stun card"),
    add("p13", 1, 1, card(0, false, "target"), "Add one +0 Target card"),
  ],
};
