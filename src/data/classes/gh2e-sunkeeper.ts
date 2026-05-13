import type { ClassDef } from "../types";
import { add, card, multi, note, remove, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/gh2e/character/sun.json

export const gh2eSunkeeper: ClassDef = {
  id: "gh2e-sunkeeper",
  game: "gloomhaven-2e",
  name: "Sunkeeper",
  codeName: "Sun",
  iconRef: "sun",
  rulesVariant: "fh",
  startingDeck: "base",
  perks: [
    multi(
      "p01",
      2,
      "Replace one -1 card with two +0 LIGHT cards",
      { op: "remove", card: card(-1), count: 1 },
      { op: "add", card: card(0, false, "light"), count: 2 }
    ),
    replace("p02", 3, 1, card(0), 1, card(1, true, "shield"), "Replace one +0 card with one rolling +1 Shield 1 card"),
    replace("p03", 2, 1, card(0), 1, card(2), "Replace one +0 card with one +2 card"),
    add("p04", 2, 2, card(1, false, "heal"), "Add two +1 Heal 1 (range 3) cards"),
    add("p05", 1, 1, card(-1, false, "custom"), "Add one -1 ★ card"),
    add("p06", 1, 1, card(0, true, "stun"), "Add one rolling Stun card"),
    add("p07", 1, 1, card(1), "Ignore scenario effects: add one +1 card"),
    remove("p08", 1, 1, card(-1), "Ignore negative item effects: remove one -1 card"),
    note("p09", 2, "★ Sunkeeper scenario perk (combined)"),
    note("p10", 1, "★ Sunkeeper scenario perk"),
    note("p11", 2, "★ Sunkeeper scenario perk (combined)"),
  ],
};
