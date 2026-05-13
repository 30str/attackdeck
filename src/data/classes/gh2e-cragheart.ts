import type { ClassDef } from "../types";
import { add, card, note, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/gh2e/character/cragheart.json

export const gh2eCragheart: ClassDef = {
  id: "gh2e-cragheart",
  game: "gloomhaven-2e",
  name: "Cragheart",
  iconRef: "cragheart",
  rulesVariant: "fh",
  startingDeck: "base",
  perks: [
    replace("p01", 1, 1, card(-2), 1, card(0), "Replace one -2 card with one +0 card"),
    replace("p02", 3, 1, card(-1), 1, card(1), "Replace one -1 card with one +1 card"),
    replace("p03", 3, 1, card(0), 1, card(1, true, "custom"), "Replace one +0 card with one rolling +1 ★ card"),
    replace("p04", 2, 1, card(0), 2, card(1, false, "push"), "Replace one +0 card with two +1 Push 1 cards"),
    add("p05", 3, 1, card(2, false, "immobilize"), "Add one +2 Immobilize card"),
    add("p06", 1, 1, card(0, true, "muddle"), "Ignore scenario effects: add one rolling Muddle card"),
    note("p07", 1, "Ignore negative item effects"),
    note("p08", 1, "★ Cragheart scenario perk"),
    note("p09", 1, "★ Cragheart scenario perk"),
    note("p10", 2, "★ Cragheart scenario perk (combined)"),
  ],
};
