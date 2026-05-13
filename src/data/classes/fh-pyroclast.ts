import type { ClassDef } from "../types";
import { add, card, note, remove, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/fh/character/meteor.json
// Custom-perk text resolved against data.custom.fh.meteor.X.

export const fhPyroclast: ClassDef = {
  id: "fh-pyroclast",
  game: "frosthaven",
  name: "Pyroclast",
  codeName: "Meteor",
  iconRef: "meteor",
  rulesVariant: "fh",
  startingDeck: "base",
  perks: [
    remove("p01", 1, 2, card(-1), "Remove two -1 cards"),
    remove("p02", 1, 1, card(-2), "Remove one -2 card"),
    replace("p03", 2, 1, card(0), 1, card(1, false, "wound"), "Replace one +0 card with one +1 Wound card"),
    replace("p04", 2, 1, card(-1), 1, card(0, false, "custom"), "Replace one -1 card with one +0 card — creates a 1-hex hazardous terrain adjacent to the target"),
    replace("p05", 2, 2, card(0), 2, card(0, true, "push"), "Replace two +0 cards with two rolling Push 2 cards"),
    replace("p06", 1, 2, card(1), 2, card(2), "Replace two +1 cards with two +2 cards"),
    add("p07", 2, 2, card(1, false, "fire", "earth"), "Add two +1 FIRE/EARTH (half-element) cards"),
    add("p08", 1, 2, card(1, true, "muddle"), "Add two rolling +1 Muddle cards"),
    note("p09", 1, "Ignore scenario effects"),
    note("p10", 1, "On long rest, you may destroy one adjacent obstacle to gain Ward"),
    note("p11", 1, "On short rest, you may consume FIRE element to give Wound (target 1 enemy in or adjacent to hazardous terrain)"),
    note("p12", 3, "You and all allies are unaffected by hazardous terrain you create (combined)"),
  ],
};
