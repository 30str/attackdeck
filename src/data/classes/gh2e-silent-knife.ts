import type { ClassDef } from "../types";
import { add, card, note, remove, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/gh2e/character/silent-knife.json
// Scoundrel → "Silent Knife" rename in Gloomhaven 2nd Edition.

export const gh2eSilentKnife: ClassDef = {
  id: "gh2e-silent-knife",
  game: "gloomhaven-2e",
  name: "Silent Knife",
  iconRef: "silent-knife",
  rulesVariant: "fh",
  startingDeck: "base",
  perks: [
    remove("p01", 1, 1, card(-2), "Remove one -2 card"),
    remove("p02", 1, 2, card(-1), "Remove two -1 cards"),
    replace("p03", 3, 1, card(-1), 1, card(1), "Replace one -1 card with one +1 card"),
    replace("p04", 3, 1, card(0), 1, card(1, false, "custom"), "Replace one +0 card with one +1 ★ card"),
    replace("p05", 2, 1, card(0), 1, card(2), "Replace one +0 card with one +2 card"),
    replace("p06", 2, 1, card(1), 1, card(1, true, "invisible"), "Replace one +1 card with one rolling +1 Invisible (self) card"),
    add("p07", 2, 1, card(1, false, "disarm"), "Add one +1 Disarm card"),
    note("p08", 1, "★ Silent Knife scenario perk"),
    note("p09", 1, "★ Silent Knife scenario perk"),
    note("p10", 2, "★ Silent Knife scenario perk (combined)"),
  ],
};
