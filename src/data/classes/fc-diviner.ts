import type { ClassDef } from "../types";
import { add, card, multi, remove, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/fc/character/diviner.json
// Despite some community discussion, the Diviner uses the standard 20-card
// attack-modifier deck per GHS data (no custom starting deck override).

export const fcDiviner: ClassDef = {
  id: "fc-diviner",
  game: "forgotten-circles",
  name: "Diviner",
  codeName: "Eye",
  iconRef: "diviner",
  rulesVariant: "gh",
  startingDeck: "base",
  perks: [
    remove("p01", 2, 2, card(-1), "Remove two -1 cards"),
    remove("p02", 1, 1, card(-2), "Remove one -2 card"),
    multi(
      "p03",
      2,
      "Replace two +1 cards with one +3 Shield 1 (self) card",
      { op: "remove", card: card(1), count: 2 },
      { op: "add", card: card(3, false, "shield"), count: 1 }
    ),
    replace("p04", 1, 1, card(0), 1, card(1, false, "shield"), "Replace one +0 card with one +1 Shield 1 (ally) card"),
    replace("p05", 1, 1, card(0), 1, card(2, false, "dark"), "Replace one +0 card with one +2 DARK card"),
    replace("p06", 1, 1, card(0), 1, card(2, false, "light"), "Replace one +0 card with one +2 LIGHT card"),
    replace("p07", 1, 1, card(0), 1, card(3, false, "muddle"), "Replace one +0 card with one +3 Muddle card"),
    replace("p08", 1, 1, card(0), 1, card(2, false, "curse"), "Replace one +0 card with one +2 Curse card"),
    replace("p09", 1, 1, card(0), 1, card(2, false, "regenerate"), "Replace one +0 card with one +2 Regenerate (self) card"),
    replace("p10", 1, 1, card(-1), 1, card(1, false, "heal"), "Replace one -1 card with one +1 Heal 2 (ally) card"),
    add("p11", 1, 2, card(0, true, "heal"), "Add two rolling Heal 1 (self) cards"),
    add("p12", 1, 2, card(0, true, "curse"), "Add two rolling Curse cards"),
    add("p13", 1, 2, card(1), "Ignore negative scenario effects: add two +1 cards"),
  ],
};
