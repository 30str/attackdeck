import type { ClassDef } from "../types";
import { add, card, note, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/fh/character/snowflake.json
// Custom-perk text resolved against data.custom.fh.snowflake.X.

export const fhSnowdancer: ClassDef = {
  id: "fh-snowdancer",
  game: "frosthaven",
  name: "Snowdancer",
  codeName: "Snowflake",
  iconRef: "snowflake",
  rulesVariant: "fh",
  startingDeck: "base",
  perks: [
    replace("p01", 3, 1, card(-1), 1, card(0, false, "heal"), "Replace one -1 card with one +0 Heal 1 (ally) card"),
    replace("p02", 2, 1, card(-1), 1, card(0, false, "immobilize"), "Replace one -1 card with one +0 Immobilize card"),
    add("p03", 2, 2, card(1, false, "ice", "air"), "Add two +1 ICE/AIR (half-element) cards"),
    replace("p04", 2, 2, card(0), 2, card(0, true, "custom"), "Replace two +0 cards with two rolling cards — if forces target to move, target suffers 1 damage"),
    replace("p05", 2, 1, card(0), 1, card(1, false, "strengthen"), "Replace one +0 card with one +1 Strengthen (ally) card"),
    add("p06", 2, 1, card(0, true, "heal", "ward"), "Add one rolling +0 Heal 1 Ward (ally) card"),
    note("p07", 1, "On long rest, you may generate ICE/AIR (half-element)"),
    note("p08", 2, "On short rest, consume ICE for Regenerate Range 3, or consume AIR for Ward Range 3 (combined)"),
    note("p09", 2, "At start of each scenario, all enemies gain Muddle; when a new room is revealed, all enemies in it gain Muddle (combined)"),
  ],
};
