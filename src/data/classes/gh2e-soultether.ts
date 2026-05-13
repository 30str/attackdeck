import type { ClassDef } from "../types";
import { add, card, note, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/gh2e/character/circles.json
// Was "Summoner" in GH1; renamed to "Soultether" in 2nd Edition.

export const gh2eSoultether: ClassDef = {
  id: "gh2e-soultether",
  game: "gloomhaven-2e",
  name: "Soultether",
  codeName: "Circles",
  iconRef: "circles",
  rulesVariant: "fh",
  startingDeck: "base",
  perks: [
    replace("p01", 1, 1, card(-2), 1, card(0), "Replace one -2 card with one +0 card"),
    replace("p02", 3, 1, card(-1), 1, card(0, false, "custom"), "Replace one -1 card with one +0 ★ card"),
    replace("p03", 3, 1, card(0), 1, card(1, false, "invisible", "custom"), "Replace one +0 card with one +1 Invisible ★ card"),
    replace("p04", 1, 1, card(0), 2, card(0, true, "wound"), "Replace one +0 card with two rolling Wound cards"),
    replace("p05", 1, 1, card(0), 2, card(0, true, "poison"), "Replace one +0 card with two rolling Poison cards"),
    replace("p06", 1, 2, card(1), 2, card(1, false, "curse"), "Replace two +1 cards with two +1 Curse cards"),
    add("p07", 1, 1, card(2, false, "fire", "air"), "Add one +2 FIRE/AIR (half-element) card"),
    add("p08", 1, 1, card(2, false, "fire", "dark"), "Add one +2 FIRE/DARK (half-element) card"),
    add("p09", 1, 1, card(2, false, "air", "dark"), "Add one +2 AIR/DARK (half-element) card"),
    add("p10", 1, 2, card(1), "Ignore scenario effects: add two +1 cards"),
    note("p11", 1, "★ Soultether scenario perk"),
    note("p12", 1, "★ Soultether scenario perk"),
    note("p13", 2, "★ Soultether scenario perk (combined)"),
  ],
};
