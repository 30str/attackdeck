import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { persistStorage } from "./storage";
import type { SupportedLocale } from "../i18n";

type SettingsState = {
  hapticsEnabled: boolean;
  setHapticsEnabled: (v: boolean) => void;
  unlockedClasses: string[];
  unlock: (classId: string) => void;
  relock: (classId: string) => void;
  relockAll: () => void;
  unlockAll: (ids: string[]) => void;
  /** null means follow device locale */
  languageOverride: SupportedLocale | null;
  setLanguage: (locale: SupportedLocale | null) => void;
};

export const useSettings = create<SettingsState>()(
  persist(
    (set, get) => ({
      hapticsEnabled: true,
      setHapticsEnabled: (v) => set({ hapticsEnabled: v }),
      unlockedClasses: [],
      unlock: (classId) => {
        if (get().unlockedClasses.includes(classId)) return;
        set({ unlockedClasses: [...get().unlockedClasses, classId] });
      },
      relock: (classId) => {
        set({ unlockedClasses: get().unlockedClasses.filter((id) => id !== classId) });
      },
      relockAll: () => set({ unlockedClasses: [] }),
      unlockAll: (ids) => set({ unlockedClasses: ids }),
      languageOverride: null,
      setLanguage: (locale) => set({ languageOverride: locale }),
    }),
    {
      name: "settings",
      storage: createJSONStorage(() => persistStorage),
    }
  )
);

export function isUnlocked(state: SettingsState, classId: string): boolean {
  return state.unlockedClasses.includes(classId);
}
