import type { ClassDef } from "../types";
import { add, card, multi, note, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/gh2e/character/music-note.json

export const gh2eSoothsinger: ClassDef = {
  id: "gh2e-soothsinger",
  game: "gloomhaven-2e",
  name: "Soothsinger",
  codeName: "Music Note",
  iconRef: "music-note",
  rulesVariant: "fh",
  startingDeck: "base",
  perks: [
    replace("p01", 1, 1, card(-2), 1, card(-2, false, "bless"), "Replace one -2 card with one -2 Bless (target 2) card"),
    replace("p02", 3, 1, card(-1), 1, card(0, false, "custom"), "Replace one -1 card with one +0 ★ card"),
    replace("p03", 2, 1, card(-1), 1, card(0, false, "stun"), "Replace one -1 card with one +0 Stun card"),
    replace("p04", 2, 2, card(0), 1, card(1, false, "strengthen"), "Replace two +0 cards with one +1 Strengthen (ally) card"),
    multi(
      "p05",
      2,
      "Replace one +0 and one +1 with two +2 cards",
      { op: "remove", card: card(0), count: 1 },
      { op: "remove", card: card(1), count: 1 },
      { op: "add", card: card(2), count: 2 }
    ),
    add("p06", 3, 1, card(0, true, "custom"), "Add one rolling ★ card"),
    add("p07", 1, 3, card(0, true, "curse"), "Add three rolling Curse cards"),
    note("p08", 1, "★ Soothsinger scenario perk"),
    note("p09", 1, "★ Soothsinger scenario perk"),
    note("p10", 2, "★ Soothsinger scenario perk (combined)"),
  ],
};
