import type { ClassDef } from "../types";
import { add, card, multi, note, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/fh/character/astral.json
// Custom-perk text resolved against data.custom.fh.astral.X.

export const fhInfuser: ClassDef = {
  id: "fh-infuser",
  game: "frosthaven",
  name: "Infuser",
  codeName: "Astral",
  iconRef: "astral",
  rulesVariant: "fh",
  startingDeck: "base",
  perks: [
    multi(
      "p01",
      1,
      "Replace one -2 and one -1 card with one -1 AIR/DARK/EARTH card",
      { op: "remove", card: card(-2), count: 1 },
      { op: "remove", card: card(-1), count: 1 },
      { op: "add", card: card(-1, false, "air", "dark", "earth"), count: 1 }
    ),
    replace("p02", 2, 1, card(-1), 1, card(0, false, "air", "earth"), "Replace one -1 card with one +0 AIR/EARTH (half-element) card"),
    replace("p03", 2, 1, card(-1), 1, card(0, false, "air", "dark"), "Replace one -1 card with one +0 AIR/DARK (half-element) card"),
    replace("p04", 2, 1, card(-1), 1, card(0, false, "earth", "dark"), "Replace one -1 card with one +0 EARTH/DARK (half-element) card"),
    replace("p05", 2, 1, card(0), 1, card(2), "Replace one +0 card with one +2 card"),
    multi(
      "p06",
      2,
      "Replace one +0 card with three rolling cards — each moves a waning element to strong",
      { op: "remove", card: card(0), count: 1 },
      { op: "add", card: card(0, true, "custom"), count: 3 }
    ),
    add("p07", 2, 2, card(0, true, "custom"), "Add two rolling cards — each adds +1 for each pair of active Infusion bonuses"),
    note("p08", 1, "Ignore scenario effects"),
    note("p09", 2, "Ignore negative item effects + on becoming exhausted, keep all active bonuses in play; your summons act on initiative 99 each round (combined)"),
    note("p10", 1, "On short rest, you may consume WILD element to Recover one spent one-hand or two-hand item"),
    note("p11", 1, "Once per scenario, during initiative ordering after all ability cards revealed, generate WILD element"),
  ],
};
