import type { ClassDef } from "../types";
import { add, card, note, remove, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/gh2e/character/eclipse.json
// Note: GH2E Nightshroud has a "replace miss with -2 (still triggers shuffle)"
// perk. The engine doesn't currently model a -2 card that triggers a shuffle,
// so it's represented as a regular -2 with the shuffle behaviour called out in
// the description — apply manually until the engine grows a triggersShuffle
// flag.

export const gh2eNightshroud: ClassDef = {
  id: "gh2e-nightshroud",
  game: "gloomhaven-2e",
  name: "Nightshroud",
  codeName: "Eclipse",
  iconRef: "eclipse",
  rulesVariant: "fh",
  startingDeck: "base",
  perks: [
    remove("p01", 1, 1, card(-2), "Remove one -2 card"),
    remove("p02", 2, 2, card(-1), "Remove two -1 cards"),
    replace("p03", 1, 1, card(-1), 2, card(0, true, "custom"), "Replace one -1 card with two rolling ★ Tear cards"),
    replace("p04", 1, 1, card("miss"), 1, card(-2, false, "custom"), "Replace one Miss with one -2 ★ (still triggers shuffle)"),
    replace("p05", 2, 2, card(0), 2, card(1, false, "custom"), "Replace two +0 cards with two +1 ★ cards"),
    replace("p06", 2, 1, card(0), 1, card(2, false, "dark"), "Replace one +0 card with one +2 DARK card"),
    replace("p07", 2, 1, card(1), 1, card(0, false, "custom"), "Replace one +1 card with one +0 ★ card"),
    add("p08", 1, 2, card(1), "Ignore scenario effects: add two +1 cards"),
    note("p09", 1, "★ Nightshroud scenario perk"),
    note("p10", 2, "★ Nightshroud scenario perk (combined)"),
    note("p11", 3, "★ Nightshroud scenario perk (combined)"),
  ],
};
