// Pure decision for the "updated" toast: no expo-updates import, so it can be
// unit-tested.

export type RunningUpdate = {
  /** Updates.updateId — null when expo-updates is disabled (dev, web). */
  updateId: string | null;
  /** Updates.isEmbeddedLaunch — running the bundle shipped in the binary. */
  isEmbeddedLaunch: boolean;
};

/** True on the first launch of a downloaded (OTA) update this device hasn't
 * announced yet. A store install or binary upgrade runs the embedded bundle,
 * which isn't an OTA, so it stays quiet. */
export function shouldAnnounceUpdate(running: RunningUpdate, lastSeenUpdateId: string | null): boolean {
  if (!running.updateId || running.isEmbeddedLaunch) return false;
  return running.updateId !== lastSeenUpdateId;
}
