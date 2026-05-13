import type { ClassDef } from "../types";
import { add, card, note, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/fh/character/drifter.json
// Custom-perk text resolved against data.custom.fh.drifter.X.

export const fhDrifter: ClassDef = {
  id: "fh-drifter",
  game: "frosthaven",
  name: "Drifter",
  iconRef: "drifter",
  rulesVariant: "fh",
  startingDeck: "base",
  perks: [
    replace("p01", 3, 1, card(-1), 1, card(1), "Replace one -1 card with one +1 card"),
    replace("p02", 1, 1, card(-2), 1, card(0), "Replace one -2 card with one +0 card"),
    replace("p03", 2, 1, card(1), 2, card(0, false, "custom"), "Replace one +1 card with two +0 cards — each moves a character token back one slot"),
    replace("p04", 1, 2, card(0), 2, card(0, true, "pierce"), "Replace two +0 cards with two rolling Pierce 3 cards"),
    replace("p05", 1, 2, card(0), 2, card(0, true, "push"), "Replace two +0 cards with two rolling Push 2 cards"),
    add("p06", 1, 1, card(3), "Add one +3 card"),
    add("p07", 2, 1, card(2, false, "immobilize"), "Add one +2 Immobilize card"),
    add("p08", 1, 2, card(0, true, "heal"), "Add two rolling Heal 1 (self) cards"),
    add("p09", 1, 1, card(1), "Ignore scenario effects: add one +1 card"),
    add("p10", 1, 1, card(1), "Ignore negative item effects: add one +1 card"),
    note("p11", 2, "On long rest, you may move one of your character tokens back one slot (combined)"),
    note("p12", 1, "You may bring one additional one-hand item into each scenario"),
    note("p13", 1, "At the end of each scenario, you may discard up to two loot cards (except Random Item) to draw that many new ones"),
  ],
};
