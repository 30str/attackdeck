import type { ClassDef } from "../types";
import { add, card, note, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/fh/character/coral.json
// Custom-perk text resolved against data.custom.fh.coral.X.

export const fhCrashingTide: ClassDef = {
  id: "fh-crashing-tide",
  game: "frosthaven",
  name: "Crashing Tide",
  codeName: "Coral",
  iconRef: "coral",
  rulesVariant: "fh",
  startingDeck: "base",
  perks: [
    replace("p01", 2, 1, card(-1), 2, card(0, true, "pierce"), "Replace one -1 card with two rolling Pierce 3 cards"),
    replace("p02", 2, 1, card(-1), 1, card(0, false, "target"), "Replace one -1 card with one +0 Target card"),
    replace("p03", 2, 1, card(0), 1, card(1, true, "shield"), "Replace one +0 card with one rolling +1 Shield 1 card"),
    add("p04", 2, 2, card(1, false, "custom"), "Add two +1 cards — if you performed a Tides action this round, +2 instead"),
    add("p05", 2, 1, card(2, false, "muddle"), "Add one +2 Muddle card"),
    add("p06", 1, 1, card(1, false, "disarm"), "Add one +1 Disarm card"),
    add("p07", 2, 2, card(0, true, "heal"), "Add two rolling Heal 1 (self) cards"),
    note("p08", 1, "Ignore negative item effects; immunity to Impair"),
    note("p09", 1, "When declaring a long rest during card selection, gain Shield 1 for the round"),
    note("p10", 3, "Advantage on all attacks against enemies in or targeting water hexes (combined)"),
  ],
};
