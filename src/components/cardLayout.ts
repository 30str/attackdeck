// Pure layout math for the draw screen's card area: where each revealed card
// and each discard-cascade card goes, and how big they are. No React, so the
// fitting logic can be unit-tested.
//
// Everything is designed at a "native" card size and scaled uniformly to fit
// the measured area. A sequence (one draw: rolling cards plus the final card)
// lays out as a grid, so a long rolling chain wraps instead of shrinking to
// nothing. Advantage shows two sequences side by side at ONE shared scale —
// the two results must be the same size to compare at a glance.

export const CARD_W = 260;
export const CARD_H = 360;

const CARD_GAP = 16; // native, between cards of one sequence
const COLUMN_GAP = 48; // native, between the two advantage columns (holds the divider)
const STACK_OFF = 26; // native, per discard-cascade card
const STACK_OFF_MIN = 16; // px — keeps the cascade's corner values visible when small
const MAX_SCALE = 1.5;
const MIN_SCALE = 0.05;

export type Point = { x: number; y: number };

export type DrawLayout = {
  scale: number;
  /** Size of the whole block (cards plus cascade), in px. */
  width: number;
  height: number;
  /** Top-left of each card, per sequence, in px. */
  sequences: Point[][];
  /** Center x of the gap between advantage columns, in px — where a divider
   * goes so two wrapped rolling chains don't read as one grid. Spans the
   * cards' full height (from `ext` to `height`). */
  dividers: number[];
  /** Top of the revealed cards (below the cascade's reserved band), in px. */
  top: number;
  /** Top-left of each cascade card (oldest first), in px. */
  stack: Point[];
};

type Grid = { n: number; cols: number; rows: number; w: number; h: number };

function grid(n: number, cols: number): Grid {
  if (n === 0) return { n, cols: 1, rows: 0, w: 0, h: 0 };
  const rows = Math.ceil(n / cols);
  return {
    n,
    cols,
    rows,
    w: cols * CARD_W + (cols - 1) * CARD_GAP,
    h: rows * CARD_H + (rows - 1) * CARD_GAP,
  };
}

// Every combination of column counts, one per sequence. Sequences are short
// (a rolling chain is a handful of cards) and there are at most two, so this
// stays tiny.
function gridChoices(lengths: number[]): Grid[][] {
  let combos: Grid[][] = [[]];
  for (const n of lengths) {
    const next: Grid[][] = [];
    for (const combo of combos) {
      for (let cols = 1; cols <= Math.max(1, n); cols++) next.push([...combo, grid(n, cols)]);
    }
    combos = next;
  }
  return combos;
}

function fit(
  nw: number,
  nh: number,
  stackCount: number,
  availW: number,
  availH: number
): { scale: number; off: number } {
  if (nw === 0 || nh === 0) return { scale: 1, off: 0 };
  // The cascade offset scales with the cards, but never below STACK_OFF_MIN.
  let scale = Math.min(availW / (nw + stackCount * STACK_OFF), availH / (nh + stackCount * STACK_OFF));
  if (stackCount > 0 && STACK_OFF * scale < STACK_OFF_MIN) {
    const ext = stackCount * STACK_OFF_MIN;
    scale = Math.min((availW - ext) / nw, (availH - ext) / nh);
  }
  scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));
  const off = stackCount > 0 ? Math.max(STACK_OFF * scale, STACK_OFF_MIN) : 0;
  return { scale, off };
}

export function layoutDraw(
  sequenceLengths: number[],
  stackCount: number,
  availW: number,
  availH: number
): DrawLayout {
  const gap = sequenceLengths.length > 1 ? COLUMN_GAP : 0;

  let best: { grids: Grid[]; scale: number; off: number; nw: number; nh: number } | null = null;
  for (const grids of gridChoices(sequenceLengths)) {
    const nw = grids.reduce((sum, g) => sum + g.w, 0) + gap * (grids.length - 1);
    const nh = Math.max(0, ...grids.map((g) => g.h));
    const { scale, off } = fit(nw, nh, stackCount, availW, availH);
    if (!best || scale > best.scale) best = { grids, scale, off, nw, nh };
  }
  const { grids, scale: s, off, nw, nh } = best!;

  const ext = stackCount * off;
  const sequences: Point[][] = [];
  const dividers: number[] = [];
  let colX = ext;
  for (const g of grids) {
    // Center a shorter column vertically against the taller one.
    const y0 = ext + ((nh - g.h) / 2) * s;
    const cards: Point[] = [];
    for (let i = 0; i < g.n; i++) {
      const row = Math.floor(i / g.cols);
      const col = i % g.cols;
      // Center a partially filled last row.
      const inRow = Math.min(g.cols, g.n - row * g.cols);
      const rowInset = ((g.cols - inRow) * (CARD_W + CARD_GAP)) / 2;
      cards.push({
        x: colX + (rowInset + col * (CARD_W + CARD_GAP)) * s,
        y: y0 + row * (CARD_H + CARD_GAP) * s,
      });
    }
    sequences.push(cards);
    colX += (g.w + gap) * s;
    if (sequences.length < grids.length) dividers.push(colX - (gap / 2) * s);
  }

  // The cascade peeks out up-left of the first revealed card, oldest deepest.
  const anchor = sequences.find((seq) => seq.length > 0)?.[0] ?? { x: ext, y: ext };
  const stack: Point[] = [];
  for (let i = 0; i < stackCount; i++) {
    const depth = stackCount - i;
    stack.push({ x: anchor.x - depth * off, y: anchor.y - depth * off });
  }

  return {
    scale: s,
    width: ext + nw * s,
    height: ext + nh * s,
    sequences,
    stack,
    dividers,
    top: ext,
  };
}
