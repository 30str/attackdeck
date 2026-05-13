import type { ClassDef } from "../types";
import { add, card, multi, note, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/fh/character/boneshaper.json
// Custom-perk text resolved against data.custom.fh.boneshaper.X.

export const fhBoneshaper: ClassDef = {
  id: "fh-boneshaper",
  game: "frosthaven",
  name: "Boneshaper",
  iconRef: "boneshaper",
  rulesVariant: "fh",
  startingDeck: "base",
  perks: [
    replace("p01", 2, 1, card(-1), 1, card(0, false, "curse"), "Replace one -1 card with one +0 Curse card"),
    replace("p02", 2, 1, card(-1), 1, card(0, false, "poison"), "Replace one -1 card with one +0 Poison card"),
    replace("p03", 1, 1, card(-2), 1, card(0), "Replace one -2 card with one +0 card"),
    replace("p04", 3, 1, card(0), 1, card(1, false, "custom"), "Replace one +0 card with one +1 card — kill the attacking summon to add +4 instead"),
    add("p05", 2, 3, card(0, true, "heal"), "Add three rolling Heal 1 cards (target an ally or summon)"),
    multi(
      "p06",
      3,
      "Add one +2 EARTH-or-DARK card",
      { op: "add", card: card(2, false, "earth", "dark"), count: 1 }
    ),
    add("p07", 1, 2, card(1), "Ignore scenario effects: add two +1 cards"),
    note("p08", 1, "Immediately before each rest, you may kill one of your summons to give Bless to self"),
    note("p09", 1, "Once per scenario, when any character ally would be exhausted by suffering damage, you may suffer 2 damage to reduce their HP to 1 instead"),
    note("p10", 2, "At start of each scenario, play a level 1 card from your hand to perform the summon action on it (combined)"),
  ],
};
