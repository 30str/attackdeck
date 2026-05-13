import type { ClassDef } from "../types";
import { add, card, note, remove, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/toa/character/gemstone.json
// Custom-perk text resolved against data.custom.toa.gemstone.X.

export const toaShardrender: ClassDef = {
  id: "toa-shardrender",
  game: "trail-of-ashes",
  name: "Shardrender",
  codeName: "Gemstone",
  iconRef: "gemstone",
  rulesVariant: "fh",
  startingDeck: "base",
  perks: [
    remove("p01", 1, 1, card(-2), "Remove one -2 card"),
    replace("p02", 2, 1, card(-1), 1, card(1), "Replace one -1 card with one +1 card"),
    replace("p03", 2, 1, card(-1), 1, card(0, true, "shield"), "Replace one -1 card with one rolling Shield 1 (self) card"),
    replace("p04", 2, 2, card(0), 2, card(0, false, "custom"), "Replace two +0 cards with two cards — each moves a Crystallize token back one space"),
    replace("p05", 2, 1, card(0), 1, card(1, true, "custom"), "Replace one +0 card with one rolling +1 card — +2 instead if the attack has Pierce"),
    add("p06", 1, 2, card(1, false, "custom"), "Add two +1 cards — +2 instead if you Crystallize one space"),
    add("p07", 1, 1, card(0, false, "brittle"), "Add one +0 Brittle card"),
    note("p08", 2, "Ignore negative item effects + at the start of each scenario, you may play a level 1 card to perform a Crystallize action (combined)"),
    note("p09", 1, "Once per scenario, when you would suffer damage from an attack, gain Shield 3 for that attack"),
    note("p10", 1, "On long rest, perform Regenerate, self"),
  ],
};
