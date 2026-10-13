import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createDebouncedStorage } from "./storage";
import type { SupportedLocale } from "../i18n";
import type { AdvantageRules } from "../engine/deck";
import type { RulesVariant } from "../data/types";

/** "auto" follows each class's game: Frosthaven classes use the Frosthaven
 * (and Gloomhaven 2nd edition) procedure, everything else the original one. */
export type AdvantageRulesSetting = "auto" | AdvantageRules;

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
  advantageRules: AdvantageRulesSetting;
  setAdvantageRules: (v: AdvantageRulesSetting) => void;
  /** Frosthaven rules only — see AdvantageOptions.rollingHouseRule. */
  rollingHouseRule: boolean;
  setRollingHouseRule: (v: boolean) => void;
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
      advantageRules: "auto",
      setAdvantageRules: (v) => set({ advantageRules: v }),
      rollingHouseRule: false,
      setRollingHouseRule: (v) => set({ rollingHouseRule: v }),
    }),
    {
      name: "settings",
      storage: createDebouncedStorage<SettingsState>(),
    }
  )
);

export function isUnlocked(state: SettingsState, classId: string): boolean {
  return state.unlockedClasses.includes(classId);
}

export function resolveAdvantageRules(
  setting: AdvantageRulesSetting,
  classVariant: RulesVariant | undefined
): AdvantageRules {
  if (setting !== "auto") return setting;
  return classVariant === "fh" ? "fh" : "gh";
}
