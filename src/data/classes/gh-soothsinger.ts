import type { ClassDef } from "../types";
import { add, card, multi, remove, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/gh/character/music-note.json

export const ghSoothsinger: ClassDef = {
  id: "gh-soothsinger",
  game: "gloomhaven",
  name: "Soothsinger",
  codeName: "Music Note",
  iconRef: "music-note",
  rulesVariant: "gh",
  startingDeck: "base",
  perks: [
    remove("p01", 2, 2, card(-1), "Remove two -1 cards"),
    remove("p02", 1, 1, card(-2), "Remove one -2 card"),
    multi(
      "p03",
      2,
      "Replace two +1 cards with one +4 card",
      { op: "remove", card: card(1), count: 2 },
      { op: "add", card: card(4), count: 1 }
    ),
    replace("p04", 1, 1, card(0), 1, card(1, false, "immobilize"), "Replace one +0 card with one +1 Immobilize card"),
    replace("p05", 1, 1, card(0), 1, card(1, false, "disarm"), "Replace one +0 card with one +1 Disarm card"),
    replace("p06", 1, 1, card(0), 1, card(2, false, "wound"), "Replace one +0 card with one +2 Wound card"),
    replace("p07", 1, 1, card(0), 1, card(2, false, "poison"), "Replace one +0 card with one +2 Poison card"),
    replace("p08", 1, 1, card(0), 1, card(2, false, "curse"), "Replace one +0 card with one +2 Curse card"),
    replace("p09", 1, 1, card(0), 1, card(3, false, "muddle"), "Replace one +0 card with one +3 Muddle card"),
    replace("p10", 1, 1, card(-1), 1, card(0, false, "stun"), "Replace one -1 card with one +0 Stun card"),
    add("p11", 1, 3, card(1, true), "Add three rolling +1 cards"),
    add("p12", 2, 2, card(0, true, "curse"), "Add two rolling Curse cards"),
  ],
};
