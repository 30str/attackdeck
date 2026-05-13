import type { ClassDef } from "../types";
import { add, card, note, remove, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/fh/character/trap.json
// Custom-perk text resolved against data.custom.fh.trap.X.

export const fhTrapper: ClassDef = {
  id: "fh-trapper",
  game: "frosthaven",
  name: "Trapper",
  codeName: "Trap",
  iconRef: "trap",
  rulesVariant: "fh",
  startingDeck: "base",
  perks: [
    remove("p01", 1, 1, card(-2), "Remove one -2 card"),
    replace("p02", 2, 1, card(-1), 1, card(0, false, "custom"), "Replace one -1 card with one +0 card — creates a 2-damage trap adjacent to the target"),
    replace("p03", 3, 1, card(-1), 1, card(0, false, "custom"), "Replace one -1 card with one +0 card — creates a 1-damage trap adjacent to the target"),
    replace("p04", 3, 2, card(0), 2, card(0, false, "custom"), "Replace two +0 cards with two +0 cards — each adds 2 damage or Heal 2 to a trap in Range 2"),
    replace("p05", 2, 2, card(1), 2, card(2, false, "immobilize"), "Replace two +1 cards with two +2 Immobilize cards"),
    add("p06", 3, 2, card(0, true, "push", "pull"), "Add two rolling cards — Push 2 OR Pull 2 (player picks)"),
    note("p07", 1, "Ignore scenario effects"),
    note("p08", 1, "On long rest, you may create one 1-damage trap in an adjacent empty hex"),
    note("p09", 1, "When entering a hex with a trap, you may choose not to spring it"),
    note("p10", 1, "At start of each scenario, you may create one 2-damage trap in an adjacent empty hex"),
  ],
};
