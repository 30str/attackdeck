import type { ClassDef } from "../types";
import { add, card, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/gh/character/squidface.json

export const ghPlagueherald: ClassDef = {
  id: "gh-plagueherald",
  game: "gloomhaven",
  name: "Plagueherald",
  codeName: "Squid Face",
  iconRef: "squidface",
  rulesVariant: "gh",
  startingDeck: "base",
  perks: [
    replace("p01", 1, 1, card(-2), 1, card(0), "Replace one -2 card with one +0 card"),
    replace("p02", 2, 1, card(-1), 1, card(1), "Replace one -1 card with one +1 card"),
    replace("p03", 2, 1, card(0), 1, card(2), "Replace one +0 card with one +2 card"),
    add("p04", 1, 2, card(1), "Add two +1 cards"),
    add("p05", 3, 1, card(1, false, "air"), "Add one +1 AIR card"),
    add("p06", 1, 3, card(0, true, "poison"), "Add three rolling Poison cards"),
    add("p07", 1, 2, card(0, true, "curse"), "Add two rolling Curse cards"),
    add("p08", 1, 2, card(0, true, "immobilize"), "Add two rolling Immobilize cards"),
    add("p09", 2, 1, card(0, true, "stun"), "Add one rolling Stun card"),
    add("p10", 1, 1, card(1), "Ignore negative scenario effects: add one +1 card"),
  ],
};
