import type { ClassDef } from "../types";
import { add, card, note, remove, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/fh/character/blinkblade.json
// Custom-perk text resolved against data.custom.fh.blinkblade.X.

export const fhBlinkblade: ClassDef = {
  id: "fh-blinkblade",
  game: "frosthaven",
  name: "Blinkblade",
  iconRef: "blinkblade",
  rulesVariant: "fh",
  startingDeck: "base",
  perks: [
    remove("p01", 1, 1, card(-2), "Remove one -2 card"),
    replace("p02", 2, 1, card(-1), 1, card(1), "Replace one -1 card with one +1 card"),
    replace("p03", 2, 1, card(-1), 1, card(0, false, "wound"), "Replace one -1 card with one +0 Wound card"),
    replace("p04", 2, 1, card(0), 1, card(1, false, "immobilize"), "Replace one +0 card with one +1 Immobilize card"),
    replace("p05", 3, 1, card(0), 1, card(0, true, "custom"), "Replace one +0 card with one rolling Active card — discard on next attack to add +2 attack (persistent)"),
    replace("p06", 1, 2, card(1), 2, card(2), "Replace two +1 cards with two +2 cards"),
    add("p07", 2, 1, card(-1, false, "custom"), "Add one -1 card — gain 1 Time token when drawn"),
    add("p08", 2, 1, card(2, true, "regenerate"), "Add one rolling +2 Regenerate (self) card"),
    note("p09", 1, "On short rest, spend one unspent item with no effect to Recover a different spent item"),
    note("p10", 1, "At the start of your first turn each scenario, you may perform Move 3"),
    note("p11", 1, "Whenever you would gain Immobilize, prevent the condition"),
  ],
};
