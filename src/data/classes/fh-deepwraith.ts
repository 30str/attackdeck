import type { ClassDef } from "../types";
import { add, card, note, remove, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/fh/character/kelp.json
// Custom-perk text resolved against data.custom.fh.kelp.X.

export const fhDeepwraith: ClassDef = {
  id: "fh-deepwraith",
  game: "frosthaven",
  name: "Deepwraith",
  codeName: "Kelp",
  iconRef: "kelp",
  rulesVariant: "fh",
  startingDeck: "base",
  perks: [
    remove("p01", 1, 2, card(-1), "Remove two -1 cards"),
    replace("p02", 2, 1, card(-1), 1, card(0, false, "disarm"), "Replace one -1 card with one +0 Disarm card"),
    replace("p03", 1, 1, card(-2), 1, card(-1, false, "stun"), "Replace one -2 card with one -1 Stun card"),
    replace("p04", 2, 1, card(0), 1, card(0, false, "invisible"), "Replace one +0 card with one +0 Invisible (self) card"),
    replace("p05", 1, 2, card(0), 2, card(0, true, "pierce"), "Replace two +0 cards with two rolling Pierce 3 cards"),
    replace("p06", 1, 2, card(1), 2, card(2), "Replace two +1 cards with two +2 cards"),
    replace("p07", 1, 3, card(1), 3, card(1, false, "curse"), "Replace three +1 cards with three +1 Curse cards"),
    add("p08", 3, 2, card(1, false, "custom"), "Add two +1 cards — gain 1 Trophy when drawn"),
    remove("p09", 1, 2, card(0), "Ignore scenario effects: remove two +0 cards"),
    note("p10", 1, "On long rest, you may Loot one adjacent hex; if you gain loot, gain 1 Trophy"),
    note("p11", 1, "At the start of each scenario, gain 2 Trophies"),
    note("p12", 3, "While you have Invisible, gain advantage on all your attacks (combined)"),
  ],
};
