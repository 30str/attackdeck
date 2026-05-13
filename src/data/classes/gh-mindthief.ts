import type { ClassDef } from "../types";
import { add, card, multi, note, remove, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/gh/character/mindthief.json

export const ghMindthief: ClassDef = {
  id: "gh-mindthief",
  game: "gloomhaven",
  name: "Mindthief",
  iconRef: "mindthief",
  rulesVariant: "gh",
  startingDeck: "base",
  perks: [
    remove("p01", 2, 2, card(-1), "Remove two -1 cards"),
    remove("p02", 1, 4, card(0), "Remove four +0 cards"),
    replace("p03", 1, 2, card(1), 2, card(2), "Replace two +1 cards with two +2 cards"),
    replace("p04", 1, 1, card(-2), 1, card(0), "Replace one -2 card with one +0 card"),
    add("p05", 2, 1, card(2, false, "ice"), "Add one +2 ICE card"),
    add("p06", 2, 2, card(1, true), "Add two rolling +1 cards"),
    add("p07", 1, 3, card(0, true, "pull"), "Add three rolling Pull 1 cards"),
    add("p08", 1, 3, card(0, true, "muddle"), "Add three rolling Muddle cards"),
    add("p09", 1, 2, card(0, true, "immobilize"), "Add two rolling Immobilize cards"),
    add("p10", 1, 1, card(0, true, "stun"), "Add one rolling Stun card"),
    multi(
      "p11",
      1,
      "Add one rolling Disarm and one rolling Muddle card",
      { op: "add", card: card(0, true, "disarm"), count: 1 },
      { op: "add", card: card(0, true, "muddle"), count: 1 }
    ),
    note("p12", 1, "Ignore negative scenario effects"),
  ],
};
