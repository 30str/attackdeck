import type { ClassDef } from "../types";
import { add, card, multi, note, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/toa/character/ice-meteor.json
// Custom-perk text resolved against data.custom.toa.ice-meteor.X.

export const toaRimehearth: ClassDef = {
  id: "toa-rimehearth",
  game: "trail-of-ashes",
  name: "Rimehearth",
  codeName: "Ice Meteor",
  iconRef: "ice-meteor",
  rulesVariant: "fh",
  startingDeck: "base",
  perks: [
    replace("p01", 2, 1, card(-1), 1, card(0, true, "wound"), "Replace one -1 card with one rolling Wound card"),
    replace("p02", 1, 1, card(0), 1, card(0, true, "heal", "wound"), "Replace one +0 card with one rolling Heal 3 + Wound (self) card"),
    replace("p03", 1, 2, card(0), 2, card(0, true, "fire"), "Replace two +0 cards with two rolling FIRE cards"),
    multi(
      "p04",
      1,
      "Replace three +1 cards with one rolling +1, one +1 Wound, and one +1 Heal 1 (self) card",
      { op: "remove", card: card(1), count: 3 },
      { op: "add", card: card(1, true), count: 1 },
      { op: "add", card: card(1, false, "wound"), count: 1 },
      { op: "add", card: card(1, false, "heal"), count: 1 }
    ),
    replace("p05", 2, 1, card(0), 1, card(1, false, "ice"), "Replace one +0 card with one +1 ICE card"),
    replace("p06", 2, 1, card(-1), 1, card(0, false, "chill"), "Replace one -1 card with one +0 Chill card"),
    replace("p07", 1, 1, card(2), 1, card(3, false, "chill"), "Replace one +2 card with one +3 Chill card"),
    add("p08", 2, 1, card(2, false, "fire", "ice"), "Add one +2 FIRE/ICE (half-element) card"),
    add("p09", 1, 1, card(0, false, "brittle"), "Add one +0 Brittle card"),
    note("p10", 1, "At start of each scenario, either gain Wound to generate FIRE, or gain Chill to generate ICE"),
    add("p11", 1, 1, card(0, true, "fire", "ice"), "Ignore negative item effects: add one rolling FIRE/ICE (half-element) card"),
  ],
};
