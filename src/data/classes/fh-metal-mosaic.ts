import type { ClassDef } from "../types";
import { add, card, multi, note, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/fh/character/drill.json
// Custom-perk text resolved against data.custom.fh.drill.X.

export const fhMetalMosaic: ClassDef = {
  id: "fh-metal-mosaic",
  game: "frosthaven",
  name: "Metal Mosaic",
  codeName: "Drill",
  iconRef: "drill",
  rulesVariant: "fh",
  startingDeck: "base",
  perks: [
    replace("p01", 3, 1, card(-1), 1, card(0, false, "custom"), "Replace one -1 card with one +0 card — Pressure Up or Pressure Down"),
    replace("p02", 2, 1, card(-1), 1, card(0, true, "shield"), "Replace one -1 card with one rolling Shield 1 card"),
    replace("p03", 2, 1, card(0), 1, card(0, false, "custom"), "Replace one +0 card with one +0 card — target and adjacent enemies suffer 1 damage"),
    multi(
      "p04",
      2,
      "Replace two +0 cards with one rolling Pierce 3 and one rolling Retaliate 2 card",
      { op: "remove", card: card(0), count: 2 },
      { op: "add", card: card(0, true, "pierce"), count: 1 },
      { op: "add", card: card(0, true, "retaliate"), count: 1 }
    ),
    add("p05", 2, 1, card(1, false, "heal"), "Add one +1 Heal 2 (self) card"),
    add("p06", 1, 1, card(3), "Add one +3 card"),
    add("p07", 1, 2, card(1), "Ignore negative item effects: add two +1 cards"),
    note("p08", 1, "On long rest, you may Pressure Up or Pressure Down"),
    note("p09", 1, "When you would gain Poison, you may suffer 1 damage to prevent it"),
    note("p10", 3, "Once per scenario, when you would be exhausted: instead gain Stun + Invisible, lose all cards, Recover 4 lost cards, then discard the recovered cards (combined)"),
  ],
};
