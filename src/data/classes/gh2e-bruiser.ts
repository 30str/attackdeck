import type { ClassDef } from "../types";
import { add, card, multi, note, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/gh2e/character/bruiser.json
// Brute → "Bruiser" rename in Gloomhaven 2nd Edition. Uses FH rules variant.

export const gh2eBruiser: ClassDef = {
  id: "gh2e-bruiser",
  game: "gloomhaven-2e",
  name: "Bruiser",
  iconRef: "bruiser",
  rulesVariant: "fh",
  startingDeck: "base",
  perks: [
    replace("p01", 2, 1, card(-1), 1, card(1), "Replace one -1 card with one +1 card"),
    replace("p02", 2, 1, card(-1), 1, card(0, true, "shield"), "Replace one -1 card with one rolling Shield 1 card"),
    replace("p03", 2, 1, card(0), 1, card(0, true, "custom"), "Replace one +0 card with one rolling Active ★ card"),
    replace("p04", 1, 1, card(0), 1, card(0, false, "stun"), "Replace one +0 card with one +0 Stun card"),
    add("p05", 2, 1, card(1, false, "heal"), "Add one +1 Heal 2 (self) card"),
    add("p06", 2, 1, card(2, false, "push"), "Add one +2 Push 2 card"),
    add("p07", 1, 1, card(3), "Add one +3 card"),
    multi(
      "p08",
      1,
      "Add one rolling Disarm and one rolling Muddle card",
      { op: "add", card: card(0, true, "disarm"), count: 1 },
      { op: "add", card: card(0, true, "muddle"), count: 1 }
    ),
    add("p09", 1, 2, card(1), "Ignore negative item effects: add two +1 cards"),
    note("p10", 2, "★ Bruiser scenario perk (combined)"),
    note("p11", 1, "★ Bruiser scenario perk"),
    note("p12", 1, "★ Bruiser scenario perk"),
  ],
};
