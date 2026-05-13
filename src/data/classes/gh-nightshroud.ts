import type { ClassDef } from "../types";
import { add, card, remove, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/gh/character/eclipse.json

export const ghNightshroud: ClassDef = {
  id: "gh-nightshroud",
  game: "gloomhaven",
  name: "Nightshroud",
  codeName: "Eclipse",
  iconRef: "eclipse",
  rulesVariant: "gh",
  startingDeck: "base",
  perks: [
    remove("p01", 2, 2, card(-1), "Remove two -1 cards"),
    remove("p02", 1, 4, card(0), "Remove four +0 cards"),
    add("p03", 2, 1, card(-1, false, "dark"), "Add one -1 DARK card"),
    replace("p04", 2, 1, card(-1, false, "dark"), 1, card(1, false, "dark"), "Replace one -1 DARK card with one +1 DARK card"),
    add("p05", 2, 1, card(1, false, "invisible"), "Add one +1 Invisible (self) card"),
    add("p06", 2, 3, card(0, true, "muddle"), "Add three rolling Muddle cards"),
    add("p07", 1, 2, card(0, true, "heal"), "Add two rolling Heal 1 (self) cards"),
    add("p08", 1, 2, card(0, true, "curse"), "Add two rolling Curse cards"),
    add("p09", 1, 1, card(0, true, "target"), "Add one rolling Target card"),
    add("p10", 1, 2, card(1), "Ignore negative scenario effects: add two +1 cards"),
  ],
};
