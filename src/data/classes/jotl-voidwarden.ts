import type { ClassDef } from "../types";
import { add, card, remove, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/jotl/character/voidwarden.json

export const jotlVoidwarden: ClassDef = {
  id: "jotl-voidwarden",
  game: "jaws-of-the-lion",
  name: "Voidwarden",
  iconRef: "voidwarden",
  rulesVariant: "gh",
  startingDeck: "base",
  perks: [
    remove("p01", 1, 2, card(-1), "Remove two -1 cards"),
    remove("p02", 1, 1, card(-2), "Remove one -2 card"),
    replace("p03", 2, 1, card(0), 1, card(1, false, "dark"), "Replace one +0 card with one +1 DARK card"),
    replace("p04", 2, 1, card(0), 1, card(1, false, "ice"), "Replace one +0 card with one +1 ICE card"),
    replace("p05", 2, 1, card(-1), 1, card(0, false, "heal"), "Replace one -1 card with one +0 Heal 1 (ally) card"),
    add("p06", 3, 1, card(1, false, "heal"), "Add one +1 Heal 1 (ally) card"),
    add("p07", 1, 1, card(1, false, "poison"), "Add one +1 Poison card"),
    add("p08", 1, 1, card(3), "Add one +3 card"),
    add("p09", 2, 1, card(1, false, "curse"), "Add one +1 Curse card"),
  ],
};
