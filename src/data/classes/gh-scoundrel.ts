import type { ClassDef } from "../types";
import { add, card, note, remove, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/gh/character/scoundrel.json

export const ghScoundrel: ClassDef = {
  id: "gh-scoundrel",
  game: "gloomhaven",
  name: "Scoundrel",
  iconRef: "scoundrel",
  rulesVariant: "gh",
  startingDeck: "base",
  perks: [
    remove("p01", 2, 2, card(-1), "Remove two -1 cards"),
    remove("p02", 1, 4, card(0), "Remove four +0 cards"),
    replace("p03", 1, 1, card(-2), 1, card(0), "Replace one -2 card with one +0 card"),
    replace("p04", 1, 1, card(-1), 1, card(1), "Replace one -1 card with one +1 card"),
    replace("p05", 2, 1, card(0), 1, card(2), "Replace one +0 card with one +2 card"),
    add("p06", 2, 2, card(1, true), "Add two rolling +1 cards"),
    add("p07", 1, 2, card(0, true, "pierce"), "Add two rolling Pierce 3 cards"),
    add("p08", 2, 2, card(0, true, "poison"), "Add two rolling Poison cards"),
    add("p09", 1, 2, card(0, true, "muddle"), "Add two rolling Muddle cards"),
    add("p10", 1, 1, card(0, true, "invisible"), "Add one rolling Invisible (self) card"),
    note("p11", 1, "Ignore negative scenario effects"),
  ],
};
