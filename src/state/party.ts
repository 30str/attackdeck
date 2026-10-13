import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createDebouncedStorage } from "./storage";
import { findClass, buildBaseDeck } from "../data";
import {
  applyPerks,
  makeDeck,
  resetDeck,
  draw,
  drawAdvantage,
  undo,
  reshuffleAll,
  reshuffleDrawPile,
  addBless,
  addCurse,
  removeBless,
  removeCurse,
  addTempCard,
  removeTempCard,
  type ActiveDraw,
  type AdvantageOptions,
  type DeckSnapshot,
  type DeckState,
  type TempCardValue,
} from "../engine/deck";
import type { Card } from "../data/types";

export type Character = {
  id: string;
  name: string;
  classId: string;
  perkCounts: Record<string, number>;
  deck: DeckState;
};

type PartyState = {
  characters: Character[];
  addCharacter: (name: string, classId: string) => string;
  removeCharacter: (id: string) => void;
  renameCharacter: (id: string, name: string) => void;
  togglePerk: (id: string, perkId: string, delta: 1 | -1) => void;
  rebuildDeck: (id: string) => void;
  drawCard: (id: string) => void;
  drawCardAdvantage: (id: string, opts: AdvantageOptions) => void;
  undoDraw: (id: string) => void;
  shuffleAll: (id: string) => void;
  shuffleDrawPile: (id: string) => void;
  blessCharacter: (id: string) => void;
  curseCharacter: (id: string) => void;
  removeBlessFromCharacter: (id: string) => void;
  removeCurseFromCharacter: (id: string) => void;
  addTempToCharacter: (id: string, value: TempCardValue) => void;
  removeTempFromCharacter: (id: string, value: TempCardValue) => void;
};

function newCharacterId(): string {
  return `c-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

// How many undo snapshots survive serialisation. The in-memory stack holds up
// to MAX_HISTORY (100) entries, but persisting all of them makes every single
// mutation re-stringify hundreds of KB of JSON on the JS thread — right when
// the draw animation is starting. Ten steps of undo across an app restart is
// plenty; a live session still gets the full stack.
const PERSISTED_HISTORY = 10;

function deckCards(character: Character) {
  const klass = findClass(character.classId);
  const base = klass?.startingDeck === "base" || !klass ? buildBaseDeck() : klass.startingDeck;
  return applyPerks(base, klass?.perks ?? [], character.perkCounts);
}

function rebuild(character: Character): DeckState {
  return makeDeck(deckCards(character));
}

export const useParty = create<PartyState>()(
  persist(
    (set, get) => ({
      characters: [],

      addCharacter: (name, classId) => {
        const id = newCharacterId();
        const base: Character = {
          id,
          name,
          classId,
          perkCounts: {},
          deck: makeDeck(buildBaseDeck()),
        };
        const rebuilt: Character = { ...base, deck: rebuild(base) };
        set({ characters: [...get().characters, rebuilt] });
        return id;
      },

      removeCharacter: (id) => {
        set({ characters: get().characters.filter((c) => c.id !== id) });
      },

      renameCharacter: (id, name) => {
        set({
          characters: get().characters.map((c) =>
            c.id === id ? { ...c, name } : c
          ),
        });
      },

      togglePerk: (id, perkId, delta) => {
        set({
          characters: get().characters.map((c) => {
            if (c.id !== id) return c;
            const current = c.perkCounts[perkId] ?? 0;
            const next = Math.max(0, current + delta);
            // A no-op toggle (− at zero) must not rebuild: that would silently
            // wipe bless/curse/temp cards, the drawn state and the undo stack.
            if (next === current) return c;
            const perkCounts = { ...c.perkCounts, [perkId]: next };
            const updated: Character = { ...c, perkCounts };
            return { ...updated, deck: rebuild(updated) };
          }),
        });
      },

      // Undoable: perks haven't changed, so the pre-reset history is still
      // valid and an accidental Reset can be walked back.
      rebuildDeck: (id) => {
        set({
          characters: get().characters.map((c) =>
            c.id === id ? { ...c, deck: resetDeck(c.deck, deckCards(c)) } : c
          ),
        });
      },

      drawCard: (id) => {
        set({
          characters: get().characters.map((c) =>
            c.id === id ? { ...c, deck: draw(c.deck) } : c
          ),
        });
      },

      drawCardAdvantage: (id, opts) => {
        set({
          characters: get().characters.map((c) =>
            c.id === id ? { ...c, deck: drawAdvantage(c.deck, opts) } : c
          ),
        });
      },

      undoDraw: (id) => {
        set({
          characters: get().characters.map((c) =>
            c.id === id ? { ...c, deck: undo(c.deck) } : c
          ),
        });
      },

      shuffleAll: (id) => {
        set({
          characters: get().characters.map((c) =>
            c.id === id ? { ...c, deck: reshuffleAll(c.deck) } : c
          ),
        });
      },

      shuffleDrawPile: (id) => {
        set({
          characters: get().characters.map((c) =>
            c.id === id ? { ...c, deck: reshuffleDrawPile(c.deck) } : c
          ),
        });
      },

      blessCharacter: (id) => {
        set({
          characters: get().characters.map((c) =>
            c.id === id ? { ...c, deck: addBless(c.deck) } : c
          ),
        });
      },

      curseCharacter: (id) => {
        set({
          characters: get().characters.map((c) =>
            c.id === id ? { ...c, deck: addCurse(c.deck) } : c
          ),
        });
      },

      removeBlessFromCharacter: (id) => {
        set({
          characters: get().characters.map((c) =>
            c.id === id ? { ...c, deck: removeBless(c.deck) } : c
          ),
        });
      },

      removeCurseFromCharacter: (id) => {
        set({
          characters: get().characters.map((c) =>
            c.id === id ? { ...c, deck: removeCurse(c.deck) } : c
          ),
        });
      },

      addTempToCharacter: (id, value) => {
        set({
          characters: get().characters.map((c) =>
            c.id === id ? { ...c, deck: addTempCard(c.deck, value) } : c
          ),
        });
      },

      removeTempFromCharacter: (id, value) => {
        set({
          characters: get().characters.map((c) =>
            c.id === id ? { ...c, deck: removeTempCard(c.deck, value) } : c
          ),
        });
      },
    }),
    {
      name: "party",
      storage: createDebouncedStorage<{ characters: Character[] }>(),
      version: 3,
      partialize: (state) => ({
        characters: state.characters.map((c) =>
          c.deck.history.length > PERSISTED_HISTORY
            ? { ...c, deck: { ...c.deck, history: c.deck.history.slice(-PERSISTED_HISTORY) } }
            : c
        ),
      }),
      // v0 decks used a single-step `previous` snapshot; v1 uses a `history`
      // stack. Drop the dead field and seed an empty stack so rehydrated decks
      // don't crash pushHistory()/canUndo() on the first action after upgrade.
      // v2 adds `recentDraws` to decks and to every history snapshot.
      // v3 replaces `active: Card[][]` (one sequence per draw) with a
      // structured ActiveDraw, in decks and history snapshots alike.
      migrate: (persisted, version) => {
        const state = persisted as { characters?: Character[] } | undefined;
        if (state?.characters && version < 1) {
          state.characters = state.characters.map((c) => {
            if (!c.deck) return c;
            const { previous, ...deck } = c.deck as DeckState & { previous?: unknown };
            void previous;
            return { ...c, deck: { ...deck, history: deck.history ?? [] } };
          });
        }
        if (state?.characters && version < 2) {
          state.characters = state.characters.map((c) => {
            if (!c.deck) return c;
            return {
              ...c,
              deck: {
                ...c.deck,
                recentDraws: c.deck.recentDraws ?? [],
                history: (c.deck.history ?? []).map((s) => ({
                  ...s,
                  recentDraws: s.recentDraws ?? [],
                })),
              },
            };
          });
        }
        if (state?.characters && version < 3) {
          state.characters = state.characters.map((c) => {
            if (!c.deck) return c;
            return {
              ...c,
              deck: {
                ...migrateActive(c.deck),
                history: (c.deck.history ?? []).map(migrateActive),
              },
            };
          });
        }
        return state as PartyState;
      },
    }
  )
);

// Pre-v3 decks stored the revealed sequences: one for a normal draw, two for
// advantage/disadvantage (which one is no longer known — call it advantage).
function migrateActive<T extends DeckSnapshot>(snap: T): T {
  const old = snap.active as unknown;
  if (!Array.isArray(old)) return snap;
  const options = (old as Card[][]).filter((seq) => seq.length > 0);
  const active: ActiveDraw | null =
    options.length === 0
      ? null
      : {
          kind: options.length > 1 ? "advantage" : "normal",
          lead: [],
          leadApplies: false,
          options,
          rollingIgnored: [],
        };
  return { ...snap, active };
}

export function selectCharacter(id: string | undefined): Character | undefined {
  if (!id) return undefined;
  return useParty.getState().characters.find((c) => c.id === id);
}
