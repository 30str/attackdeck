import type { ClassDef } from "../types";
import { add, card, remove, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/gh/character/saw.json

export const ghSawbones: ClassDef = {
  id: "gh-sawbones",
  game: "gloomhaven",
  name: "Sawbones",
  codeName: "Saw",
  iconRef: "saw",
  rulesVariant: "gh",
  startingDeck: "base",
  perks: [
    remove("p01", 2, 2, card(-1), "Remove two -1 cards"),
    remove("p02", 1, 4, card(0), "Remove four +0 cards"),
    replace("p03", 2, 1, card(0), 1, card(2), "Replace one +0 card with one +2 card"),
    add("p04", 2, 1, card(2, true), "Add one rolling +2 card"),
    add("p05", 2, 1, card(1, false, "immobilize"), "Add one +1 Immobilize card"),
    add("p06", 2, 2, card(0, true, "wound"), "Add two rolling Wound cards"),
    add("p07", 1, 1, card(0, true, "stun"), "Add one rolling Stun card"),
    add("p08", 2, 1, card(0, true, "heal"), "Add one rolling Heal 3 (self) card"),
    add("p09", 1, 1, card(0, false, "refresh-item"), "Add one +0 Refresh Item card"),
  ],
};
