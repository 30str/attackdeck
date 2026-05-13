import type { ClassDef } from "../types";
import { add, card, multi, remove, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/jotl/character/demolitionist.json

export const jotlDemolitionist: ClassDef = {
  id: "jotl-demolitionist",
  game: "jaws-of-the-lion",
  name: "Demolitionist",
  iconRef: "demolitionist",
  rulesVariant: "gh",
  startingDeck: "base",
  perks: [
    remove("p01", 1, 4, card(0), "Remove four +0 cards"),
    remove("p02", 2, 2, card(-1), "Remove two -1 cards"),
    multi(
      "p03",
      1,
      "Remove one -2 and one +1 card",
      { op: "remove", card: card(-2), count: 1 },
      { op: "remove", card: card(1), count: 1 }
    ),
    replace("p04", 2, 1, card(0), 1, card(2, false, "muddle"), "Replace one +0 card with one +2 Muddle card"),
    replace("p05", 1, 1, card(-1), 1, card(0, false, "poison"), "Replace one -1 card with one +0 Poison card"),
    add("p06", 2, 1, card(2), "Add one +2 card"),
    replace("p07", 2, 1, card(1), 1, card(2, false, "earth"), "Replace one +1 card with one +2 EARTH card"),
    replace("p08", 2, 1, card(1), 1, card(2, false, "fire"), "Replace one +1 card with one +2 FIRE card"),
    add("p09", 2, 1, card(0, false, "custom"), "Add one +0 ★ card"),
  ],
};
