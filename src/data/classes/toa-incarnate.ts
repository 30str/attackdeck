import type { ClassDef } from "../types";
import { add, card, note, remove, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/toa/character/three-eyes.json
// Custom-perk text resolved against data.custom.toa.three-eyes.X.
// Incarnate references class-specific token mechanics (Reaver / Ritualist /
// Conqueror) and the enfeeble/rupture/empower conditions. The perk
// descriptions below summarise the rules; see the printed material for the
// full token-token-token effect on perk 1.

export const toaIncarnate: ClassDef = {
  id: "toa-incarnate",
  game: "trail-of-ashes",
  name: "Incarnate",
  codeName: "Three Eyes",
  iconRef: "three-eyes",
  rulesVariant: "fh",
  startingDeck: "base",
  perks: [
    replace("p01", 1, 1, card(-2), 1, card(0, true, "custom"), "Replace one -2 card with one rolling card — apply Reaver / Ritualist / Conqueror token effects"),
    replace("p02", 1, 1, card(-1), 1, card(0, true, "pierce", "fire"), "Replace one -1 card with one rolling +0 Pierce 2 FIRE card"),
    replace("p03", 1, 1, card(-1), 1, card(0, true, "shield", "earth"), "Replace one -1 card with one rolling +0 Shield 1 (self) EARTH card"),
    replace("p04", 1, 1, card(-1), 1, card(0, true, "push", "air"), "Replace one -1 card with one rolling +0 Push 1 AIR card"),
    replace("p05", 2, 1, card(0), 1, card(1, false, "custom"), "Replace one +0 card with one +1 card — Ritualist: Enfeeble (self) / Conqueror: Empower (self)"),
    replace("p06", 2, 1, card(0), 1, card(1, false, "custom"), "Replace one +0 card with one +1 card — Reaver: Rupture (self) / Conqueror: Empower (self)"),
    replace("p07", 2, 1, card(0), 1, card(1, false, "custom"), "Replace one +0 card with one +1 card — Reaver: Rupture / Ritualist: Enfeeble"),
    add("p08", 1, 1, card(0, true, "refresh-item"), "Add one rolling +0 Refresh one-hand or two-hand item card"),
    note("p09", 1, "On long rest, perform Reaver / Ritualist / Conqueror token effects"),
    note("p10", 1, "You may bring one additional one-hand item into each scenario"),
    note("p11", 1, "On short rest, Refresh one spent one-hand item"),
    remove("p12", 1, 1, card(-1), "Ignore negative item effects: remove one -1 card"),
  ],
};
