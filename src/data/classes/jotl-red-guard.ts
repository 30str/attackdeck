import type { ClassDef } from "../types";
import { add, card, multi, remove, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/jotl/character/red-guard.json

export const jotlRedGuard: ClassDef = {
  id: "jotl-red-guard",
  game: "jaws-of-the-lion",
  name: "Red Guard",
  iconRef: "red-guard",
  rulesVariant: "gh",
  startingDeck: "base",
  perks: [
    remove("p01", 1, 4, card(0), "Remove four +0 cards"),
    remove("p02", 1, 2, card(-1), "Remove two -1 cards"),
    multi(
      "p03",
      1,
      "Remove one -2 and one +1 card",
      { op: "remove", card: card(-2), count: 1 },
      { op: "remove", card: card(1), count: 1 }
    ),
    replace("p04", 2, 1, card(-1), 1, card(1), "Replace one -1 card with one +1 card"),
    replace("p05", 2, 1, card(1), 1, card(2, false, "fire"), "Replace one +1 card with one +2 FIRE card"),
    replace("p06", 2, 1, card(1), 1, card(2, false, "light"), "Replace one +1 card with one +2 LIGHT card"),
    add("p07", 2, 1, card(1, false, "fire", "light"), "Add one +1 FIRE + LIGHT card"),
    add("p08", 2, 1, card(1, false, "shield"), "Add one +1 Shield 1 (self) card"),
    replace("p09", 1, 1, card(0), 1, card(1, false, "immobilize"), "Replace one +0 card with one +1 Immobilize card"),
    replace("p10", 1, 1, card(0), 1, card(1, false, "wound"), "Replace one +0 card with one +1 Wound card"),
  ],
};
