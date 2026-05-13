import type { ClassDef } from "../types";
import { add, card, multi, note, remove, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/gh2e/character/three-spears.json

export const gh2eQuartermaster: ClassDef = {
  id: "gh2e-quartermaster",
  game: "gloomhaven-2e",
  name: "Quartermaster",
  codeName: "Three Spears",
  iconRef: "three-spears",
  rulesVariant: "fh",
  startingDeck: "base",
  perks: [
    multi(
      "p01",
      2,
      "Replace two -1 cards with one +0 Muddle card",
      { op: "remove", card: card(-1), count: 2 },
      { op: "add", card: card(0, false, "muddle"), count: 1 }
    ),
    replace("p02", 3, 1, card(0), 1, card(0, false, "custom"), "Replace one +0 card with one +0 ★ card"),
    replace("p03", 1, 2, card(0), 2, card(0, true, "pierce"), "Replace two +0 cards with two rolling Pierce 3 cards"),
    replace("p04", 2, 1, card(1), 2, card(0, false, "custom"), "Replace one +1 card with two +0 ★ cards"),
    replace("p05", 1, 2, card(1), 2, card(2), "Replace two +1 cards with two +2 cards"),
    add("p06", 2, 1, card(0, true, "custom"), "Add one rolling ★ card"),
    add("p07", 2, 1, card(0, true, "stun"), "Add one rolling Stun card"),
    remove("p08", 1, 1, card(0), "Ignore negative item effects: remove one +0 card"),
    note("p09", 1, "★ Quartermaster scenario perk"),
    note("p10", 1, "★ Quartermaster scenario perk"),
    note("p11", 2, "★ Quartermaster scenario perk (combined)"),
  ],
};
