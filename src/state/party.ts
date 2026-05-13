import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { persistStorage } from "./storage";
import { findClass, buildBaseDeck } from "../data";
import {
  applyPerks,
  makeDeck,
  draw,
  drawAdvantage,
  undo,
  reshuffleAll,
  reshuffleDrawPile,
  addBless,
  addCurse,
  type DeckState,
} from "../engine/deck";

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
  togglePerk: (id: string, perkId: string, delta: 1 | -1) => void;
  rebuildDeck: (id: string) => void;
  drawCard: (id: string) => void;
  drawCardAdvantage: (id: string) => void;
  undoDraw: (id: string) => void;
  shuffleAll: (id: string) => void;
  shuffleDrawPile: (id: string) => void;
  blessCharacter: (id: string) => void;
  curseCharacter: (id: string) => void;
};

function newCharacterId(): string {
  return `c-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

function rebuild(character: Character): DeckState {
  const klass = findClass(character.classId);
  const base = klass?.startingDeck === "base" || !klass ? buildBaseDeck() : klass.startingDeck;
  const cards = applyPerks(base, klass?.perks ?? [], character.perkCounts);
  return makeDeck(cards);
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

      togglePerk: (id, perkId, delta) => {
        set({
          characters: get().characters.map((c) => {
            if (c.id !== id) return c;
            const current = c.perkCounts[perkId] ?? 0;
            const next = Math.max(0, current + delta);
            const perkCounts = { ...c.perkCounts, [perkId]: next };
            const updated: Character = { ...c, perkCounts };
            return { ...updated, deck: rebuild(updated) };
          }),
        });
      },

      rebuildDeck: (id) => {
        set({
          characters: get().characters.map((c) =>
            c.id === id ? { ...c, deck: rebuild(c) } : c
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

      drawCardAdvantage: (id) => {
        set({
          characters: get().characters.map((c) =>
            c.id === id ? { ...c, deck: drawAdvantage(c.deck) } : c
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
    }),
    {
      name: "party",
      storage: createJSONStorage(() => persistStorage),
    }
  )
);

export function selectCharacter(id: string | undefined): Character | undefined {
  if (!id) return undefined;
  return useParty.getState().characters.find((c) => c.id === id);
}
