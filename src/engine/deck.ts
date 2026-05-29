import type { Card, CardSpec, Perk, PerkOp } from "../data/types";

export type DeckSnapshot = {
  drawPile: Card[];
  discardPile: Card[];
  active: Card[][];
  needsShuffle: boolean;
};

export type DeckState = DeckSnapshot & {
  // Undo stack: snapshots of prior states, oldest first. Every mutating op
  // pushes the pre-op state; undo() pops the most recent. Cleared only by a
  // full rebuild (makeDeck), so undo walks all the way back to the deck's
  // start. Capped to keep the persisted state bounded over a long session.
  history: DeckSnapshot[];
};

const MAX_HISTORY = 100;

function snapshot(state: DeckState): DeckSnapshot {
  return {
    drawPile: state.drawPile.slice(),
    discardPile: state.discardPile.slice(),
    active: state.active.map((seq) => seq.slice()),
    needsShuffle: state.needsShuffle,
  };
}

// Produce the next DeckState, recording the prior state on the undo stack.
function pushHistory(prev: DeckState, next: DeckSnapshot): DeckState {
  const history = prev.history.concat(snapshot(prev));
  if (history.length > MAX_HISTORY) history.splice(0, history.length - MAX_HISTORY);
  return { ...next, history };
}

export type ShuffleFn = <T>(arr: readonly T[]) => T[];

export const fisherYates: ShuffleFn = <T>(arr: readonly T[]): T[] => {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = out[i]!;
    out[i] = out[j]!;
    out[j] = tmp;
  }
  return out;
};

export function makeDeck(cards: readonly Card[], shuffle: ShuffleFn = fisherYates): DeckState {
  return {
    drawPile: shuffle(cards),
    discardPile: [],
    active: [],
    needsShuffle: false,
    history: [],
  };
}

function shufflesOnDraw(card: Card): boolean {
  // Bless ("x2") and curse ("miss") are one-shot and don't carry the shuffle
  // icon — only the base-deck miss / x2 cards trigger an end-of-round shuffle.
  if (card.oneShot) return false;
  return card.value === "miss" || card.value === "x2";
}

type DrawResult = {
  drawPile: Card[];
  discardPile: Card[];
  sequence: Card[];
  needsShuffle: boolean;
};

function drawOnce(
  drawPile: Card[],
  discardPile: Card[],
  needsShuffleAtStart: boolean,
  shuffle: ShuffleFn
): DrawResult {
  let pile = drawPile.slice();
  let discard = discardPile.slice();
  if (needsShuffleAtStart || pile.length === 0) {
    pile = shuffle(pile.concat(discard));
    discard = [];
  }

  const sequence: Card[] = [];
  let needsShuffle = false;

  while (true) {
    if (pile.length === 0) {
      pile = shuffle(discard);
      discard = [];
    }
    const card = pile.shift()!;
    sequence.push(card);

    if (!card.oneShot) {
      discard.push(card);
    }

    if (shufflesOnDraw(card)) {
      needsShuffle = true;
    }

    if (!card.rolling) {
      break;
    }
  }

  return { drawPile: pile, discardPile: discard, sequence, needsShuffle };
}

export function draw(state: DeckState, shuffle: ShuffleFn = fisherYates): DeckState {
  const result = drawOnce(state.drawPile, state.discardPile, state.needsShuffle, shuffle);
  return pushHistory(state, {
    drawPile: result.drawPile,
    discardPile: result.discardPile,
    active: [result.sequence],
    needsShuffle: result.needsShuffle,
  });
}

export function drawAdvantage(state: DeckState, shuffle: ShuffleFn = fisherYates): DeckState {
  const first = drawOnce(state.drawPile, state.discardPile, state.needsShuffle, shuffle);
  // Both advantage draws happen before any shuffle (shuffle is end-of-round per
  // the Gloomhaven rule). Pass needsShuffleAtStart=false so the second draw
  // doesn't reshuffle just because the first one revealed miss or x2.
  const second = drawOnce(first.drawPile, first.discardPile, false, shuffle);
  return pushHistory(state, {
    drawPile: second.drawPile,
    discardPile: second.discardPile,
    active: [first.sequence, second.sequence],
    needsShuffle: first.needsShuffle || second.needsShuffle,
  });
}

export function undo(state: DeckState): DeckState {
  if (state.history.length === 0) return state;
  const history = state.history.slice();
  const prev = history.pop()!;
  return { ...prev, history };
}

export function canUndo(state: DeckState): boolean {
  return state.history.length > 0;
}

export function reshuffle(state: DeckState, shuffle: ShuffleFn = fisherYates): DeckState {
  // Manual shuffles clear `active` — the table is reset, the previously drawn
  // card is no longer in play. The internal reshuffle inside draw() runs
  // through this too, but draw() immediately overwrites active with the new
  // drawn sequence so the clear is invisible in that path.
  const combined = state.drawPile.concat(state.discardPile);
  return pushHistory(state, {
    drawPile: shuffle(combined),
    discardPile: [],
    active: [],
    needsShuffle: false,
  });
}

export function reshuffleAll(state: DeckState, shuffle: ShuffleFn = fisherYates): DeckState {
  return reshuffle(state, shuffle);
}

export function reshuffleDrawPile(state: DeckState, shuffle: ShuffleFn = fisherYates): DeckState {
  return pushHistory(state, {
    drawPile: shuffle(state.drawPile),
    discardPile: state.discardPile.slice(),
    active: [],
    needsShuffle: false,
  });
}

export function peek(state: DeckState, n: number, shuffle: ShuffleFn = fisherYates): {
  state: DeckState;
  sequences: Card[][];
} {
  let s = state;
  const sequences: Card[][] = [];
  for (let i = 0; i < n; i++) {
    s = draw(s, shuffle);
    sequences.push(s.active[0] ?? []);
  }
  return { state: s, sequences };
}

function cardMatchesSpec(card: Card, spec: CardSpec): boolean {
  if (card.value !== spec.value) return false;
  if ((spec.rolling ?? false) !== card.rolling) return false;
  const wantEffects = (spec.effects ?? []).slice().sort();
  const haveEffects = card.effects.slice().sort();
  if (wantEffects.length !== haveEffects.length) return false;
  return wantEffects.every((e, i) => e === haveEffects[i]);
}

let cardSeq = 0;
function cardId(prefix: string): string {
  cardSeq += 1;
  return `${prefix}-${cardSeq}`;
}

function specToCard(spec: CardSpec, prefix = "perk"): Card {
  return {
    id: cardId(prefix),
    value: spec.value,
    rolling: spec.rolling ?? false,
    effects: spec.effects ?? [],
  };
}

export function applyPerks(baseDeck: readonly Card[], perks: readonly Perk[], counts: Readonly<Record<string, number>>): Card[] {
  let deck: Card[] = baseDeck.map((c) => ({ ...c, effects: c.effects.slice() }));

  const ops: PerkOp[] = [];
  for (const perk of perks) {
    const applied = Math.min(counts[perk.id] ?? 0, perk.count);
    for (let i = 0; i < applied; i++) {
      ops.push(...perk.ops);
    }
  }

  for (const op of ops) {
    if (op.op === "remove") {
      for (let n = 0; n < op.count; n++) {
        const idx = deck.findIndex((c) => cardMatchesSpec(c, op.card));
        if (idx >= 0) deck.splice(idx, 1);
      }
    } else if (op.op === "add") {
      for (let n = 0; n < op.count; n++) {
        deck.push(specToCard(op.card));
      }
    }
  }

  return deck;
}

export function addBless(state: DeckState, shuffle: ShuffleFn = fisherYates): DeckState {
  const bless: Card = {
    id: cardId("bless"),
    value: "x2",
    rolling: false,
    effects: ["bless"],
    oneShot: true,
  };
  const combined = state.drawPile.concat([bless]);
  return pushHistory(state, {
    drawPile: shuffle(combined),
    discardPile: state.discardPile.slice(),
    active: state.active.map((seq) => seq.slice()),
    needsShuffle: state.needsShuffle,
  });
}

export function addCurse(state: DeckState, shuffle: ShuffleFn = fisherYates): DeckState {
  const curse: Card = {
    id: cardId("curse"),
    value: "miss",
    rolling: false,
    effects: ["curse"],
    oneShot: true,
  };
  const combined = state.drawPile.concat([curse]);
  return pushHistory(state, {
    drawPile: shuffle(combined),
    discardPile: state.discardPile.slice(),
    active: state.active.map((seq) => seq.slice()),
    needsShuffle: state.needsShuffle,
  });
}

export function removeBless(state: DeckState, shuffle: ShuffleFn = fisherYates): DeckState {
  const idx = state.drawPile.findIndex((c) => c.id.startsWith("bless-"));
  if (idx < 0) return state;
  const drawPile = state.drawPile.slice();
  drawPile.splice(idx, 1);
  return pushHistory(state, {
    drawPile: shuffle(drawPile),
    discardPile: state.discardPile.slice(),
    active: state.active.map((seq) => seq.slice()),
    needsShuffle: state.needsShuffle,
  });
}

export function removeCurse(state: DeckState, shuffle: ShuffleFn = fisherYates): DeckState {
  const idx = state.drawPile.findIndex((c) => c.id.startsWith("curse-"));
  if (idx < 0) return state;
  const drawPile = state.drawPile.slice();
  drawPile.splice(idx, 1);
  return pushHistory(state, {
    drawPile: shuffle(drawPile),
    discardPile: state.discardPile.slice(),
    active: state.active.map((seq) => seq.slice()),
    needsShuffle: state.needsShuffle,
  });
}

export function countBless(state: DeckState): number {
  return state.drawPile.filter((c) => c.id.startsWith("bless-")).length;
}

export function countCurse(state: DeckState): number {
  return state.drawPile.filter((c) => c.id.startsWith("curse-")).length;
}

export function countCards(state: DeckState): number {
  return state.drawPile.length + state.discardPile.length;
}
