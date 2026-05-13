import type { ClassDef } from "../types";
import { add, card, note, remove, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/fh/character/shackles.json
// Custom-perk text resolved against data.custom.fh.shackles.X.

export const fhPainConduit: ClassDef = {
  id: "fh-pain-conduit",
  game: "frosthaven",
  name: "Pain Conduit",
  codeName: "Shackles",
  iconRef: "shackles",
  rulesVariant: "fh",
  startingDeck: "base",
  perks: [
    remove("p01", 2, 2, card(-1), "Remove two -1 cards"),
    replace("p02", 1, 1, card(-2), 1, card(-2, false, "curse"), "Replace one -2 card with one -2 Curse×2 card"),
    replace("p03", 1, 1, card(-1), 1, card(0, false, "disarm"), "Replace one -1 card with one +0 Disarm card"),
    replace("p04", 3, 1, card(0), 1, card(1, false, "fire", "air"), "Replace one +0 card with one +1 FIRE/AIR (half-element) card"),
    replace("p05", 1, 1, card(0), 1, card(2), "Replace one +0 card with one +2 card"),
    replace("p06", 1, 3, card(1), 3, card(1, false, "curse"), "Replace three +1 cards with three +1 Curse cards"),
    add("p07", 2, 3, card(0, true, "heal"), "Add three rolling Heal 1 (self) cards"),
    add("p08", 2, 1, card(0, false, "custom"), "Add one +0 card — add +1 attack for each negative condition you have"),
    add("p09", 1, 2, card(1), "Ignore scenario effects: add two +1 cards"),
    note("p10", 1, "On long rest, you may ignore all your negative conditions for the round (they cannot be removed that round)"),
    note("p11", 1, "On becoming exhausted, first perform Curse, target all within Range 3"),
    note("p12", 2, "Increase your maximum hit points by 5 (combined)"),
  ],
};
