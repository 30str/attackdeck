import type { ClassDef } from "../types";
import { add, card, note, remove, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/gh2e/character/spellweaver.json

export const gh2eSpellweaver: ClassDef = {
  id: "gh2e-spellweaver",
  game: "gloomhaven-2e",
  name: "Spellweaver",
  iconRef: "spellweaver",
  rulesVariant: "fh",
  startingDeck: "base",
  perks: [
    replace("p01", 1, 1, card(-2), 1, card(0), "Replace one -2 card with one +0 card"),
    replace("p02", 3, 1, card(-1), 1, card(0, false, "wild"), "Replace one -1 card with one +0 WILD card"),
    replace("p03", 3, 1, card(0), 1, card(1, false, "custom"), "Replace one +0 card with one +1 ★ card"),
    replace("p04", 2, 1, card(0), 1, card(1, false, "curse"), "Replace one +0 card with one +1 Curse card"),
    add("p05", 2, 1, card(1, false, "stun"), "Add one +1 Stun card"),
    add("p06", 2, 1, card(2, false, "fire", "ice"), "Add one +2 FIRE/ICE (half-element) card"),
    remove("p07", 1, 1, card(0), "Ignore scenario effects: remove one +0 card"),
    note("p08", 1, "★ Spellweaver scenario perk"),
    note("p09", 1, "★ Spellweaver scenario perk"),
    note("p10", 2, "★ Spellweaver scenario perk (combined)"),
  ],
};
