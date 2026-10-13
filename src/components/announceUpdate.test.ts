import { describe, it, expect } from "vitest";
import { shouldAnnounceUpdate } from "./announceUpdate";

describe("shouldAnnounceUpdate", () => {
  const ota = { updateId: "u2", isEmbeddedLaunch: false };

  it("announces an OTA update the device hasn't seen", () => {
    expect(shouldAnnounceUpdate(ota, "u1")).toBe(true);
    // First launch since this feature shipped: nothing recorded yet.
    expect(shouldAnnounceUpdate(ota, null)).toBe(true);
  });

  it("stays quiet on later launches of the same update", () => {
    expect(shouldAnnounceUpdate(ota, "u2")).toBe(false);
  });

  it("stays quiet for the embedded bundle and when updates are disabled", () => {
    expect(shouldAnnounceUpdate({ updateId: "e1", isEmbeddedLaunch: true }, "u1")).toBe(false);
    expect(shouldAnnounceUpdate({ updateId: null, isEmbeddedLaunch: true }, null)).toBe(false);
  });
});
