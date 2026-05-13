import { buildBaseDeck } from "../src/data/base-deck";
import { CLASSES } from "../src/data";
import { applyPerks } from "../src/engine/deck";
import type { Card } from "../src/data/types";

type Issue = { class: string; message: string };
const issues: Issue[] = [];

function report(klass: string, message: string) {
  issues.push({ class: klass, message });
}

function isPositiveInt(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= 0;
}

const baseDeck = buildBaseDeck();
if (baseDeck.length !== 20) {
  report("<base>", `Base deck has ${baseDeck.length} cards, expected 20`);
}

const seenIds = new Set<string>();

for (const klass of CLASSES) {
  if (seenIds.has(klass.id)) {
    report(klass.id, `Duplicate class id`);
  }
  seenIds.add(klass.id);

  if (!klass.name) report(klass.id, "Missing name");
  if (!klass.game) report(klass.id, "Missing game");
  if (!klass.rulesVariant) report(klass.id, "Missing rulesVariant");

  const perkIds = new Set<string>();
  let totalPerkCount = 0;
  for (const perk of klass.perks) {
    if (perkIds.has(perk.id)) report(klass.id, `Duplicate perk id ${perk.id}`);
    perkIds.add(perk.id);

    if (!perk.description) report(klass.id, `Perk ${perk.id} missing description`);
    if (!isPositiveInt(perk.count) || perk.count < 1) {
      report(klass.id, `Perk ${perk.id} has invalid count ${perk.count}`);
    } else {
      totalPerkCount += perk.count;
    }

    for (const op of perk.ops) {
      if (op.op !== "add" && op.op !== "remove") {
        report(klass.id, `Perk ${perk.id} has unknown op ${(op as { op: string }).op}`);
        continue;
      }
      if (!isPositiveInt(op.count) || op.count < 1) {
        report(klass.id, `Perk ${perk.id} op has invalid count ${op.count}`);
      }
      if (op.card === undefined || op.card.value === undefined) {
        report(klass.id, `Perk ${perk.id} op missing card.value`);
      }
    }
  }

  const isFan = klass.game === "ccug" || klass.game === "crimson-scales";
  const maxPerks = isFan ? 20 : 18;
  if (totalPerkCount < 10 || totalPerkCount > maxPerks) {
    report(klass.id, `Total perk applications = ${totalPerkCount} (expected 10–${maxPerks})`);
  }

  const baseCards =
    klass.startingDeck === "base" ? buildBaseDeck() : (klass.startingDeck as Card[]);
  const allPerksApplied: Record<string, number> = {};
  for (const perk of klass.perks) allPerksApplied[perk.id] = perk.count;
  try {
    const fully = applyPerks(baseCards, klass.perks, allPerksApplied);
    if (fully.length < 10 || fully.length > 60) {
      report(klass.id, `Fully-perked deck has ${fully.length} cards (sanity check)`);
    }
  } catch (e) {
    report(klass.id, `applyPerks threw: ${(e as Error).message}`);
  }
}

if (issues.length === 0) {
  console.log(`✓ ${CLASSES.length} classes verified. Base deck = ${baseDeck.length} cards.`);
  process.exit(0);
} else {
  console.error(`✗ Found ${issues.length} issue(s):`);
  for (const i of issues) console.error(`  [${i.class}] ${i.message}`);
  process.exit(1);
}
