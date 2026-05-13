import type { ClassDef } from "../types";
import { add, card, note, remove, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/fh/character/shards.json
// Custom-perk text resolved against data.custom.fh.shards.X.

export const fhShattersong: ClassDef = {
  id: "fh-shattersong",
  game: "frosthaven",
  name: "Shattersong",
  codeName: "Shards",
  iconRef: "shards",
  rulesVariant: "fh",
  startingDeck: "base",
  perks: [
    remove("p01", 1, 4, card(0), "Remove four +0 cards"),
    replace("p02", 2, 2, card(-1), 2, card(0, false, "custom"), "Replace two -1 cards with two +0 cards — each reveals the top of the target's monster ability deck"),
    replace("p03", 1, 1, card(-2), 1, card(-1, false, "stun"), "Replace one -2 card with one -1 Stun card"),
    replace("p04", 2, 1, card(0), 1, card(0, false, "brittle"), "Replace one +0 card with one +0 Brittle card"),
    replace("p05", 2, 2, card(1), 2, card(2, false, "air", "light"), "Replace two +1 cards with two +2 AIR/LIGHT (half-element) cards"),
    add("p06", 2, 1, card(0, true, "heal", "bless"), "Add one rolling Heal 2 + Bless (ally) card"),
    add("p07", 3, 1, card(1, false, "custom"), "Add one +1 card — gain 1 Resonance when drawn"),
    note("p08", 1, "Ignore scenario effects"),
    note("p09", 2, "On short rest, consume AIR to give Strengthen Range 3, or consume LIGHT to give Bless Range 3 (combined)"),
    note("p10", 1, "At start of each scenario, you may gain Brittle to gain 2 Resonance"),
    note("p11", 1, "When a new room is revealed, you may reveal the top of the monster attack modifier deck and all allies' attack modifier decks"),
  ],
};
