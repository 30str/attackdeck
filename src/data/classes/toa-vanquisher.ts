import type { ClassDef } from "../types";
import { add, card, multi, note, remove, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/toa-envv/character/envv.json
// Vanquisher is the deepest-unlock class in Trail of Ashes; GHS keeps her in a
// separate folder for spoiler containment. Code name: "Envelope V".

export const toaVanquisher: ClassDef = {
  id: "toa-vanquisher",
  game: "trail-of-ashes",
  name: "Vanquisher",
  codeName: "Envelope V",
  iconRef: "envv",
  rulesVariant: "fh",
  startingDeck: "base",
  perks: [
    multi(
      "p01",
      1,
      "Replace two -1 cards with one +0 Muddle card",
      { op: "remove", card: card(-1), count: 2 },
      { op: "add", card: card(0, false, "muddle"), count: 1 }
    ),
    multi(
      "p02",
      1,
      "Replace two -1 cards with one -1 Heal 2 (self) card",
      { op: "remove", card: card(-1), count: 2 },
      { op: "add", card: card(-1, false, "heal"), count: 1 }
    ),
    replace("p03", 1, 1, card(-2), 1, card(-1, false, "poison", "wound"), "Replace one -2 card with one -1 Poison + Wound card"),
    replace("p04", 2, 1, card(0), 1, card(1, false, "heal"), "Replace one +0 card with one +1 Heal 1 (self) card"),
    multi(
      "p05",
      1,
      "Replace two +0 cards with one +0 Curse and one +0 Immobilize card",
      { op: "remove", card: card(0), count: 2 },
      { op: "add", card: card(0, false, "curse"), count: 1 },
      { op: "add", card: card(0, false, "immobilize"), count: 1 }
    ),
    replace("p06", 2, 1, card(1), 1, card(2, false, "fire", "air"), "Replace one +1 card with one +2 FIRE/AIR (half-element) card"),
    replace("p07", 1, 1, card(2), 1, card(0, true, "custom"), "Replace one +2 card with one rolling ★ Vanquisher card"),
    multi(
      "p08",
      2,
      "Add one +1 Retaliate 1 (self) card and one rolling Pierce 3 card",
      { op: "add", card: card(1, false, "retaliate"), count: 1 },
      { op: "add", card: card(0, true, "pierce"), count: 1 }
    ),
    add("p09", 1, 1, card(0, false, "bless"), "Add one +0 Bless (self) card"),
    add("p10", 1, 2, card(1, false, "custom"), "Add two +1 ★ cards — +2 instead under a class-specific condition"),
    add("p11", 1, 1, card(2, false, "custom"), "Add one +2 ★ card — +3 instead under a class-specific condition"),
    remove("p12", 1, 1, card(-1), "Ignore negative scenario effects: remove one -1 card"),
  ],
};
