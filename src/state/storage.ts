import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState } from "react-native";
import type { PersistStorage, StorageValue } from "zustand/middleware";

// Debounced persistence. zustand's createJSONStorage stringifies the whole
// store synchronously inside every set() — for the party store that's ~100KB+
// of deck history landing on the same frame as the draw animation. This
// adapter receives the raw state object instead, so both the stringify and
// the AsyncStorage write are deferred until the UI has settled. State objects
// are immutable (every set() builds new ones), so holding a reference until
// the flush is safe.
const FLUSH_DELAY_MS = 400;

type Pending = { value: StorageValue<unknown>; timer: ReturnType<typeof setTimeout> };
const pending = new Map<string, Pending>();

function flush(name: string): Promise<void> {
  const entry = pending.get(name);
  if (!entry) return Promise.resolve();
  clearTimeout(entry.timer);
  pending.delete(name);
  return AsyncStorage.setItem(name, JSON.stringify(entry.value)).catch(() => {});
}

/** Write every pending value now — before anything that tears down the JS
 * runtime without backgrounding the app (an OTA reload). */
export function flushAll(): Promise<void> {
  return Promise.all(Array.from(pending.keys()).map(flush)).then(() => {});
}

// A backgrounded app can be killed by the OS at any time — flush immediately
// rather than waiting out the debounce. Covers "background" and "inactive"
// (iOS app switcher); on web this maps to page visibility.
AppState.addEventListener("change", (state) => {
  if (state !== "active") {
    for (const name of Array.from(pending.keys())) flush(name);
  }
});

export function createDebouncedStorage<S>(): PersistStorage<S> {
  return {
    getItem: async (name) => {
      // Serve an unflushed write if one exists so a re-hydration (e.g. dev
      // fast refresh) never reverts to the older on-disk value.
      const entry = pending.get(name);
      if (entry) return entry.value as StorageValue<S>;
      const raw = await AsyncStorage.getItem(name);
      return raw ? (JSON.parse(raw) as StorageValue<S>) : null;
    },
    setItem: (name, value) => {
      const prev = pending.get(name);
      if (prev) clearTimeout(prev.timer);
      pending.set(name, {
        value: value as StorageValue<unknown>,
        timer: setTimeout(() => flush(name), FLUSH_DELAY_MS),
      });
    },
    removeItem: (name) => {
      const prev = pending.get(name);
      if (prev) {
        clearTimeout(prev.timer);
        pending.delete(name);
      }
      return AsyncStorage.removeItem(name);
    },
  };
}
