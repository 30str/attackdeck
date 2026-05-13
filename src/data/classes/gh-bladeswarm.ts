import type { ClassDef } from "../types";
import { add, card, note, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/gh-envx/character/envx.json
// Bladeswarm is the deepest-unlock class in Gloomhaven; GHS keeps her in a
// separate folder for spoiler containment. Code name: "Envelope X".

export const ghBladeswarm: ClassDef = {
  id: "gh-bladeswarm",
  game: "gloomhaven",
  name: "Bladeswarm",
  codeName: "Envelope X",
  iconRef: "envx",
  rulesVariant: "gh",
  startingDeck: "base",
  perks: [
    replace("p01", 1, 1, card(-2), 1, card(0), "Replace one -2 card with one +0 card"),
    replace("p02", 2, 1, card(-1), 1, card(0, false, "wound"), "Replace one -1 card with one +0 Wound card"),
    replace("p03", 2, 1, card(-1), 1, card(0, false, "poison"), "Replace one -1 card with one +0 Poison card"),
    replace("p04", 1, 1, card(0), 1, card(1, false, "air"), "Replace one +0 card with one +1 AIR card"),
    replace("p05", 1, 1, card(0), 1, card(1, false, "earth"), "Replace one +0 card with one +1 EARTH card"),
    replace("p06", 1, 1, card(0), 1, card(1, false, "light"), "Replace one +0 card with one +1 LIGHT card"),
    replace("p07", 1, 1, card(0), 1, card(1, false, "dark"), "Replace one +0 card with one +1 DARK card"),
    add("p08", 2, 1, card(2, false, "muddle"), "Add one +2 Muddle card"),
    add("p09", 2, 2, card(0, true, "heal"), "Add two rolling Heal 1 cards"),
    add("p10", 1, 1, card(1), "Ignore negative item effects: add one +1 card"),
    add("p11", 1, 1, card(1), "Ignore negative scenario effects: add one +1 card"),
  ],
};
