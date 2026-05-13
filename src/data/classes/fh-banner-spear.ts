import type { ClassDef } from "../types";
import { add, card, note, remove, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/fh/character/banner-spear.json
// Custom-perk text resolved against data.custom.fh.banner-spear.X.

export const fhBannerSpear: ClassDef = {
  id: "fh-banner-spear",
  game: "frosthaven",
  name: "Banner Spear",
  iconRef: "banner-spear",
  rulesVariant: "fh",
  startingDeck: "base",
  perks: [
    replace("p01", 3, 1, card(-1), 1, card(0, true, "shield"), "Replace one -1 card with one rolling Shield 1 card"),
    replace("p02", 2, 1, card(0), 1, card(1, false, "custom"), "Replace one +0 card with one +1 card — adds +1 attack for each ally adjacent to the target"),
    add("p03", 2, 1, card(1, false, "disarm"), "Add one +1 Disarm card"),
    add("p04", 2, 1, card(2, false, "push"), "Add one +2 Push 1 card"),
    add("p05", 2, 2, card(1, true), "Add two rolling +1 cards"),
    add("p06", 2, 2, card(0, true, "heal"), "Add two rolling Heal 1 (self) cards"),
    remove("p07", 1, 1, card(-1), "Ignore negative item effects: remove one -1 card"),
    note("p08", 1, "At the end of each long rest, grant one ally within Range 3 a Move 2"),
    note("p09", 1, "When you open a door with a move ability, add Move +3"),
    note("p10", 2, "Once per scenario, during your turn, gain Shield 2 for the round (combined)"),
  ],
};
