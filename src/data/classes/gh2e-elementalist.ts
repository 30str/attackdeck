import type { ClassDef } from "../types";
import { add, card, note, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/gh2e/character/triangles.json

export const gh2eElementalist: ClassDef = {
  id: "gh2e-elementalist",
  game: "gloomhaven-2e",
  name: "Elementalist",
  codeName: "Triangles",
  iconRef: "triangles",
  rulesVariant: "fh",
  startingDeck: "base",
  perks: [
    replace("p01", 1, 1, card(-1), 1, card(0, false, "fire", "air"), "Replace one -1 card with one +0 FIRE/AIR (half-element) card"),
    replace("p02", 1, 1, card(-1), 1, card(0, false, "fire", "earth"), "Replace one -1 card with one +0 FIRE/EARTH (half-element) card"),
    replace("p03", 1, 1, card(-1), 1, card(0, false, "ice", "air"), "Replace one -1 card with one +0 ICE/AIR (half-element) card"),
    replace("p04", 1, 1, card(-1), 1, card(0, false, "ice", "earth"), "Replace one -1 card with one +0 ICE/EARTH (half-element) card"),
    replace("p05", 2, 1, card(0), 1, card(1, false, "fire", "ice"), "Replace one +0 card with one +1 FIRE/ICE (half-element) card"),
    replace("p06", 2, 1, card(0), 1, card(1, false, "air", "earth"), "Replace one +0 card with one +1 AIR/EARTH (half-element) card"),
    replace("p07", 2, 1, card(0), 1, card(1, false, "light", "dark"), "Replace one +0 card with one +1 LIGHT/DARK (half-element) card"),
    add("p08", 2, 2, card(0, true, "wild"), "Add two rolling WILD-element cards"),
    add("p09", 1, 1, card(0, true, "wild"), "Ignore scenario effects: add one rolling WILD-element card"),
    note("p10", 1, "★ Elementalist scenario perk"),
    note("p11", 1, "★ Elementalist scenario perk"),
    note("p12", 3, "★ Elementalist scenario perk (combined)"),
  ],
};
