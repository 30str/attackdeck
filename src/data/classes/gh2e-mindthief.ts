import type { ClassDef } from "../types";
import { add, card, multi, note, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/gh2e/character/mindthief.json

export const gh2eMindthief: ClassDef = {
  id: "gh2e-mindthief",
  game: "gloomhaven-2e",
  name: "Mindthief",
  iconRef: "mindthief",
  rulesVariant: "fh",
  startingDeck: "base",
  perks: [
    multi(
      "p01",
      2,
      "Replace two -1 cards with one +0 ★ card",
      { op: "remove", card: card(-1), count: 2 },
      { op: "add", card: card(0, false, "custom"), count: 1 }
    ),
    replace("p02", 3, 1, card(0), 1, card(1, false, "custom"), "Replace one +0 card with one +1 ★ card"),
    replace("p03", 2, 1, card(0), 1, card(2), "Replace one +0 card with one +2 card"),
    add("p04", 1, 2, card(1, false, "immobilize"), "Add two +1 Immobilize cards"),
    add("p05", 3, 1, card(2, false, "ice"), "Add one +2 ICE card"),
    add("p06", 2, 1, card(0, true, "invisible"), "Add one rolling Invisible (self) card"),
    add("p07", 1, 1, card(1, true), "Ignore scenario effects: add one rolling +1 card"),
    note("p08", 1, "★ Mindthief scenario perk"),
    note("p09", 1, "★ Mindthief scenario perk"),
    note("p10", 2, "★ Mindthief scenario perk (combined)"),
  ],
};
