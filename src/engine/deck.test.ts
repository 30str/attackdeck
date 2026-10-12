import { describe, it, expect } from "vitest";
import { buildBaseDeck } from "../data/base-deck";
import {
  makeDeck,
  draw,
  drawAdvantage,
  reshuffle,
  reshuffleAll,
  reshuffleDrawPile,
  undo,
  applyPerks,
  addBless,
  addCurse,
  removeBless,
  removeCurse,
  countBless,
  countCurse,
  countCards,
  addTempCard,
  removeTempCard,
  countTemp,
  resetDeck,
  type ShuffleFn,
} from "./deck";
import type { Card, Perk } from "../data/types";

const identityShuffle: ShuffleFn = (arr) => arr.slice();

function cardsByValue(cards: readonly Card[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const c of cards) {
    const key = String(c.value);
    out[key] = (out[key] ?? 0) + 1;
  }
  return out;
}

describe("base deck composition", () => {
  it("has exactly 20 cards in the canonical distribution", () => {
    const deck = buildBaseDeck();
    expect(deck).toHaveLength(20);
    expect(cardsByValue(deck)).toEqual({
      "0": 6,
      "1": 5,
      "-1": 5,
      "2": 1,
      "-2": 1,
      x2: 1,
      miss: 1,
    });
  });
});

describe("draw", () => {
  it("returns the top card of the draw pile as a single sequence", () => {
    const cards = buildBaseDeck();
    const state = makeDeck(cards, identityShuffle);
    const after = draw(state, identityShuffle);
    expect(after.active).toHaveLength(1);
    expect(after.active[0]).toHaveLength(1);
    expect(after.active[0]![0]).toEqual(cards[0]);
    expect(after.drawPile).toHaveLength(19);
    expect(after.discardPile).toHaveLength(1);
  });

  it("flags needsShuffle after drawing miss", () => {
    const missFirst = [
      { id: "m", value: "miss" as const, rolling: false, effects: [] },
      ...buildBaseDeck().filter((c) => c.value !== "miss"),
    ];
    const state = makeDeck(missFirst, identityShuffle);
    const after = draw(state, identityShuffle);
    expect(after.active[0]![0]!.value).toBe("miss");
    expect(after.needsShuffle).toBe(true);
  });

  it("flags needsShuffle after drawing x2", () => {
    const x2First = [
      { id: "x", value: "x2" as const, rolling: false, effects: [] },
      ...buildBaseDeck().filter((c) => c.value !== "x2"),
    ];
    const state = makeDeck(x2First, identityShuffle);
    const after = draw(state, identityShuffle);
    expect(after.active[0]![0]!.value).toBe("x2");
    expect(after.needsShuffle).toBe(true);
  });

  it("reshuffles before drawing if needsShuffle is set", () => {
    const x2First = [
      { id: "x", value: "x2" as const, rolling: false, effects: [] },
      ...buildBaseDeck().filter((c) => c.value !== "x2"),
    ];
    const state = makeDeck(x2First, identityShuffle);
    const afterX2 = draw(state, identityShuffle);
    expect(afterX2.needsShuffle).toBe(true);
    const afterNext = draw(afterX2, identityShuffle);
    expect(afterNext.needsShuffle).toBe(false);
    expect(countCards(afterNext)).toBe(20);
  });
});

describe("rolling modifiers", () => {
  it("accumulates rolling cards and stops on a non-rolling card", () => {
    const rolling = (val: number): Card => ({
      id: `r${val}`,
      value: val,
      rolling: true,
      effects: ["fire"],
    });
    const final: Card = { id: "f", value: 1, rolling: false, effects: [] };
    const filler = buildBaseDeck();
    const cards = [rolling(0), rolling(1), final, ...filler];
    const state = makeDeck(cards, identityShuffle);
    const after = draw(state, identityShuffle);
    expect(after.active).toHaveLength(1);
    expect(after.active[0]).toHaveLength(3);
    expect(after.active[0]!.map((c) => c.rolling)).toEqual([true, true, false]);
  });
});

describe("drawAdvantage", () => {
  it("draws two sequences as one atomic operation", () => {
    const cards = buildBaseDeck();
    const state = makeDeck(cards, identityShuffle);
    const after = drawAdvantage(state, identityShuffle);
    expect(after.active).toHaveLength(2);
    expect(after.active[0]).toHaveLength(1);
    expect(after.active[1]).toHaveLength(1);
    expect(after.drawPile).toHaveLength(18);
    expect(after.discardPile).toHaveLength(2);
  });

  it("undo reverts both draws of advantage in one step", () => {
    const cards = buildBaseDeck();
    const state = makeDeck(cards, identityShuffle);
    const after = drawAdvantage(state, identityShuffle);
    const undone = undo(after);
    expect(undone.drawPile).toHaveLength(20);
    expect(undone.discardPile).toHaveLength(0);
    expect(undone.active).toEqual([]);
  });

  it("handles rolling sequences within advantage draws", () => {
    const rolling: Card = { id: "r", value: 0, rolling: true, effects: ["fire"] };
    const final: Card = { id: "f", value: 2, rolling: false, effects: [] };
    const next: Card = { id: "n", value: 1, rolling: false, effects: [] };
    const filler = buildBaseDeck();
    const cards = [rolling, final, next, ...filler];
    const state = makeDeck(cards, identityShuffle);
    const after = drawAdvantage(state, identityShuffle);
    expect(after.active[0]).toHaveLength(2);
    expect(after.active[1]).toHaveLength(1);
    expect(after.active[1]![0]).toEqual(next);
  });

  it("flags needsShuffle if either draw hits miss or x2", () => {
    const x2First = [
      { id: "x", value: "x2" as const, rolling: false, effects: [] },
      ...buildBaseDeck().filter((c) => c.value !== "x2"),
    ];
    const state = makeDeck(x2First, identityShuffle);
    const after = drawAdvantage(state, identityShuffle);
    expect(after.needsShuffle).toBe(true);
  });
});

describe("applyPerks", () => {
  const removeMinusOne: Perk = {
    id: "p1",
    description: "Remove two -1 cards",
    count: 1,
    ops: [{ op: "remove", card: { value: -1 }, count: 2 }],
  };
  const addPlusOnes: Perk = {
    id: "p2",
    description: "Add one +1 and one +1",
    count: 2,
    ops: [{ op: "add", card: { value: 1 }, count: 1 }],
  };

  it("returns the base deck untouched when no perks applied", () => {
    const deck = applyPerks(buildBaseDeck(), [removeMinusOne, addPlusOnes], {});
    expect(deck).toHaveLength(20);
    expect(cardsByValue(deck)["-1"]).toBe(5);
  });

  it("removes cards according to perk ops", () => {
    const deck = applyPerks(buildBaseDeck(), [removeMinusOne], { p1: 1 });
    expect(deck).toHaveLength(18);
    expect(cardsByValue(deck)["-1"]).toBe(3);
  });

  it("adds cards according to perk ops", () => {
    const deck = applyPerks(buildBaseDeck(), [addPlusOnes], { p2: 2 });
    expect(deck).toHaveLength(22);
    expect(cardsByValue(deck)["1"]).toBe(7);
  });

  it("clamps perk count to perk.count", () => {
    const deck = applyPerks(buildBaseDeck(), [removeMinusOne], { p1: 99 });
    expect(deck).toHaveLength(18);
  });
});

describe("bless and curse", () => {
  it("addBless adds a single removable x2 card", () => {
    const state = makeDeck(buildBaseDeck(), identityShuffle);
    const blessed = addBless(state, identityShuffle);
    expect(countCards(blessed)).toBe(21);
    const blessCard = blessed.drawPile.find((c) => c.effects.includes("bless"));
    expect(blessCard?.value).toBe("x2");
    expect(blessCard?.oneShot).toBe(true);
  });

  it("a drawn bless does not go to discard", () => {
    const blessFirst: Card[] = [
      {
        id: "b",
        value: "x2",
        rolling: false,
        effects: ["bless"],
        oneShot: true,
      },
      ...buildBaseDeck(),
    ];
    const state = makeDeck(blessFirst, identityShuffle);
    const after = draw(state, identityShuffle);
    expect(after.active[0]![0]!.effects).toContain("bless");
    expect(after.discardPile.find((c) => c.effects.includes("bless"))).toBeUndefined();
    expect(countCards(after)).toBe(20);
  });

  it("drawing a bless does not trigger an end-of-round shuffle", () => {
    const base = buildBaseDeck().filter((c) => c.value !== "x2" && c.value !== "miss");
    const blessFirst: Card[] = [
      {
        id: "b",
        value: "x2",
        rolling: false,
        effects: ["bless"],
        oneShot: true,
      },
      ...base,
    ];
    const state = makeDeck(blessFirst, identityShuffle);
    const after = draw(state, identityShuffle);
    expect(after.needsShuffle).toBe(false);
  });

  it("addCurse adds a removable miss card", () => {
    const state = makeDeck(buildBaseDeck(), identityShuffle);
    const cursed = addCurse(state, identityShuffle);
    const curseCard = cursed.drawPile.find((c) => c.effects.includes("curse"));
    expect(curseCard?.value).toBe("miss");
    expect(curseCard?.oneShot).toBe(true);
  });

  it("drawing a curse does not trigger an end-of-round shuffle", () => {
    const base = buildBaseDeck().filter((c) => c.value !== "x2" && c.value !== "miss");
    const curseFirst: Card[] = [
      {
        id: "c",
        value: "miss",
        rolling: false,
        effects: ["curse"],
        oneShot: true,
      },
      ...base,
    ];
    const state = makeDeck(curseFirst, identityShuffle);
    const after = draw(state, identityShuffle);
    expect(after.needsShuffle).toBe(false);
  });
});

describe("recentDraws", () => {
  it("logs drawn cards in order, including one-shots absent from the piles", () => {
    const bless: Card = { id: "b", value: "x2", rolling: false, effects: ["bless"], oneShot: true };
    const state = makeDeck([bless, ...buildBaseDeck()], identityShuffle);
    const d1 = draw(state, identityShuffle);
    const d2 = draw(d1, identityShuffle);
    expect(d2.recentDraws.map((c) => c.id)).toEqual(["b", d2.active[0]![0]!.id]);
    expect(d2.discardPile.find((c) => c.id === "b")).toBeUndefined();
  });

  it("logs a whole rolling sequence and both advantage draws", () => {
    const rolling: Card = { id: "r", value: 1, rolling: true, effects: [] };
    const plain = buildBaseDeck().filter((c) => typeof c.value === "number");
    const state = makeDeck([rolling, ...plain], identityShuffle);
    const d1 = draw(state, identityShuffle); // rolling + next card
    expect(d1.recentDraws).toHaveLength(2);
    const d2 = drawAdvantage(d1, identityShuffle);
    expect(d2.recentDraws).toHaveLength(4);
  });

  it("is cleared by a full reshuffle, kept by a draw-pile shuffle, rewound by undo", () => {
    const state = makeDeck(buildBaseDeck(), identityShuffle);
    const drawn = draw(draw(state, identityShuffle), identityShuffle);
    expect(drawn.recentDraws).toHaveLength(2);
    expect(reshuffleAll(drawn, identityShuffle).recentDraws).toEqual([]);
    expect(reshuffleDrawPile(drawn, identityShuffle).recentDraws).toEqual(drawn.recentDraws);
    const undone = undo(drawn);
    expect(undone.recentDraws).toHaveLength(1);
  });

  it("is capped so persisted state stays bounded", () => {
    let s = makeDeck(buildBaseDeck(), identityShuffle);
    for (let i = 0; i < 15; i++) s = draw(s, identityShuffle);
    expect(s.recentDraws.length).toBeLessThanOrEqual(10);
  });
});

describe("reshuffle", () => {
  it("combines draw and discard piles and clears needsShuffle", () => {
    const state = makeDeck(buildBaseDeck(), identityShuffle);
    const drawn = draw(state, identityShuffle);
    expect(drawn.discardPile).toHaveLength(1);
    const reshuffled = reshuffle({ ...drawn, needsShuffle: true }, identityShuffle);
    expect(reshuffled.drawPile).toHaveLength(20);
    expect(reshuffled.discardPile).toHaveLength(0);
    expect(reshuffled.needsShuffle).toBe(false);
  });

  it("reshuffleAll behaves like reshuffle", () => {
    const state = makeDeck(buildBaseDeck(), identityShuffle);
    const drawn = draw(state, identityShuffle);
    const r = reshuffleAll(drawn, identityShuffle);
    expect(r.drawPile).toHaveLength(20);
    expect(r.discardPile).toHaveLength(0);
    expect(r.needsShuffle).toBe(false);
  });

  it("reshuffleDrawPile leaves the discard pile alone", () => {
    const state = makeDeck(buildBaseDeck(), identityShuffle);
    const d1 = draw(state, identityShuffle);
    const d2 = draw(d1, identityShuffle);
    const d3 = draw(d2, identityShuffle);
    expect(d3.discardPile).toHaveLength(3);
    const r = reshuffleDrawPile(d3, identityShuffle);
    expect(r.drawPile).toHaveLength(17);
    expect(r.discardPile).toHaveLength(3);
    expect(r.needsShuffle).toBe(false);
  });

  it("a full shuffle clears the display; shuffling only the draw pile keeps it", () => {
    const state = makeDeck(buildBaseDeck(), identityShuffle);
    const drawn = draw(state, identityShuffle);
    expect(drawn.active).toHaveLength(1);
    expect(reshuffleAll(drawn, identityShuffle).active).toEqual([]);
    expect(reshuffleDrawPile(drawn, identityShuffle).active).toEqual(drawn.active);
  });
});

describe("undo", () => {
  it("restores the prior state after a single draw", () => {
    const state = makeDeck(buildBaseDeck(), identityShuffle);
    const drawn = draw(state, identityShuffle);
    expect(drawn.active).toHaveLength(1);
    const undone = undo(drawn);
    expect(undone.active).toEqual([]);
    expect(undone.drawPile).toHaveLength(20);
    expect(undone.discardPile).toHaveLength(0);
    expect(undone.history).toEqual([]);
  });

  it("puts the drawn card back on top of the draw pile", () => {
    const cards = buildBaseDeck();
    const state = makeDeck(cards, identityShuffle);
    const drawn = draw(state, identityShuffle);
    const drawnCard = drawn.active[0]![0]!;
    const undone = undo(drawn);
    expect(undone.drawPile[0]).toEqual(drawnCard);
  });

  it("undoes a rolling sequence as one step", () => {
    const rolling: Card = { id: "r", value: 0, rolling: true, effects: ["fire"] };
    const final: Card = { id: "f", value: 2, rolling: false, effects: [] };
    const filler = buildBaseDeck();
    const cards = [rolling, final, ...filler];
    const state = makeDeck(cards, identityShuffle);
    const drawn = draw(state, identityShuffle);
    expect(drawn.active[0]).toHaveLength(2);
    const undone = undo(drawn);
    expect(undone.active).toEqual([]);
    expect(undone.drawPile[0]).toEqual(rolling);
    expect(undone.drawPile[1]).toEqual(final);
  });

  it("restores needsShuffle when undoing a miss", () => {
    const missFirst: Card[] = [
      { id: "m", value: "miss", rolling: false, effects: [] },
      ...buildBaseDeck().filter((c) => c.value !== "miss"),
    ];
    const state = makeDeck(missFirst, identityShuffle);
    const drawn = draw(state, identityShuffle);
    expect(drawn.needsShuffle).toBe(true);
    const undone = undo(drawn);
    expect(undone.needsShuffle).toBe(false);
    expect(undone.drawPile[0]!.value).toBe("miss");
  });

  it("is a no-op when there is no previous state", () => {
    const state = makeDeck(buildBaseDeck(), identityShuffle);
    expect(undo(state)).toEqual(state);
  });

  it("steps back through multiple draws to the start of the deck", () => {
    const state = makeDeck(buildBaseDeck(), identityShuffle);
    const d1 = draw(state, identityShuffle);
    const d2 = draw(d1, identityShuffle);
    const d3 = draw(d2, identityShuffle);
    const u1 = undo(d3);
    expect(u1.drawPile).toHaveLength(d2.drawPile.length);
    const u2 = undo(u1);
    expect(u2.drawPile).toHaveLength(d1.drawPile.length);
    const u3 = undo(u2);
    expect(u3.drawPile).toHaveLength(20);
    expect(u3.active).toEqual([]);
    expect(u3.history).toEqual([]);
    const u4 = undo(u3);
    expect(u4).toEqual(u3);
  });

  it("reshuffleAll can be undone", () => {
    const state = makeDeck(buildBaseDeck(), identityShuffle);
    const drawn = draw(state, identityShuffle);
    const r = reshuffleAll(drawn, identityShuffle);
    expect(r.discardPile).toEqual([]);
    const undone = undo(r);
    expect(undone.active).toEqual(drawn.active);
    expect(undone.discardPile).toHaveLength(drawn.discardPile.length);
  });

  it("reshuffleDrawPile can be undone", () => {
    const state = makeDeck(buildBaseDeck(), identityShuffle);
    const drawn = draw(state, identityShuffle);
    const r = reshuffleDrawPile(drawn, identityShuffle);
    const undone = undo(r);
    expect(undone.active).toEqual(drawn.active);
    expect(undone.discardPile).toHaveLength(drawn.discardPile.length);
  });
});

describe("bless/curse removal and counts", () => {
  it("countBless reflects the number of bless cards in the draw pile", () => {
    let s = makeDeck(buildBaseDeck(), identityShuffle);
    expect(countBless(s)).toBe(0);
    s = addBless(s, identityShuffle);
    s = addBless(s, identityShuffle);
    expect(countBless(s)).toBe(2);
    expect(countCurse(s)).toBe(0);
  });

  it("countCurse reflects the number of curse cards in the draw pile", () => {
    let s = makeDeck(buildBaseDeck(), identityShuffle);
    s = addCurse(s, identityShuffle);
    s = addCurse(s, identityShuffle);
    s = addCurse(s, identityShuffle);
    expect(countCurse(s)).toBe(3);
    expect(countBless(s)).toBe(0);
  });

  it("removeBless decrements the bless count and leaves other cards intact", () => {
    let s = makeDeck(buildBaseDeck(), identityShuffle);
    s = addBless(s, identityShuffle);
    s = addBless(s, identityShuffle);
    const before = s.drawPile.length;
    s = removeBless(s, identityShuffle);
    expect(countBless(s)).toBe(1);
    expect(s.drawPile.length).toBe(before - 1);
    s = removeBless(s, identityShuffle);
    expect(countBless(s)).toBe(0);
  });

  it("removeBless is a no-op when there are no bless cards", () => {
    const s = makeDeck(buildBaseDeck(), identityShuffle);
    const after = removeBless(s, identityShuffle);
    expect(after.drawPile).toHaveLength(s.drawPile.length);
    expect(countBless(after)).toBe(0);
  });

  it("removeCurse decrements only curse cards", () => {
    let s = makeDeck(buildBaseDeck(), identityShuffle);
    s = addBless(s, identityShuffle);
    s = addCurse(s, identityShuffle);
    s = addCurse(s, identityShuffle);
    s = removeCurse(s, identityShuffle);
    expect(countCurse(s)).toBe(1);
    expect(countBless(s)).toBe(1);
  });

  it("removeCurse is a no-op when there are no curse cards", () => {
    const s = makeDeck(buildBaseDeck(), identityShuffle);
    const after = removeCurse(s, identityShuffle);
    expect(after.drawPile).toHaveLength(s.drawPile.length);
    expect(countCurse(after)).toBe(0);
  });

  it("removeBless and removeCurse can be undone", () => {
    let s = makeDeck(buildBaseDeck(), identityShuffle);
    s = addBless(s, identityShuffle);
    s = addCurse(s, identityShuffle);
    const blessBefore = countBless(s);
    const curseBefore = countCurse(s);

    const afterRemoveBless = removeBless(s, identityShuffle);
    expect(countBless(afterRemoveBless)).toBe(blessBefore - 1);
    expect(countBless(undo(afterRemoveBless))).toBe(blessBefore);

    const afterRemoveCurse = removeCurse(s, identityShuffle);
    expect(countCurse(afterRemoveCurse)).toBe(curseBefore - 1);
    expect(countCurse(undo(afterRemoveCurse))).toBe(curseBefore);
  });
});

describe("temp cards", () => {
  it("addTempCard shuffles a persistent card of the given value into the draw pile", () => {
    const state = makeDeck(buildBaseDeck(), identityShuffle);
    const after = addTempCard(state, -1, identityShuffle);
    expect(countCards(after)).toBe(21);
    const temp = after.drawPile.find((c) => c.id.startsWith("temp-"));
    expect(temp?.value).toBe(-1);
    expect(temp?.oneShot).toBeUndefined();
    expect(temp?.effects).toContain("temp");
  });

  it("a drawn temp card goes to the discard pile instead of leaving the deck", () => {
    const tempFirst: Card[] = [
      { id: "temp-t", value: -1, rolling: false, effects: ["temp"] },
      ...buildBaseDeck(),
    ];
    const state = makeDeck(tempFirst, identityShuffle);
    const after = draw(state, identityShuffle);
    expect(after.active[0]![0]!.id).toBe("temp-t");
    expect(after.discardPile.find((c) => c.id === "temp-t")).toBeDefined();
    expect(countCards(after)).toBe(21);
    expect(after.needsShuffle).toBe(false);
  });

  it("temp cards survive a full reshuffle", () => {
    const tempFirst: Card[] = [
      { id: "temp-t", value: -1, rolling: false, effects: ["temp"] },
      ...buildBaseDeck(),
    ];
    let s = makeDeck(tempFirst, identityShuffle);
    s = draw(s, identityShuffle);
    s = reshuffleAll(s, identityShuffle);
    expect(s.drawPile).toHaveLength(21);
    expect(countTemp(s, -1)).toBe(1);
  });

  it("countTemp counts per value and in total across both piles", () => {
    let s = makeDeck(buildBaseDeck(), identityShuffle);
    s = addTempCard(s, -1, identityShuffle);
    s = addTempCard(s, -1, identityShuffle);
    s = addTempCard(s, 1, identityShuffle);
    expect(countTemp(s, -1)).toBe(2);
    expect(countTemp(s, 1)).toBe(1);
    expect(countTemp(s, 0)).toBe(0);
    expect(countTemp(s)).toBe(3);

    // Identity shuffle keeps appended temp cards at the bottom, so drain the
    // pile until one has been drawn into the discard.
    while (s.discardPile.filter((c) => c.id.startsWith("temp-")).length === 0) {
      s = draw(s, identityShuffle);
    }
    expect(countTemp(s)).toBe(3);
  });

  it("removeTempCard removes from the draw pile first, then the discard pile", () => {
    const tempFirst: Card[] = [
      { id: "temp-t", value: -1, rolling: false, effects: ["temp"] },
      ...buildBaseDeck(),
    ];
    let s = makeDeck(tempFirst, identityShuffle);
    s = addTempCard(s, -1, identityShuffle);
    s = draw(s, identityShuffle); // temp-t drawn → sits in the discard
    expect(countTemp(s, -1)).toBe(2);

    s = removeTempCard(s, -1, identityShuffle); // one still in the draw pile
    expect(countTemp(s, -1)).toBe(1);
    expect(s.discardPile.find((c) => c.id === "temp-t")).toBeDefined();

    s = removeTempCard(s, -1, identityShuffle); // now only the discarded one is left
    expect(countTemp(s, -1)).toBe(0);
    expect(s.discardPile.find((c) => c.id === "temp-t")).toBeUndefined();
  });

  it("removeTempCard only removes cards matching the requested value", () => {
    let s = makeDeck(buildBaseDeck(), identityShuffle);
    s = addTempCard(s, -1, identityShuffle);
    const before = s;
    const after = removeTempCard(s, 1, identityShuffle);
    expect(after).toBe(before); // no +1 temp card → no-op
    expect(countTemp(after, -1)).toBe(1);
  });

  it("removeTempCard does not touch base cards of the same value", () => {
    let s = makeDeck(buildBaseDeck(), identityShuffle);
    s = addTempCard(s, -1, identityShuffle);
    s = removeTempCard(s, -1, identityShuffle);
    expect(countCards(s)).toBe(20);
    expect(s.drawPile.filter((c) => c.value === -1)).toHaveLength(5);
  });

  it("addTempCard and removeTempCard can be undone", () => {
    let s = makeDeck(buildBaseDeck(), identityShuffle);
    s = addTempCard(s, 2, identityShuffle);
    expect(countTemp(s, 2)).toBe(1);
    expect(countTemp(undo(s), 2)).toBe(0);

    const removed = removeTempCard(s, 2, identityShuffle);
    expect(countTemp(removed, 2)).toBe(0);
    expect(countTemp(undo(removed), 2)).toBe(1);
  });
});

describe("pile exhausted mid-draw", () => {
  const plain = (id: string, value: number): Card => ({ id, value, rolling: false, effects: [] });
  const rolling = (id: string): Card => ({ id, value: 0, rolling: true, effects: ["push"] });

  it("a rolling sequence never redraws a card it already revealed", () => {
    // Draw pile: one rolling card. Discard: one plain card. The rolling card
    // empties the pile, so the discard is shuffled in — the rolling card is in
    // play and must not be part of that shuffle.
    const state = {
      ...makeDeck([], identityShuffle),
      drawPile: [rolling("r")],
      discardPile: [plain("d", 1)],
    };
    const after = draw(state, identityShuffle);
    expect(after.active[0]!.map((c) => c.id)).toEqual(["r", "d"]);
    expect(after.drawPile).toEqual([]);
    expect(after.discardPile.map((c) => c.id).sort()).toEqual(["d", "r"]);
  });

  it("advantage's second draw never redraws the first draw's card", () => {
    const state = {
      ...makeDeck([], identityShuffle),
      drawPile: [plain("a", 1)],
      discardPile: [plain("b", -1)],
    };
    const after = drawAdvantage(state, identityShuffle);
    expect(after.active.map((seq) => seq.map((c) => c.id))).toEqual([["a"], ["b"]]);
    expect(after.discardPile.map((c) => c.id).sort()).toEqual(["a", "b"]);
  });

  it("stops short instead of crashing when every card is in play", () => {
    const state = { ...makeDeck([], identityShuffle), drawPile: [rolling("r")] };
    const after = draw(state, identityShuffle);
    expect(after.active[0]!.map((c) => c.id)).toEqual(["r"]);
    expect(after.discardPile.map((c) => c.id)).toEqual(["r"]);
  });
});

describe("resetDeck", () => {
  it("restores a fresh deck but keeps the undo stack", () => {
    let s = makeDeck(buildBaseDeck(), identityShuffle);
    s = addBless(s, identityShuffle);
    s = draw(s, identityShuffle);
    const before = s;
    const reset = resetDeck(s, buildBaseDeck(), identityShuffle);
    expect(reset.drawPile).toHaveLength(20);
    expect(reset.discardPile).toEqual([]);
    expect(reset.active).toEqual([]);
    expect(reset.recentDraws).toEqual([]);
    expect(countBless(reset)).toBe(0);

    const undone = undo(reset);
    expect(undone.drawPile).toEqual(before.drawPile);
    expect(undone.discardPile).toEqual(before.discardPile);
    expect(undone.active).toEqual(before.active);
    expect(undone.history).toHaveLength(before.history.length);
  });
});

describe("card ids", () => {
  it("are unique and tagged per launch so they can't collide with saved cards", () => {
    let s = makeDeck(buildBaseDeck(), identityShuffle);
    s = addBless(s, identityShuffle);
    s = addBless(s, identityShuffle);
    const ids = s.drawPile.filter((c) => c.id.startsWith("bless-")).map((c) => c.id);
    expect(new Set(ids).size).toBe(2);
    // A bare-counter id like "bless-1" from an earlier session can't match.
    for (const id of ids) expect(id).toMatch(/^bless-[0-9a-z]+-\d+$/);
  });
});
