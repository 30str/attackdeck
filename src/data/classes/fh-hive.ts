import type { ClassDef } from "../types";
import { add, card, multi, note, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/fh/character/prism.json
// Custom-perk text resolved against data.custom.fh.prism.X.

export const fhHive: ClassDef = {
  id: "fh-hive",
  game: "frosthaven",
  name: "HIVE",
  codeName: "Prism",
  iconRef: "prism",
  rulesVariant: "fh",
  startingDeck: "base",
  perks: [
    multi(
      "p01",
      1,
      "Remove one -2 and one +1 card",
      { op: "remove", card: card(-2), count: 1 },
      { op: "remove", card: card(1), count: 1 }
    ),
    replace("p02", 3, 1, card(-1), 1, card(0, false, "custom"), "Replace one -1 card with one +0 card — after this attack, grant a summon a Move 2 card"),
    replace("p03", 3, 1, card(0), 1, card(1, false, "custom"), "Replace one +0 card with one +1 card — after this attack, change HIVE mode"),
    add("p04", 3, 1, card(1, false, "heal"), "Add one +1 Heal 1 (self) card"),
    add("p05", 2, 1, card(2, false, "muddle"), "Add one +2 Muddle card"),
    add("p06", 1, 2, card(0, true, "poison"), "Add two rolling Poison cards"),
    add("p07", 1, 2, card(0, true, "wound"), "Add two rolling Wound cards"),
    note("p08", 2, "Long rest on any initiative (chosen after card reveal); decide how summons act this round (combined)"),
    note("p09", 1, "At the end of each short rest, you may change HIVE mode"),
    note("p10", 1, "Whenever you would gain Wound, prevent it"),
  ],
};
