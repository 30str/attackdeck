import type { ClassDef } from "../types";
import { add, card, note, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/gh2e/character/two-mini.json
// Was "Beast Tyrant" in GH1; renamed to "Wildfury" in 2nd Edition.

export const gh2eWildfury: ClassDef = {
  id: "gh2e-wildfury",
  game: "gloomhaven-2e",
  name: "Wildfury",
  codeName: "Two Mini",
  iconRef: "two-mini",
  rulesVariant: "fh",
  startingDeck: "base",
  perks: [
    replace("p01", 3, 1, card(-1), 1, card(0, true, "heal"), "Replace one -1 card with one rolling +0 Heal 2 (Bear) card"),
    replace("p02", 3, 1, card(0), 1, card(1, false, "wound"), "Replace one +0 card with one +1 Wound card"),
    replace("p03", 2, 1, card(0), 1, card(2, false, "custom"), "Replace one +0 card with one +2 ★ card"),
    replace("p04", 1, 1, card(2), 1, card(4), "Replace one +2 card with one +4 card"),
    add("p05", 2, 2, card(1, false, "air", "earth"), "Add two +1 AIR/EARTH (half-element) cards"),
    add("p06", 2, 1, card(2, false, "push"), "Add one +2 Push 2 card"),
    add("p07", 1, 1, card(1, false, "safeguard"), "Ignore scenario effects: add one +1 Safeguard (ally) card"),
    note("p08", 1, "★ Wildfury scenario perk"),
    note("p09", 1, "★ Wildfury scenario perk"),
    note("p10", 2, "★ Wildfury scenario perk (combined)"),
  ],
};
