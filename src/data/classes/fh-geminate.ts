import type { ClassDef } from "../types";
import { add, card, note, replace } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/fh/character/geminate.json
// Custom-perk text resolved against data.custom.fh.geminate.X.
// "double" GHS type → x2 card. WILD element rendered as ★.

export const fhGeminate: ClassDef = {
  id: "fh-geminate",
  game: "frosthaven",
  name: "Geminate",
  iconRef: "geminate",
  rulesVariant: "fh",
  startingDeck: "base",
  perks: [
    replace("p01", 1, 1, card(-2), 1, card(0), "Replace one -2 card with one +0 card"),
    replace("p02", 3, 1, card(-1), 1, card(0, false, "custom"), "Replace one -1 card with one +0 card — consume WILD element to generate WILD element"),
    replace("p03", 2, 1, card(0), 1, card(1, false, "poison"), "Replace one +0 card with one +1 Poison card"),
    replace("p04", 2, 1, card(0), 1, card(1, false, "wound"), "Replace one +0 card with one +1 Wound card"),
    replace("p05", 1, 2, card(0), 2, card(0, true, "pierce"), "Replace two +0 cards with two rolling Pierce 3 cards"),
    add("p06", 1, 2, card(1, false, "push"), "Add two +1 Push 3 cards"),
    add("p07", 1, 1, card("x2", false, "brittle"), "Add one ×2 Brittle (self) card"),
    add("p08", 2, 1, card(1, true, "regenerate"), "Add one rolling +1 Regenerate (self) card"),
    note("p09", 1, "Ignore scenario effects"),
    note("p10", 1, "On short rest, you may remove one negative condition from one ally within Range 3"),
    note("p11", 1, "Once per scenario, when you would give yourself a negative condition, prevent it"),
    note("p12", 2, "When you perform an action with a Lost icon, you may discard one card to Recover one card from your discard of equal or lower level (combined)"),
  ],
};
