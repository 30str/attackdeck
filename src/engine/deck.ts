import type { Card, CardSpec, Perk, PerkOp } from "../data/types";

export type DeckSnapshot = {
  drawPile: Card[];
  discardPile: Card[];
  active: Card[][];
  // Chronological log of every card revealed by a draw, oldest first. The
  // piles can't reconstruct this: one-shots (bless/curse) leave the game the
  // moment they're drawn. Feeds the discard-cascade display; cleared by a
  // full reshuffle (everything is back in the deck) and capped so persisted
  // state stays bounded.
  recentDraws: Card[];
  needsShuffle: boolean;
};

export type DeckState = DeckSnapshot & {
  // Undo stack: snapshots of prior states, oldest first. Every mutating op
  // pushes the pre-op state; undo() pops the most recent. Cleared only by a
  // full rebuild (makeDeck, on perk changes), so undo walks all the way back
  // to the deck's start — including across a resetDeck. Capped to keep the
  // persisted state bounded over a long session.
  history: DeckSnapshot[];
};

const MAX_HISTORY = 100;
const MAX_RECENT_DRAWS = 10;

function snapshot(state: DeckState): DeckSnapshot {
  return {
    drawPile: state.drawPile.slice(),
    discardPile: state.discardPile.slice(),
    active: state.active.map((seq) => seq.slice()),
    recentDraws: state.recentDraws.slice(),
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
    recentDraws: [],
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
  // Excludes the cards in `sequence`: they're in play until the whole draw
  // resolves, so the caller adds them to the discard afterwards.
  discardPile: Card[];
  sequence: Card[];
  needsShuffle: boolean;
};

// Cards that go to the discard once played (one-shots leave the game).
function discarded(sequence: readonly Card[]): Card[] {
  return sequence.filter((c) => !c.oneShot);
}

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
      // The pile ran dry mid-sequence: shuffle the discard back in. Cards in
      // play aren't in `discard` yet, so the same card can't come up twice.
      // If nothing is left at all (every card is in play), stop short.
      if (discard.length === 0) break;
      pile = shuffle(discard);
      discard = [];
    }
    const card = pile.shift()!;
    sequence.push(card);

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
    discardPile: result.discardPile.concat(discarded(result.sequence)),
    active: [result.sequence],
    recentDraws: state.recentDraws.concat(result.sequence).slice(-MAX_RECENT_DRAWS),
    needsShuffle: result.needsShuffle,
  });
}

export function drawAdvantage(state: DeckState, shuffle: ShuffleFn = fisherYates): DeckState {
  const first = drawOnce(state.drawPile, state.discardPile, state.needsShuffle, shuffle);
  // Both advantage draws happen before any shuffle (shuffle is end-of-round per
  // the Gloomhaven rule). Pass needsShuffleAtStart=false so the second draw
  // doesn't reshuffle just because the first one revealed miss or x2. The
  // first sequence stays in play (out of the discard) during the second draw.
  const second = drawOnce(first.drawPile, first.discardPile, false, shuffle);
  return pushHistory(state, {
    drawPile: second.drawPile,
    discardPile: second.discardPile.concat(discarded(first.sequence), discarded(second.sequence)),
    active: [first.sequence, second.sequence],
    recentDraws: state.recentDraws
      .concat(first.sequence, second.sequence)
      .slice(-MAX_RECENT_DRAWS),
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
  // `active` is cleared: after a full shuffle every drawn card is back in the
  // deck, so leaving the last draw on display would show stale information.
  // The screen resets to its empty "tap to draw" state (undo restores it).
  const combined = state.drawPile.concat(state.discardPile);
  return pushHistory(state, {
    drawPile: shuffle(combined),
    discardPile: [],
    active: [],
    recentDraws: [],
    needsShuffle: false,
  });
}

// Replace the deck's contents with a freshly shuffled `cards` (the store's
// reset path), keeping the undo stack so an accidental reset can be undone.
// Perk toggles use makeDeck instead: their history would restore a deck
// built from different perks.
export function resetDeck(
  state: DeckState,
  cards: readonly Card[],
  shuffle: ShuffleFn = fisherYates
): DeckState {
  return pushHistory(state, {
    drawPile: shuffle(cards),
    discardPile: [],
    active: [],
    recentDraws: [],
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
    active: state.active.map((seq) => seq.slice()),
    recentDraws: state.recentDraws.slice(),
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

// The counter restarts on every launch, but cards created in an earlier
// session are still in persisted decks — the per-launch tag keeps a new
// `bless-1` from colliding with a saved one.
const SESSION_TAG = Date.now().toString(36);
let cardSeq = 0;
function cardId(prefix: string): string {
  cardSeq += 1;
  return `${prefix}-${SESSION_TAG}-${cardSeq}`;
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
    recentDraws: state.recentDraws.slice(),
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
    recentDraws: state.recentDraws.slice(),
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
    recentDraws: state.recentDraws.slice(),
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
    recentDraws: state.recentDraws.slice(),
    needsShuffle: state.needsShuffle,
  });
}

// Temporary cards cover scenario/item effects like "add three -1 cards to your
// attack modifier deck". Unlike bless/curse they are NOT one-shot: a drawn temp
// card goes to the discard pile and shuffles back in like any base card. They
// leave the deck only via removeTempCard or a full rebuild (deck reset).
export const TEMP_CARD_VALUES = [-2, -1, 0, 1, 2] as const;
export type TempCardValue = (typeof TEMP_CARD_VALUES)[number];

function isTempCard(card: Card): boolean {
  return card.id.startsWith("temp-");
}

export function addTempCard(
  state: DeckState,
  value: TempCardValue,
  shuffle: ShuffleFn = fisherYates
): DeckState {
  const card: Card = {
    id: cardId("temp"),
    value,
    rolling: false,
    effects: ["temp"],
  };
  return pushHistory(state, {
    drawPile: shuffle(state.drawPile.concat([card])),
    discardPile: state.discardPile.slice(),
    active: state.active.map((seq) => seq.slice()),
    recentDraws: state.recentDraws.slice(),
    needsShuffle: state.needsShuffle,
  });
}

export function removeTempCard(
  state: DeckState,
  value: TempCardValue,
  shuffle: ShuffleFn = fisherYates
): DeckState {
  // Temp cards persist through draws, so one may sit in either pile. Take it
  // out of the draw pile first; fall back to the discard.
  const matches = (c: Card) => isTempCard(c) && c.value === value;
  const drawIdx = state.drawPile.findIndex(matches);
  if (drawIdx >= 0) {
    const drawPile = state.drawPile.slice();
    drawPile.splice(drawIdx, 1);
    return pushHistory(state, {
      drawPile: shuffle(drawPile),
      discardPile: state.discardPile.slice(),
      active: state.active.map((seq) => seq.slice()),
      recentDraws: state.recentDraws.slice(),
      needsShuffle: state.needsShuffle,
    });
  }
  const discardIdx = state.discardPile.findIndex(matches);
  if (discardIdx < 0) return state;
  const discardPile = state.discardPile.slice();
  discardPile.splice(discardIdx, 1);
  return pushHistory(state, {
    drawPile: state.drawPile.slice(),
    discardPile,
    active: state.active.map((seq) => seq.slice()),
    recentDraws: state.recentDraws.slice(),
    needsShuffle: state.needsShuffle,
  });
}

export function countTemp(state: DeckState, value?: TempCardValue): number {
  const matches = (c: Card) => isTempCard(c) && (value === undefined || c.value === value);
  return state.drawPile.filter(matches).length + state.discardPile.filter(matches).length;
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
