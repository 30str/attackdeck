import { describe, it, expect } from "vitest";
import { layoutDraw, CARD_W, CARD_H, type DrawLayout } from "./cardLayout";

// A typical phone's card area after the draw screen's chrome (~390pt wide).
const PHONE = { w: 342, h: 350 };

function allCards(l: DrawLayout) {
  return [...l.stack, ...l.sequences.flat()];
}

function expectInsideBlock(l: DrawLayout, availW: number, availH: number) {
  const w = CARD_W * l.scale;
  const h = CARD_H * l.scale;
  for (const p of allCards(l)) {
    expect(p.x).toBeGreaterThanOrEqual(-0.001);
    expect(p.y).toBeGreaterThanOrEqual(-0.001);
    expect(p.x + w).toBeLessThanOrEqual(l.width + 0.001);
    expect(p.y + h).toBeLessThanOrEqual(l.height + 0.001);
  }
  expect(l.width).toBeLessThanOrEqual(availW + 0.001);
  expect(l.height).toBeLessThanOrEqual(availH + 0.001);
}

function expectNoFrontOverlap(l: DrawLayout) {
  const w = CARD_W * l.scale;
  const h = CARD_H * l.scale;
  const front = l.sequences.flat();
  for (let i = 0; i < front.length; i++) {
    for (let j = i + 1; j < front.length; j++) {
      const a = front[i]!;
      const b = front[j]!;
      const overlaps = a.x < b.x + w - 0.001 && b.x < a.x + w - 0.001 && a.y < b.y + h - 0.001 && b.y < a.y + h - 0.001;
      expect(overlaps).toBe(false);
    }
  }
}

describe("layoutDraw", () => {
  it("fits a single card to the area", () => {
    const l = layoutDraw([1], 0, PHONE.w, PHONE.h);
    expect(l.scale).toBeCloseTo(Math.min(PHONE.w / CARD_W, PHONE.h / CARD_H));
    expectInsideBlock(l, PHONE.w, PHONE.h);
  });

  it("caps the scale on large screens", () => {
    expect(layoutDraw([1], 0, 2000, 2000).scale).toBe(1.5);
  });

  it("gives an advantage pair far more room than the old fixed 90pt cards", () => {
    const l = layoutDraw([1, 1], 0, PHONE.w, PHONE.h);
    expect(CARD_W * l.scale).toBeGreaterThan(150);
    expectInsideBlock(l, PHONE.w, PHONE.h);
    expectNoFrontOverlap(l);
    // Side by side, top-aligned.
    expect(l.sequences[0]![0]!.y).toBeCloseTo(l.sequences[1]![0]!.y);
    expect(l.sequences[1]![0]!.x).toBeGreaterThan(l.sequences[0]![0]!.x);
  });

  it("wraps a rolling chain into a grid instead of one long row", () => {
    const l = layoutDraw([4], 0, PHONE.w, PHONE.h);
    const ys = new Set(l.sequences[0]!.map((p) => Math.round(p.y)));
    expect(ys.size).toBeGreaterThan(1);
    // Better than a single row of four.
    expect(l.scale).toBeGreaterThan(PHONE.w / (4 * CARD_W + 3 * 16));
    expectInsideBlock(l, PHONE.w, PHONE.h);
    expectNoFrontOverlap(l);
  });

  it("uses one scale for both advantage columns even when one is a rolling chain", () => {
    const l = layoutDraw([3, 1], 2, PHONE.w, PHONE.h);
    expectInsideBlock(l, PHONE.w, PHONE.h);
    expectNoFrontOverlap(l);
    // The single-card column is centered vertically against the taller chain.
    const chainTop = Math.min(...l.sequences[0]!.map((p) => p.y));
    expect(l.sequences[1]![0]!.y).toBeGreaterThan(chainTop);
  });

  it("puts one divider between advantage columns, clear of both", () => {
    const l = layoutDraw([3, 2], 0, PHONE.w, PHONE.h);
    expect(l.dividers).toHaveLength(1);
    const leftEdge = Math.max(...l.sequences[0]!.map((p) => p.x)) + CARD_W * l.scale;
    const rightEdge = Math.min(...l.sequences[1]!.map((p) => p.x));
    expect(l.dividers[0]!).toBeGreaterThan(leftEdge);
    expect(l.dividers[0]!).toBeLessThan(rightEdge);
    expect(layoutDraw([2], 0, PHONE.w, PHONE.h).dividers).toEqual([]);
  });

  it("splays the cascade up-left of the first card, at least 16px per step", () => {
    const l = layoutDraw([1, 1], 3, PHONE.w, PHONE.h);
    const anchor = l.sequences[0]![0]!;
    expect(l.stack).toHaveLength(3);
    for (let i = 0; i < 3; i++) {
      const depth = 3 - i;
      expect(anchor.x - l.stack[i]!.x).toBeGreaterThanOrEqual(16 * depth - 0.001);
      expect(anchor.y - l.stack[i]!.y).toBeCloseTo(anchor.x - l.stack[i]!.x);
    }
    expectInsideBlock(l, PHONE.w, PHONE.h);
  });
});
