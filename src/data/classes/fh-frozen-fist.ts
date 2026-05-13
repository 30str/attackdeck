import type { ClassDef } from "../types";
import { add, card, note, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/fh/character/fist.json
// Custom-perk text resolved against data.custom.fh.fist.X.

export const fhFrozenFist: ClassDef = {
  id: "fh-frozen-fist",
  game: "frosthaven",
  name: "Frozen Fist",
  codeName: "Fist",
  iconRef: "fist",
  rulesVariant: "fh",
  startingDeck: "base",
  perks: [
    replace("p01", 2, 1, card(-1), 1, card(0, false, "disarm"), "Replace one -1 card with one +0 Disarm card"),
    replace("p02", 1, 1, card(-1), 1, card(1), "Replace one -1 card with one +1 card"),
    replace("p03", 1, 1, card(-2), 1, card(0), "Replace one -2 card with one +0 card"),
    replace("p04", 2, 1, card(0), 1, card(1, true, "shield"), "Replace one +0 card with one rolling +1 Shield 1 card"),
    replace("p05", 2, 1, card(0), 1, card(1, false, "ice", "earth"), "Replace one +0 card with one +1 ICE/EARTH (half-element) card"),
    replace("p06", 2, 1, card(0), 1, card(2, false, "custom"), "Replace one +0 card with one +2 card — creates a 1-hex icy terrain adjacent to the target"),
    add("p07", 1, 1, card(3), "Add one +3 card"),
    add("p08", 3, 2, card(0, true, "heal"), "Add two rolling Heal 1 (self) cards"),
    note("p09", 1, "Ignore negative item effects; when entering icy terrain with a move ability, you may ignore the effect to add Move +1"),
    note("p10", 1, "On long-rest heal, you may consume ICE+EARTH (half-element) to add Heal +2"),
    note("p11", 2, "Once per scenario, when you would suffer damage, you may negate it (combined)"),
  ],
};
