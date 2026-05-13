import type { ClassDef } from "../types";
import { add, card, multi, remove, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/gh/character/spellweaver.json

export const ghSpellweaver: ClassDef = {
  id: "gh-spellweaver",
  game: "gloomhaven",
  name: "Spellweaver",
  iconRef: "spellweaver",
  rulesVariant: "gh",
  startingDeck: "base",
  perks: [
    remove("p01", 1, 4, card(0), "Remove four +0 cards"),
    replace("p02", 2, 1, card(-1), 1, card(1), "Replace one -1 card with one +1 card"),
    add("p03", 2, 2, card(1), "Add two +1 cards"),
    add("p04", 1, 1, card(0, false, "stun"), "Add one +0 Stun card"),
    add("p05", 1, 1, card(1, false, "wound"), "Add one +1 Wound card"),
    add("p06", 1, 1, card(1, false, "immobilize"), "Add one +1 Immobilize card"),
    add("p07", 1, 1, card(1, false, "curse"), "Add one +1 Curse card"),
    add("p08", 2, 1, card(2, false, "fire"), "Add one +2 FIRE card"),
    add("p09", 2, 1, card(2, false, "ice"), "Add one +2 ICE card"),
    multi(
      "p10",
      1,
      "Add one rolling EARTH and one rolling AIR card",
      { op: "add", card: card(0, true, "earth"), count: 1 },
      { op: "add", card: card(0, true, "air"), count: 1 }
    ),
    multi(
      "p11",
      1,
      "Add one rolling LIGHT and one rolling DARK card",
      { op: "add", card: card(0, true, "light"), count: 1 },
      { op: "add", card: card(0, true, "dark"), count: 1 }
    ),
  ],
};
