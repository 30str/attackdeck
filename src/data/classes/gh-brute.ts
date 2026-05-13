import type { ClassDef } from "../types";
import { add, card, multi, remove, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/gh/character/brute.json
// 15 perk applications total (sum of `count` fields). Verified against GHS.

export const ghBrute: ClassDef = {
  id: "gh-brute",
  game: "gloomhaven",
  name: "Brute",
  iconRef: "brute",
  rulesVariant: "gh",
  startingDeck: "base",
  perks: [
    remove("p01", 1, 2, card(-1), "Remove two -1 cards"),
    replace("p02", 1, 1, card(-1), 1, card(1), "Replace one -1 card with one +1 card"),
    add("p03", 2, 2, card(1), "Add two +1 cards"),
    add("p04", 1, 1, card(3), "Add one +3 card"),
    add("p05", 2, 3, card(0, true, "push"), "Add three rolling Push 1 cards"),
    add("p06", 1, 2, card(0, true, "pierce"), "Add two rolling Pierce 3 cards"),
    add("p07", 2, 1, card(0, true, "stun"), "Add one rolling Stun card"),
    multi(
      "p08",
      1,
      "Add one rolling Disarm and one rolling Muddle card",
      { op: "add", card: card(0, true, "disarm"), count: 1 },
      { op: "add", card: card(0, true, "muddle"), count: 1 }
    ),
    add("p09", 2, 1, card(0, true, "target"), "Add one rolling Target card"),
    add("p10", 1, 1, card(1, false, "shield"), "Add one +1 Shield 1 (self) card"),
    add("p11", 1, 1, card(1), "Ignore negative item effects and add one +1 card"),
  ],
};
