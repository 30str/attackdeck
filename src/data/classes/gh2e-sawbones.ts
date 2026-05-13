import type { ClassDef } from "../types";
import { add, card, multi, note, remove, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/gh2e/character/saw.json

export const gh2eSawbones: ClassDef = {
  id: "gh2e-sawbones",
  game: "gloomhaven-2e",
  name: "Sawbones",
  codeName: "Saw",
  iconRef: "saw",
  rulesVariant: "fh",
  startingDeck: "base",
  perks: [
    remove("p01", 1, 2, card(-1), "Remove two -1 cards"),
    replace("p02", 1, 1, card(-2), 1, card(-2, false, "custom"), "Replace one -2 card with one -2 ★ card"),
    replace("p03", 3, 1, card(-1), 1, card(1), "Replace one -1 card with one +1 card"),
    multi(
      "p04",
      2,
      "Replace two +0 cards with one +1 ★ card",
      { op: "remove", card: card(0), count: 2 },
      { op: "add", card: card(1, false, "custom"), count: 1 }
    ),
    add("p05", 2, 2, card(1, false, "custom"), "Add two +1 ★ cards"),
    add("p06", 2, 1, card(0, true, "heal"), "Add one rolling Heal 3 (range 1) card"),
    note("p07", 2, "★ Sawbones scenario perk (combined)"),
    note("p08", 2, "★ Sawbones scenario perk (combined)"),
    note("p09", 3, "★ Sawbones scenario perk (combined)"),
  ],
};
