import type { ClassDef } from "../types";
import { add, card, remove, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/jotl/character/hatchet.json

export const jotlHatchet: ClassDef = {
  id: "jotl-hatchet",
  game: "jaws-of-the-lion",
  name: "Hatchet",
  iconRef: "hatchet",
  rulesVariant: "gh",
  startingDeck: "base",
  perks: [
    remove("p01", 2, 2, card(-1), "Remove two -1 cards"),
    replace("p02", 1, 1, card(0), 1, card(2, false, "muddle"), "Replace one +0 card with one +2 Muddle card"),
    replace("p03", 1, 1, card(0), 1, card(1, false, "poison"), "Replace one +0 card with one +1 Poison card"),
    replace("p04", 1, 1, card(0), 1, card(1, false, "wound"), "Replace one +0 card with one +1 Wound card"),
    replace("p05", 1, 1, card(0), 1, card(1, false, "immobilize"), "Replace one +0 card with one +1 Immobilize card"),
    replace("p06", 1, 1, card(0), 1, card(1, false, "push"), "Replace one +0 card with one +1 Push 2 card"),
    replace("p07", 1, 1, card(0), 1, card(0, false, "stun"), "Replace one +0 card with one +0 Stun card"),
    replace("p08", 1, 1, card(1), 1, card(1, false, "stun"), "Replace one +1 card with one +1 Stun card"),
    add("p09", 3, 1, card(2, false, "air"), "Add one +2 AIR card"),
    replace("p10", 3, 1, card(1), 1, card(3), "Replace one +1 card with one +3 card"),
  ],
};
