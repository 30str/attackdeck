import type { Card, CardSpec, Perk, PerkOp } from "../data/types";

export type DrawKind = "normal" | "advantage" | "disadvantage";

/** Which advantage/disadvantage procedure to follow (see drawAdvantage). */
export type AdvantageRules = "gh" | "fh";

/** What the last draw revealed, structured for display. The app doesn't do
 * the attack math — the player reads the cards — so this records which cards
 * count and whether there's a choice to make. */
export type ActiveDraw = {
  kind: DrawKind;
  /** Rolling cards revealed before the options. */
  lead: Card[];
  /** true: the lead cards add to whichever option is picked (advantage);
   * false: they were revealed but are disregarded (disadvantage). */
  leadApplies: boolean;
  /** One entry is the result; two means the player picks between them. Each
   * is a chain: any rolling cards that count, then a final card. */
  options: Card[][];
  /** Cards whose rolling icon doesn't count (Frosthaven's second draw). */
  rollingIgnored: string[];
};

export type DeckSnapshot = {
  drawPile: Card[];
  discardPile: Card[];
  active: ActiveDraw | null;
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
    active: state.active,
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
    active: null,
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

// Cards that go to the discard once played (one-shots leave the game).
function discarded(cards: readonly Card[]): Card[] {
  return cards.filter((c) => !c.oneShot);
}

// Deals cards one at a time for a single draw (which may reveal many cards).
// Revealed cards stay in play — out of the discard — until the whole draw
// resolves, so if the pile runs dry and the discard is shuffled back in, a
// card already revealed can't come up twice.
class Dealer {
  pile: Card[];
  discard: Card[];
  revealed: Card[] = [];
  private shuffle: ShuffleFn;
  constructor(drawPile: readonly Card[], discardPile: readonly Card[], shuffle: ShuffleFn) {
    this.pile = drawPile.slice();
    this.discard = discardPile.slice();
    this.shuffle = shuffle;
  }
  /** The next card, or undefined when every card is already in play. */
  next(): Card | undefined {
    if (this.pile.length === 0) {
      // The rules shuffle an empty pile immediately, mid-draw or not.
      if (this.discard.length === 0) return undefined;
      this.pile = this.shuffle(this.discard);
      this.discard = [];
    }
    const card = this.pile.shift()!;
    this.revealed.push(card);
    return card;
  }
  /** Cards up to and including the first non-rolling one. */
  chain(): Card[] {
    const out: Card[] = [];
    for (let c = this.next(); c; c = c.rolling ? this.next() : undefined) out.push(c);
    return out;
  }
}

function settle(state: DeckState, dealer: Dealer, active: ActiveDraw): DeckState {
  return pushHistory(state, {
    drawPile: dealer.pile,
    discardPile: dealer.discard.concat(discarded(dealer.revealed)),
    active,
    recentDraws: state.recentDraws.concat(dealer.revealed).slice(-MAX_RECENT_DRAWS),
    // Sticky: a pending shuffle survives later draws until reshuffled.
    needsShuffle: state.needsShuffle || dealer.revealed.some(shufflesOnDraw),
  });
}

function nonEmpty(options: Card[][]): Card[][] {
  return options.filter((o) => o.length > 0);
}

// A pending shuffle (miss / x2 revealed) does NOT reshuffle here: the rules
// shuffle at end of round, and later attacks in the same round keep drawing
// from what's left. The flag stays set until reshuffleAll / reshuffleDrawPile.
// Only an empty pile forces an immediate reshuffle (inside the Dealer).
export function draw(state: DeckState, shuffle: ShuffleFn = fisherYates): DeckState {
  const dealer = new Dealer(state.drawPile, state.discardPile, shuffle);
  return settle(state, dealer, {
    kind: "normal",
    lead: [],
    leadApplies: false,
    options: nonEmpty([dealer.chain()]),
    rollingIgnored: [],
  });
}

export type AdvantageOptions = {
  kind: "advantage" | "disadvantage";
  rules: AdvantageRules;
  /** Frosthaven rules only: a rolling second card keeps drawing to a
   * non-rolling one instead of having its rolling icon ignored. */
  rollingHouseRule?: boolean;
};

// Gloomhaven 1st edition: draw two. Both non-rolling → the player picks.
// Otherwise there's no choice: with advantage, rolling cards add to the other
// card (both rolling → draw on to a non-rolling one and add everything); with
// disadvantage, rolling cards are disregarded and the non-rolling card is the
// result.
function dealGh(dealer: Dealer, kind: AdvantageOptions["kind"]): ActiveDraw {
  const two = [dealer.next(), dealer.next()].filter((c): c is Card => !!c);
  if (two.every((c) => !c.rolling)) {
    return { kind, lead: [], leadApplies: false, options: two.map((c) => [c]), rollingIgnored: [] };
  }
  const all = two.every((c) => c.rolling) ? two.concat(dealer.chain()) : two;
  if (kind === "advantage") {
    return { kind, lead: [], leadApplies: false, options: [all], rollingIgnored: [] };
  }
  return {
    kind,
    lead: all.filter((c) => c.rolling),
    leadApplies: false,
    options: nonEmpty([all.filter((c) => !c.rolling)]),
    rollingIgnored: [],
  };
}

// Frosthaven / Gloomhaven 2nd edition: draw through any opening rolling cards
// to a non-rolling one, then draw one more. The player picks between those
// two; the opening rolling cards add to whichever is picked with advantage
// and are ignored with disadvantage. The second card's rolling icon is
// ignored — unless the house rule has it draw on like a normal rolling card.
function dealFh(dealer: Dealer, opts: AdvantageOptions): ActiveDraw {
  const opening = dealer.chain();
  const lead = opening.filter((c) => c.rolling);
  const first = opening.filter((c) => !c.rolling);
  const t = dealer.next();
  let second: Card[] = t ? [t] : [];
  const rollingIgnored: string[] = [];
  if (t?.rolling) {
    if (opts.rollingHouseRule) second = second.concat(dealer.chain());
    else rollingIgnored.push(t.id);
  }
  if (opts.kind === "disadvantage") {
    // Every rolling card is disregarded with disadvantage, so a house-rule
    // chain on the second draw contributes only its final card.
    const counts = (c: Card) => !c.rolling || rollingIgnored.includes(c.id);
    return {
      kind: opts.kind,
      lead: lead.concat(second.filter((c) => !counts(c))),
      leadApplies: false,
      options: nonEmpty([first, second.filter(counts)]),
      rollingIgnored,
    };
  }
  return { kind: opts.kind, lead, leadApplies: true, options: nonEmpty([first, second]), rollingIgnored };
}

export function drawAdvantage(
  state: DeckState,
  opts: AdvantageOptions,
  shuffle: ShuffleFn = fisherYates
): DeckState {
  const dealer = new Dealer(state.drawPile, state.discardPile, shuffle);
  const active = opts.rules === "fh" ? dealFh(dealer, opts) : dealGh(dealer, opts.kind);
  return settle(state, dealer, active);
}

/** Every card the current draw revealed (lead row and all options). */
export function activeCards(active: ActiveDraw | null): Card[] {
  return active ? active.lead.concat(...active.options) : [];
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
    active: null,
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
    active: null,
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
    active: state.active,
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
    sequences.push(s.active?.options[0] ?? []);
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
    active: state.active,
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
    active: state.active,
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
    active: state.active,
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
    active: state.active,
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
    active: state.active,
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
      active: state.active,
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
    active: state.active,
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
