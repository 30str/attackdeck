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
  countCards,
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
  it("addBless adds a single removable card", () => {
    const state = makeDeck(buildBaseDeck(), identityShuffle);
    const blessed = addBless(state, identityShuffle);
    expect(countCards(blessed)).toBe(21);
    const blessCard = blessed.drawPile.find((c) => c.effects.includes("bless"));
    expect(blessCard?.value).toBe(2);
    expect(blessCard?.oneShot).toBe(true);
  });

  it("a drawn bless does not go to discard", () => {
    const blessFirst: Card[] = [
      {
        id: "b",
        value: 2,
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

  it("addCurse adds a removable miss card", () => {
    const state = makeDeck(buildBaseDeck(), identityShuffle);
    const cursed = addCurse(state, identityShuffle);
    const curseCard = cursed.drawPile.find((c) => c.effects.includes("curse"));
    expect(curseCard?.value).toBe("miss");
    expect(curseCard?.oneShot).toBe(true);
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

  it("manual shuffles clear the active card display", () => {
    const state = makeDeck(buildBaseDeck(), identityShuffle);
    const drawn = draw(state, identityShuffle);
    expect(drawn.active).toHaveLength(1);
    expect(reshuffleAll(drawn, identityShuffle).active).toEqual([]);
    expect(reshuffleDrawPile(drawn, identityShuffle).active).toEqual([]);
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
    expect(undone.previous).toBeNull();
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

  it("only supports one step of undo", () => {
    const state = makeDeck(buildBaseDeck(), identityShuffle);
    const d1 = draw(state, identityShuffle);
    const d2 = draw(d1, identityShuffle);
    const u1 = undo(d2);
    expect(u1.drawPile).toHaveLength(d1.drawPile.length);
    const u2 = undo(u1);
    expect(u2).toEqual(u1);
  });

  it("reshuffleAll clears the undo snapshot", () => {
    const state = makeDeck(buildBaseDeck(), identityShuffle);
    const drawn = draw(state, identityShuffle);
    const r = reshuffleAll(drawn, identityShuffle);
    expect(r.previous).toBeNull();
  });

  it("reshuffleDrawPile clears the undo snapshot", () => {
    const state = makeDeck(buildBaseDeck(), identityShuffle);
    const drawn = draw(state, identityShuffle);
    const r = reshuffleDrawPile(drawn, identityShuffle);
    expect(r.previous).toBeNull();
  });
});
