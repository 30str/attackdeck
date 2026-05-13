import type { ClassDef } from "../types";
import { add, card, note, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/gh2e/character/squidface.json

export const gh2ePlagueherald: ClassDef = {
  id: "gh2e-plagueherald",
  game: "gloomhaven-2e",
  name: "Plagueherald",
  codeName: "Squid Face",
  iconRef: "squidface",
  rulesVariant: "fh",
  startingDeck: "base",
  perks: [
    replace("p01", 2, 1, card(-1), 1, card(1), "Replace one -1 card with one +1 card"),
    replace("p02", 2, 1, card(-1), 1, card(0, false, "custom"), "Replace one -1 card with one +0 ★ card"),
    replace("p03", 2, 1, card(0), 1, card(1, false, "curse"), "Replace one +0 card with one +1 Curse card"),
    replace("p04", 2, 1, card(0), 1, card(1, false, "immobilize"), "Replace one +0 card with one +1 Immobilize card"),
    replace("p05", 1, 2, card(1), 2, card(2), "Replace two +1 cards with two +2 cards"),
    add("p06", 2, 1, card(1, false, "stun"), "Add one +1 Stun card"),
    add("p07", 1, 3, card(0, true, "custom"), "Add three rolling ★ cards"),
    add("p08", 1, 2, card(0, true, "heal"), "Add two rolling Heal 1 (ally) cards"),
    add("p09", 1, 1, card(1), "Ignore scenario effects: add one +1 card"),
    note("p10", 1, "★ Plagueherald scenario perk"),
    note("p11", 1, "★ Plagueherald scenario perk"),
    note("p12", 2, "★ Plagueherald scenario perk (combined)"),
  ],
};
