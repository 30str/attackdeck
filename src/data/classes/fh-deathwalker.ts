import type { ClassDef } from "../types";
import { add, card, multi, note, remove, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/fh/character/deathwalker.json
// Custom-perk text resolved against data.custom.fh.deathwalker.X.

export const fhDeathwalker: ClassDef = {
  id: "fh-deathwalker",
  game: "frosthaven",
  name: "Deathwalker",
  iconRef: "deathwalker",
  rulesVariant: "fh",
  startingDeck: "base",
  perks: [
    remove("p01", 1, 2, card(-1), "Remove two -1 cards"),
    replace("p02", 1, 1, card(-2), 1, card(0), "Replace one -2 card with one +0 card"),
    replace("p03", 3, 1, card(-1), 1, card(1), "Replace one -1 card with one +1 card"),
    replace("p04", 3, 1, card(0), 1, card(1, false, "curse"), "Replace one +0 card with one +1 Curse card"),
    add("p05", 2, 1, card(2, false, "dark"), "Add one +2 DARK card"),
    multi(
      "p06",
      2,
      "Add one rolling Disarm and one rolling Muddle card",
      { op: "add", card: card(0, true, "disarm"), count: 1 },
      { op: "add", card: card(0, true, "muddle"), count: 1 }
    ),
    add("p07", 2, 2, card(0, true, "heal"), "Add two rolling Heal 1 (ally) cards"),
    note("p08", 1, "Ignore scenario effects"),
    note("p09", 1, "On long rest, you may move one Shadow up to 3 hexes"),
    note("p10", 1, "On short rest, consume DARK to give Muddle + Curse Range 2 (as if you occupied a Shadow hex)"),
    note("p11", 1, "While you occupy a Shadow hex, all attacks targeting you have disadvantage"),
  ],
};
