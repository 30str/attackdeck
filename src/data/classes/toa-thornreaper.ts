import type { ClassDef } from "../types";
import { add, card, note, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/toa/character/spiked-ring.json
// Custom-perk text resolved against data.custom.toa.spiked-ring.X.

export const toaThornreaper: ClassDef = {
  id: "toa-thornreaper",
  game: "trail-of-ashes",
  name: "Thornreaper",
  codeName: "Spiked Ring",
  iconRef: "spiked-ring",
  rulesVariant: "fh",
  startingDeck: "base",
  perks: [
    replace("p01", 2, 1, card(-1), 1, card(0, true, "custom"), "Replace one -1 card with one rolling card — +1 if LIGHT is Strong or Waning"),
    replace("p02", 1, 1, card(-2), 1, card(0), "Replace one -2 card with one +0 card"),
    add("p03", 2, 3, card(0, true, "custom"), "Add three rolling cards — +1 if LIGHT is Strong or Waning"),
    add("p04", 1, 2, card(0, true, "light"), "Add two rolling LIGHT cards"),
    add("p05", 1, 3, card(0, true, "earth", "custom"), "Add three rolling EARTH cards (generated only if LIGHT is Strong or Waning)"),
    add("p06", 1, 1, card(0, false, "custom"), "Add one +0 card — creates hazardous terrain in one hex within Range 1"),
    add("p07", 2, 1, card(0, true, "retaliate", "custom"), "Add one rolling Active card — while on hazardous terrain, discard on next attack to gain Retaliate 3"),
    add("p08", 2, 1, card(0, true, "shield", "custom"), "Add one rolling Active card — while on hazardous terrain, discard on next attack to gain Shield 3"),
    add("p09", 1, 1, card(0, true, "custom"), "Ignore negative item effects: add one rolling card (+1 if LIGHT is Strong or Waning)"),
    note("p10", 2, "Gain Shield 1 while occupying hazardous terrain (combined)"),
  ],
};
