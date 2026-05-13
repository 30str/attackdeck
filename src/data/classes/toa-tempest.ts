import type { ClassDef } from "../types";
import { add, card, note, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/toa/character/lightning-ball.json
// Custom-perk text resolved against data.custom.toa.lightning-ball.X.

export const toaTempest: ClassDef = {
  id: "toa-tempest",
  game: "trail-of-ashes",
  name: "Tempest",
  codeName: "Lightning Ball",
  iconRef: "lightning-ball",
  rulesVariant: "fh",
  startingDeck: "base",
  perks: [
    replace("p01", 1, 1, card(-2), 1, card(-1, false, "light", "air"), "Replace one -2 card with one -1 LIGHT/AIR (half-element) card"),
    replace("p02", 1, 1, card(-1, false, "light", "air"), 1, card(1, false, "light", "air"), "Replace one -1 LIGHT/AIR card with one +1 LIGHT/AIR (half-element) card"),
    replace("p03", 2, 1, card(-1), 1, card(0, false, "wound"), "Replace one -1 card with one +0 Wound card"),
    replace("p04", 2, 1, card(-1), 1, card(0, true, "regenerate"), "Replace one -1 card with one rolling Regenerate (range 1) card"),
    replace("p05", 1, 1, card(0), 1, card(2, false, "muddle"), "Replace one +0 card with one +2 Muddle card"),
    replace("p06", 1, 2, card(0), 1, card(1, false, "immobilize"), "Replace two +0 cards with one +1 Immobilize card"),
    add("p07", 2, 1, card(1, false, "dodge"), "Add one +1 Dodge (self) card"),
    add("p08", 1, 1, card(2, false, "light", "air"), "Add one +2 LIGHT/AIR (half-element) card"),
    note("p09", 1, "When you dodge an attack, gain one Spark token"),
    note("p10", 2, "On long rest, you may gain Dodge (combined)"),
    note("p11", 1, "On short rest, you may spend one Spark to make one enemy within Range 2 suffer 1 damage"),
  ],
};
