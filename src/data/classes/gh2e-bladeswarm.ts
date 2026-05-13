import type { ClassDef } from "../types";
import { add, card, note, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/gh2e/character/crossed-swords.json
// Bladeswarm was GH1's hidden Envelope X class; in GH2E she's a regular
// unlockable under the "Crossed Swords" icon.

export const gh2eBladeswarm: ClassDef = {
  id: "gh2e-bladeswarm",
  game: "gloomhaven-2e",
  name: "Bladeswarm",
  codeName: "Crossed Swords",
  iconRef: "crossed-swords",
  rulesVariant: "fh",
  startingDeck: "base",
  perks: [
    replace("p01", 2, 1, card(-1), 1, card(0, false, "wound"), "Replace one -1 card with one +0 Wound card"),
    replace("p02", 2, 1, card(-1), 1, card(0, false, "poison"), "Replace one -1 card with one +0 Poison card"),
    replace("p03", 2, 1, card(0), 1, card(1, false, "air", "dark"), "Replace one +0 card with one +1 AIR/DARK (half-element) card"),
    replace("p04", 2, 1, card(0), 1, card(1, false, "earth", "light"), "Replace one +0 card with one +1 EARTH/LIGHT (half-element) card"),
    replace("p05", 2, 1, card(0), 1, card(0, false, "custom"), "Replace one +0 card with one +0 ★ Bladeswarm card"),
    add("p06", 1, 1, card(1), "Ignore scenario effects: add one +1 card"),
    add("p07", 1, 1, card(1), "Ignore negative item effects: add one +1 card"),
    note("p08", 1, "★ Bladeswarm scenario perk"),
    note("p09", 2, "★ Bladeswarm scenario perk (combined)"),
    note("p10", 3, "★ Bladeswarm scenario perk (combined)"),
  ],
};
