/*
 * Generates TypeScript class files for Crimson Scales (cs) and CCUG (ccug)
 * fan-expansion classes from Gloomhaven Secretariat JSONs.
 *
 * Run with: npx tsx scripts/generate-fan-classes.ts
 *
 * Writes to src/data/classes/<edition>-<kebab>.ts. Existing files are
 * overwritten. Outputs a register-snippet for src/data/index.ts at the end.
 */

import { writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const GHS_BASE =
  "https://raw.githubusercontent.com/Lurkars/gloomhavensecretariat/master";

type GhsEffect = {
  type: string;
  value?: string | number | boolean;
  effects?: GhsEffect[];
  hint?: string;
  icon?: boolean;
};

type GhsAttackModifier = {
  type: string;
  value?: number | string;
  rolling?: boolean;
  effects?: GhsEffect[];
};

type GhsCard = {
  count: number;
  attackModifier?: GhsAttackModifier;
};

type GhsPerk = {
  type: "add" | "remove" | "replace" | "custom";
  count: number;
  cards?: GhsCard[];
  custom?: string;
  combined?: boolean;
};

type GhsCharacter = {
  name: string;
  edition: string;
  perks: GhsPerk[];
};

type Source = {
  game: "cs" | "ccug";
  file: string;
  id: string; // attackdeck class id
  name: string; // canonical display name
  iconRef: string; // GHS icon slug (= file name in our convention)
  rulesVariant: "gh" | "fh";
  codeName?: string; // for unlockables, the GHS icon name
};

// CS classes — main 11 + 3 add-ons ("Mercenaries").
// Skipping toolstwo (Mirefoot variant — already covered by `tools`).
const SOURCES: Source[] = [
  // === Crimson Scales main (11) ===
  // Mapping derived from the Crimson Scales site and GHS class metadata.
  { game: "cs", file: "beetle", id: "cs-hierophant", name: "Hierophant", iconRef: "beetle", rulesVariant: "gh", codeName: "Beetle" },
  { game: "cs", file: "bleeding-claw", id: "cs-spirit-caller", name: "Spirit Caller", iconRef: "bleeding-claw", rulesVariant: "gh", codeName: "Bleeding Claw" },
  { game: "cs", file: "chain-helmet", id: "cs-chainguard", name: "Chainguard", iconRef: "chain-helmet", rulesVariant: "gh", codeName: "Chain Helmet" },
  { game: "cs", file: "crescent-sun", id: "cs-luminary", name: "Luminary", iconRef: "crescent-sun", rulesVariant: "gh", codeName: "Crescent Sun" },
  { game: "cs", file: "flask", id: "cs-brightspark", name: "Brightspark", iconRef: "flask", rulesVariant: "gh", codeName: "Flask" },
  { game: "cs", file: "galaxy", id: "cs-starslinger", name: "Starslinger", iconRef: "galaxy", rulesVariant: "gh", codeName: "Galaxy" },
  { game: "cs", file: "ladder-axe", id: "cs-chieftain", name: "Chieftain", iconRef: "ladder-axe", rulesVariant: "gh", codeName: "Ladder Axe" },
  { game: "cs", file: "leaf", id: "cs-hollowpact", name: "Hollowpact", iconRef: "leaf", rulesVariant: "gh", codeName: "Leaf" },
  { game: "cs", file: "skull", id: "cs-bombard", name: "Bombard", iconRef: "skull", rulesVariant: "gh", codeName: "Skull" },
  { game: "cs", file: "target", id: "cs-fire-knight", name: "Fire Knight", iconRef: "target", rulesVariant: "gh", codeName: "Target" },
  { game: "cs", file: "tools", id: "cs-mirefoot", name: "Mirefoot", iconRef: "tools", rulesVariant: "gh", codeName: "Tools" },

  // === Crimson Scales add-ons / "Mercenaries" (3) ===
  { game: "cs", file: "sprig", id: "cs-amber-aegis", name: "Amber Aegis", iconRef: "sprig", rulesVariant: "gh", codeName: "Sprig" },
  { game: "cs", file: "tusks", id: "cs-ruinmaw", name: "Ruinmaw", iconRef: "tusks", rulesVariant: "gh", codeName: "Tusks" },
  { game: "cs", file: "vortex", id: "cs-artificer", name: "Artificer", iconRef: "vortex", rulesVariant: "gh", codeName: "Vortex" },

  // === CCUG (20) ===
  // CCUG classes don't have separate codenames vs canonical names — they ship
  // under their slug-based names. Title-case the slug for display.
  { game: "ccug", file: "alchemancer", id: "ccug-alchemancer", name: "Alchemancer", iconRef: "alchemancer", rulesVariant: "gh" },
  { game: "ccug", file: "core", id: "ccug-core", name: "Core", iconRef: "core", rulesVariant: "gh" },
  { game: "ccug", file: "dome", id: "ccug-dome", name: "Dome", iconRef: "dome", rulesVariant: "gh" },
  { game: "ccug", file: "echowight", id: "ccug-echowight", name: "Echowight", iconRef: "echowight", rulesVariant: "gh" },
  { game: "ccug", file: "frostborn", id: "ccug-frostborn", name: "Frostborn", iconRef: "frostborn", rulesVariant: "fh" },
  { game: "ccug", file: "glacialtorrent", id: "ccug-glacial-torrent", name: "Glacial Torrent", iconRef: "glacialtorrent", rulesVariant: "fh" },
  { game: "ccug", file: "jestertwins", id: "ccug-jester-twins", name: "Jester Twins", iconRef: "jestertwins", rulesVariant: "gh" },
  { game: "ccug", file: "lifespeaker", id: "ccug-lifespeaker", name: "Lifespeaker", iconRef: "lifespeaker", rulesVariant: "gh" },
  { game: "ccug", file: "lightracer", id: "ccug-lightracer", name: "Lightracer", iconRef: "lightracer", rulesVariant: "gh" },
  { game: "ccug", file: "powdercoat", id: "ccug-powdercoat", name: "Powdercoat", iconRef: "powdercoat", rulesVariant: "gh" },
  { game: "ccug", file: "progenitor", id: "ccug-progenitor", name: "Progenitor", iconRef: "progenitor", rulesVariant: "fh" },
  { game: "ccug", file: "reeftender", id: "ccug-reeftender", name: "Reeftender", iconRef: "reeftender", rulesVariant: "gh" },
  { game: "ccug", file: "rekindled", id: "ccug-rekindled", name: "Rekindled", iconRef: "rekindled", rulesVariant: "gh" },
  { game: "ccug", file: "rootwhisperer", id: "ccug-rootwhisperer", name: "Rootwhisperer", iconRef: "rootwhisperer", rulesVariant: "gh" },
  { game: "ccug", file: "skitterclaw", id: "ccug-skitterclaw", name: "Skitterclaw", iconRef: "skitterclaw", rulesVariant: "gh" },
  { game: "ccug", file: "swarmshift", id: "ccug-swarmshift", name: "Swarmshift", iconRef: "swarmshift", rulesVariant: "gh" },
  { game: "ccug", file: "veilpiercer", id: "ccug-veilpiercer", name: "Veilpiercer", iconRef: "veilpiercer", rulesVariant: "gh" },
  { game: "ccug", file: "vimthreader", id: "ccug-vimthreader", name: "Vimthreader", iconRef: "vimthreader", rulesVariant: "gh" },
  { game: "ccug", file: "wildborn", id: "ccug-wildborn", name: "Wildborn", iconRef: "wildborn", rulesVariant: "gh" },
  { game: "ccug", file: "woebound", id: "ccug-woebound", name: "Woebound", iconRef: "woebound", rulesVariant: "fh" },
];

const fetchCache = new Map<string, unknown>();
async function fetchJson(url: string): Promise<unknown> {
  if (fetchCache.has(url)) return fetchCache.get(url);
  const res = await fetch(url);
  if (!res.ok) {
    fetchCache.set(url, null);
    return null;
  }
  const json = await res.json();
  fetchCache.set(url, json);
  return json;
}

function getPath(obj: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (o, k) =>
        o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined,
      obj
    );
}

function normaliseVocab(v: unknown): string | null {
  if (typeof v === "string") return v;
  if (v && typeof v === "object") {
    const empty = (v as Record<string, unknown>)[""];
    if (typeof empty === "string") return empty;
  }
  return null;
}

function deepMerge(
  a: Record<string, unknown>,
  b: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...a };
  for (const [k, v] of Object.entries(b)) {
    if (
      v &&
      typeof v === "object" &&
      !Array.isArray(v) &&
      out[k] &&
      typeof out[k] === "object" &&
      !Array.isArray(out[k])
    ) {
      out[k] = deepMerge(out[k] as Record<string, unknown>, v as Record<string, unknown>);
    } else {
      out[k] = v;
    }
  }
  return out;
}

type Labels = {
  master: Record<string, unknown>;
  gameLabels: Record<string, unknown>;
};

async function loadLabels(game: string): Promise<Labels> {
  const [master, main, spoiler] = await Promise.all([
    fetchJson(`${GHS_BASE}/src/assets/locales/en.json`),
    fetchJson(`${GHS_BASE}/data/${game}/label/en.json`),
    fetchJson(`${GHS_BASE}/data/${game}/label/spoiler/en.json`),
  ]);
  return {
    master: (master ?? {}) as Record<string, unknown>,
    gameLabels: deepMerge(
      (main ?? {}) as Record<string, unknown>,
      (spoiler ?? {}) as Record<string, unknown>
    ),
  };
}

function resolveText(text: string | undefined, labels: Labels): string | null {
  if (!text) return null;
  let cur = text;
  for (let i = 0; i < 5; i++) {
    const next = cur.replace(/%([^%]+)%/g, (match, inner: string) => {
      const colonIdx = inner.indexOf(":");
      const fullPath = colonIdx >= 0 ? inner.slice(0, colonIdx) : inner;
      const suffix = colonIdx >= 0 ? inner.slice(colonIdx + 1) : "";

      let val: unknown;
      if (fullPath.startsWith("game.")) {
        val = getPath(labels.master, fullPath.slice("game.".length));
        if (val === undefined) val = getPath(labels.master, fullPath);
      } else if (fullPath.startsWith("data.")) {
        val = getPath(labels.gameLabels, fullPath.slice("data.".length));
        if (val === undefined) val = getPath(labels.gameLabels, fullPath);
      } else {
        val = getPath(labels.master, fullPath);
      }
      const name = normaliseVocab(val);
      if (name == null) return match;
      return suffix ? `${name} ${suffix}` : name;
    });
    if (next === cur) break;
    cur = next;
  }
  return cur
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/%[^%]+%/g, "")
    .replace(/\{[0-9]+\}/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .replace(/([,;])\s*([,;])/g, "$1")
    .replace(/[,;:]\s*$/g, "")
    .trim();
}

/** Resolve any string that might contain GHS placeholders or be a flag word.
 *  When `kind` is provided, bare strings are also looked up under
 *  `game.<kind>.<value>` in the master locale (e.g. `game.specialTarget.self`
 *  → "Self"). Returns null if the resolved string is empty after cleanup. */
function maybeResolve(
  v: unknown,
  labels: Labels,
  kind?: "specialTarget"
): string | null {
  if (typeof v !== "string") return null;
  if (v.includes("%")) {
    const out = resolveText(v, labels);
    return out && out.length > 0 ? out : null;
  }
  if (kind) {
    // GHS bare strings may carry a `:N` suffix as an argument (e.g.
    // "allyAffectRange:2"). Split it off before the lookup.
    const colonIdx = v.indexOf(":");
    const key = colonIdx >= 0 ? v.slice(0, colonIdx) : v;
    const suffix = colonIdx >= 0 ? v.slice(colonIdx + 1) : "";

    const namespaced =
      normaliseVocab(getPath(labels.master, `game.${kind}.${key}`)) ??
      normaliseVocab(getPath(labels.master, `${kind}.${key}`));
    if (namespaced) {
      // The looked-up value may itself contain GHS placeholders (e.g.
      // "%game.target% 2 allies"). Resolve them recursively.
      const resolved = resolveText(namespaced, labels) ?? namespaced;
      return suffix ? `${resolved} ${suffix}` : resolved;
    }
  }
  return v;
}

// ============ GHS → attackdeck card mapping ============

// Our Effect union (kept in sync with src/data/types.ts).
const KNOWN_EFFECTS = new Set([
  "fire", "ice", "earth", "air", "light", "dark", "wild",
  "wound", "poison", "immobilize", "stun", "muddle", "disarm",
  "curse", "bless", "invisible", "push", "pull", "pierce", "target",
  "advantage", "refresh-item", "refresh-spent", "regenerate",
  "heal", "shield", "retaliate", "swing", "brittle", "ward",
  "strengthen", "impair", "bane", "chill", "dodge", "safeguard",
  "custom",
]);

/** Returns { value: CardValue, isPlusX: boolean } from a GHS attackModifier. */
function mapValue(mod: GhsAttackModifier): { value: number | "x2" | null; isPlusX: boolean } {
  const t = mod.type;
  if (t === "double") return { value: "x2", isPlusX: false };
  if (t === "plusX") return { value: 0, isPlusX: true };
  if (t === "minus2") return { value: -2, isPlusX: false };
  if (t === "minus1") return { value: -1, isPlusX: false };
  if (t === "plus0") return { value: 0, isPlusX: false };
  if (t === "plus1") return { value: 1, isPlusX: false };
  if (t === "plus2") return { value: 2, isPlusX: false };
  if (t === "plus3") return { value: 3, isPlusX: false };
  if (t === "plus4") return { value: 4, isPlusX: false };
  // "minus"/"plus" with separate numeric value for non-standard amounts.
  if (t === "minus" && typeof mod.value === "number") return { value: -mod.value, isPlusX: false };
  if (t === "plus" && typeof mod.value === "number") return { value: mod.value, isPlusX: false };
  // "plus"/"minus" with value:"X" — variable amount (rendered as +X/-X).
  if ((t === "plus" || t === "minus") && mod.value === "X") return { value: 0, isPlusX: true };
  return { value: null, isPlusX: false };
}

function valueLabel(v: number | "x2", isPlusX: boolean): string {
  if (v === "x2") return "×2";
  if (isPlusX) return "+X";
  if (v > 0) return `+${v}`;
  if (v === 0) return "+0";
  return String(v);
}

/** Walk attackModifier.effects → list of our Effect tags plus description fragments.
 *  trailingHints holds the resolved-from-GHS hint text for custom effects,
 *  which the caller surfaces after the perk's mechanical description so the
 *  card label stays compact (just `★`).
 */
function mapEffects(effs: GhsEffect[] | undefined, labels: Labels): {
  tags: string[];
  descFragments: string[];
  trailingHints: string[];
} {
  const tags: string[] = [];
  const descFragments: string[] = [];
  const trailingHints: string[] = [];
  if (!effs) return { tags, descFragments, trailingHints };

  for (const e of effs) {
    switch (e.type) {
      case "condition": {
        const v = String(e.value);
        if (KNOWN_EFFECTS.has(v)) tags.push(v);
        else tags.push("custom");
        const subRange = (e.effects ?? []).find((s) => s.type === "range");
        const subTarget = (e.effects ?? []).find((s) => s.type === "specialTarget");
        let frag = capitalise(v);
        if (subRange) {
          const rt = maybeResolve(subRange.value, labels) ?? String(subRange.value);
          frag += ` (range ${rt})`;
        }
        if (subTarget) {
          const tt = maybeResolve(subTarget.value, labels, "specialTarget");
          if (tt) frag += ` (${tt})`;
        }
        descFragments.push(frag);
        break;
      }
      case "element": {
        const v = String(e.value);
        if (KNOWN_EFFECTS.has(v)) tags.push(v);
        else tags.push("custom");
        descFragments.push(v.toUpperCase());
        break;
      }
      case "elementHalf": {
        // "fire|ice" → both tags, described as "FIRE/ICE (half-element)"
        const parts = String(e.value).split("|");
        for (const p of parts) {
          if (KNOWN_EFFECTS.has(p)) tags.push(p);
          else tags.push("custom");
        }
        descFragments.push(`${parts.map((p) => p.toUpperCase()).join("/")} (half-element)`);
        break;
      }
      case "elementConsume": {
        // Consume an element to gain something else. Represent as custom.
        tags.push("custom");
        const v = String(e.value).toUpperCase();
        const inner = mapEffects(e.effects, labels);
        descFragments.push("★");
        const innerHint = [...inner.descFragments, ...inner.trailingHints]
          .filter((s) => s && s !== "★")
          .join("; ");
        trailingHints.push(`consume ${v}${innerHint ? `: ${innerHint}` : ""}`);
        break;
      }
      case "heal":
      case "shield":
      case "invisible":
      case "advantage":
      case "strengthen":
      case "regenerate":
      case "ward":
      case "brittle":
      case "impair":
      case "bane":
      case "chill":
      case "dodge":
      case "safeguard": {
        tags.push(e.type);
        const subTarget = (e.effects ?? []).find((s) => s.type === "specialTarget");
        const targetText = subTarget
          ? maybeResolve(subTarget.value, labels, "specialTarget")
          : null;
        const targets = targetText ? ` (${targetText})` : "";
        const valuePart = e.type === "heal" || e.type === "shield" ? ` ${e.value ?? 1}` : "";
        descFragments.push(`${capitalise(e.type)}${valuePart}${targets}`);
        break;
      }
      case "retaliate": {
        tags.push("retaliate");
        const subRange = (e.effects ?? []).find((s) => s.type === "range");
        const rangeText = subRange ? maybeResolve(subRange.value, labels) ?? String(subRange.value) : null;
        descFragments.push(`Retaliate ${e.value ?? 1}${rangeText ? ` (range ${rangeText})` : ""}`);
        break;
      }
      case "push":
        tags.push("push");
        descFragments.push(`Push ${e.value ?? 1}`);
        break;
      case "pull":
        tags.push("pull");
        descFragments.push(`Pull ${e.value ?? 1}`);
        break;
      case "pierce":
        tags.push("pierce");
        descFragments.push(`Pierce ${e.value ?? 1}`);
        break;
      case "swing":
        tags.push("swing");
        descFragments.push(`Swing ${e.value ?? 1}`);
        break;
      case "target":
        tags.push("target");
        descFragments.push(`Target ${e.value ?? 2}`);
        break;
      case "refresh-item":
      case "refreshItem":
        tags.push("refresh-item");
        descFragments.push("Refresh item");
        break;
      case "refresh-spent":
      case "refreshSpent":
        tags.push("refresh-spent");
        descFragments.push("Refresh spent");
        break;
      case "custom": {
        tags.push("custom");
        descFragments.push("★");
        const resolved = resolveText(
          e.hint ?? (typeof e.value === "string" ? e.value : undefined),
          labels
        );
        if (resolved) trailingHints.push(resolved);
        break;
      }
      case "range":
      case "specialTarget":
        // Handled as sub-effects by parents above; skip here.
        break;
      case "required": {
        // GHS uses {type:"required", effects:[...]} as a conditional wrapper:
        // the listed inner effects are prerequisites for the parent attack
        // modifier's bonus. Render inner effects as a "requires: X, Y" hint
        // so the player knows what's needed; don't double-tag the parent.
        const inner = mapEffects(e.effects, labels);
        const innerHints = [...inner.descFragments, ...inner.trailingHints]
          .filter((s) => s && s !== "★")
          .join(", ");
        if (innerHints) trailingHints.push(`requires ${innerHints}`);
        break;
      }
      case "changeType": {
        // GHS: this attack modifier transforms into a different modifier
        // when triggered (e.g. plus0 → plus3). Render as a transformation
        // hint. The inner effects describe the resulting modifier.
        const inner = mapEffects(e.effects, labels);
        const innerText = [...inner.descFragments, ...inner.trailingHints]
          .filter((s) => s && s !== "★")
          .join(" ");
        descFragments.push("★");
        tags.push("custom");
        if (innerText) trailingHints.push(`transforms to ${innerText}`);
        break;
      }
      default: {
        // Unknown GHS effect — emit ★ but skip the bare type name (rarely
        // makes for readable English).
        tags.push("custom");
        descFragments.push("★");
      }
    }
  }
  // De-dup tags
  const seen = new Set<string>();
  const dedup: string[] = [];
  for (const t of tags) {
    if (!seen.has(t)) {
      seen.add(t);
      dedup.push(t);
    }
  }
  return { tags: dedup, descFragments, trailingHints };
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function pluralCard(n: number): string {
  return n === 1 ? "card" : "cards";
}

function countWord(n: number): string {
  if (n === 1) return "one";
  if (n === 2) return "two";
  if (n === 3) return "three";
  if (n === 4) return "four";
  if (n === 5) return "five";
  return String(n);
}

function describeCard(card: GhsCard, labels: Labels): {
  text: string;
  trailingHints: string[];
} {
  if (!card.attackModifier) return { text: "?", trailingHints: [] };
  const mod = card.attackModifier;
  const { value, isPlusX } = mapValue(mod);
  if (value === null) return { text: mod.type, trailingHints: [] };
  const valLabel = valueLabel(value, isPlusX);
  const rolling = mod.rolling ? "rolling " : "";
  const { descFragments, trailingHints } = mapEffects(mod.effects, labels);
  const fragStr = descFragments.length > 0 ? ` ${descFragments.join(" ")}` : "";
  return { text: `${rolling}${valLabel}${fragStr}`, trailingHints };
}

function joinCard(card: GhsCard, labels: Labels): {
  phrase: string;
  trailingHints: string[];
} {
  const { text, trailingHints } = describeCard(card, labels);
  return {
    phrase: `${countWord(card.count)} ${text} ${pluralCard(card.count)}`,
    trailingHints,
  };
}

function describePerk(perk: GhsPerk, labels: Labels): string {
  const customHint = resolveText(perk.custom, labels);

  if (perk.type === "custom") {
    return customHint ?? "Class-specific perk — see rulebook";
  }
  if (!perk.cards || perk.cards.length === 0) {
    return customHint ?? "Class-specific perk";
  }

  const collected: string[] = [];
  let base: string;

  // For type=replace, GHS lists the "remove" card first, then the "add" cards.
  if (perk.type === "replace" && perk.cards.length >= 2) {
    const fromJoined = joinCard(perk.cards[0], labels);
    const toJoined = perk.cards.slice(1).map((c) => joinCard(c, labels));
    collected.push(...fromJoined.trailingHints);
    for (const t of toJoined) collected.push(...t.trailingHints);
    base = `Replace ${fromJoined.phrase} with ${toJoined.map((t) => t.phrase).join(" and ")}`;
  } else if (perk.type === "add") {
    const joined = perk.cards.map((c) => joinCard(c, labels));
    for (const j of joined) collected.push(...j.trailingHints);
    base = `Add ${joined.map((j) => j.phrase).join(" and ")}`;
  } else if (perk.type === "remove") {
    const joined = perk.cards.map((c) => joinCard(c, labels));
    for (const j of joined) collected.push(...j.trailingHints);
    base = `Remove ${joined.map((j) => j.phrase).join(" and ")}`;
  } else {
    return customHint ?? "?";
  }

  // Append custom perk-level hint first, then per-card hints. De-dup.
  const allHints: string[] = [];
  const seen = new Set<string>();
  if (customHint) {
    allHints.push(customHint);
    seen.add(customHint);
  }
  for (const h of collected) {
    if (h && !seen.has(h)) {
      allHints.push(h);
      seen.add(h);
    }
  }
  return allHints.length > 0 ? `${base} — ${allHints.join("; ")}` : base;
}

// ============ Code generation ============

function camelId(id: string): string {
  return id
    .split("-")
    .map((seg, i) => (i === 0 ? seg : capitalise(seg)))
    .join("");
}

function cardCall(card: GhsCard, labels: Labels): string {
  if (!card.attackModifier) return "card(0)";
  const mod = card.attackModifier;
  const { value, isPlusX } = mapValue(mod);
  const v = value === null ? 0 : value;
  const { tags } = mapEffects(mod.effects, labels);

  // plusX is represented as +0 with a "custom" tag annotated in the description.
  const useTags = isPlusX ? Array.from(new Set([...tags, "custom"])) : tags;

  const args: string[] = [JSON.stringify(v)];
  if (mod.rolling || useTags.length > 0) {
    args.push(String(!!mod.rolling));
  }
  for (const t of useTags) {
    args.push(JSON.stringify(t));
  }
  return `card(${args.join(", ")})`;
}

function quoteDescription(s: string): string {
  // Use double-quoted string with escapes; nested double quotes in the
  // resolved hint are rare but possible. JSON.stringify is safest.
  return JSON.stringify(s);
}

function perkLine(perkIndex: number, perk: GhsPerk, labels: Labels): {
  helper: string;
  line: string;
} {
  const id = `p${String(perkIndex + 1).padStart(2, "0")}`;
  const desc = describePerk(perk, labels);
  const descLit = quoteDescription(desc);

  if (perk.type === "custom" || !perk.cards || perk.cards.length === 0) {
    return {
      helper: "note",
      line: `    note(${JSON.stringify(id)}, ${perk.count}, ${descLit}),`,
    };
  }

  if (perk.type === "remove") {
    if (perk.cards.length === 1) {
      const c = perk.cards[0];
      return {
        helper: "remove",
        line: `    remove(${JSON.stringify(id)}, ${perk.count}, ${c.count}, ${cardCall(c, labels)}, ${descLit}),`,
      };
    }
    const ops = perk.cards
      .map((c) => `{ op: "remove", card: ${cardCall(c, labels)}, count: ${c.count} }`)
      .join(", ");
    return {
      helper: "multi",
      line: `    multi(${JSON.stringify(id)}, ${perk.count}, ${descLit}, ${ops}),`,
    };
  }

  if (perk.type === "add") {
    if (perk.cards.length === 1) {
      const c = perk.cards[0];
      return {
        helper: "add",
        line: `    add(${JSON.stringify(id)}, ${perk.count}, ${c.count}, ${cardCall(c, labels)}, ${descLit}),`,
      };
    }
    const ops = perk.cards
      .map((c) => `{ op: "add", card: ${cardCall(c, labels)}, count: ${c.count} }`)
      .join(", ");
    return {
      helper: "multi",
      line: `    multi(${JSON.stringify(id)}, ${perk.count}, ${descLit}, ${ops}),`,
    };
  }

  if (perk.type === "replace") {
    // Simple case: 1 remove + 1 add. GHS lists remove first, then add cards.
    if (perk.cards.length === 2) {
      const from = perk.cards[0];
      const to = perk.cards[1];
      return {
        helper: "replace",
        line: `    replace(${JSON.stringify(id)}, ${perk.count}, ${from.count}, ${cardCall(from, labels)}, ${to.count}, ${cardCall(to, labels)}, ${descLit}),`,
      };
    }
    // Complex multi-add or multi-remove case — emit `multi` with explicit ops.
    // Heuristic: first card is the remove; the rest are adds.
    const [from, ...rest] = perk.cards;
    const ops: string[] = [
      `{ op: "remove", card: ${cardCall(from, labels)}, count: ${from.count} }`,
      ...rest.map((c) => `{ op: "add", card: ${cardCall(c, labels)}, count: ${c.count} }`),
    ];
    return {
      helper: "multi",
      line: `    multi(${JSON.stringify(id)}, ${perk.count}, ${descLit}, ${ops.join(", ")}),`,
    };
  }

  return {
    helper: "note",
    line: `    note(${JSON.stringify(id)}, ${perk.count}, ${descLit}),`,
  };
}

function gameForEdition(edition: "cs" | "ccug"): string {
  return edition === "cs" ? "crimson-scales" : "ccug";
}

function generateFile(source: Source, char: GhsCharacter, labels: Labels): string {
  const helpers = new Set<string>();
  const perkLines: string[] = [];
  for (let i = 0; i < char.perks.length; i++) {
    const { helper, line } = perkLine(i, char.perks[i], labels);
    helpers.add(helper);
    perkLines.push(line);
  }

  const helperImport = ["add", "card", "multi", "note", "remove", "replace"]
    .filter((h) => helpers.has(h) || h === "card")
    .join(", ");

  const codeNameField = source.codeName ? `\n  codeName: ${JSON.stringify(source.codeName)},` : "";

  return `import type { ClassDef } from "../types";
import { ${helperImport} } from "../_perkHelpers";

// Source: github.com/Lurkars/gloomhavensecretariat data/${source.game}/character/${source.file}.json
// Auto-generated by scripts/generate-fan-classes.ts. Custom-perk descriptions
// resolved against GHS's en labels where possible; ★ in card art means the
// effect is fan-expansion specific — see the perk description for the rule.

export const ${camelId(source.id)}: ClassDef = {
  id: ${JSON.stringify(source.id)},
  game: ${JSON.stringify(gameForEdition(source.game))},
  name: ${JSON.stringify(source.name)},${codeNameField}
  iconRef: ${JSON.stringify(source.iconRef)},
  rulesVariant: ${JSON.stringify(source.rulesVariant)},
  startingDeck: "base",
  perks: [
${perkLines.join("\n")}
  ],
};
`;
}

async function main() {
  const labelsCache = new Map<string, Labels>();
  async function getLabels(game: string): Promise<Labels> {
    if (labelsCache.has(game)) return labelsCache.get(game)!;
    const l = await loadLabels(game);
    labelsCache.set(game, l);
    return l;
  }

  const outDir = join(__dirname, "..", "src", "data", "classes");
  await mkdir(outDir, { recursive: true });

  const generated: { id: string; camel: string; file: string }[] = [];

  for (const source of SOURCES) {
    const char = (await fetchJson(
      `${GHS_BASE}/data/${source.game}/character/${source.file}.json`
    )) as GhsCharacter | null;
    if (!char) {
      console.error(`✗ Could not fetch ${source.game}/${source.file}`);
      continue;
    }
    const labels = await getLabels(source.game);
    const ts = generateFile(source, char, labels);
    const outPath = join(outDir, `${source.id}.ts`);
    await writeFile(outPath, ts);
    generated.push({ id: source.id, camel: camelId(source.id), file: outPath });
    console.log(`✓ ${source.id} (${char.perks.length} perks)`);
  }

  console.log(`\nGenerated ${generated.length} files.\n`);
  console.log("=== Add to src/data/index.ts imports ===");
  for (const g of generated) {
    console.log(`import { ${g.camel} } from "./classes/${g.id}";`);
  }
  console.log("\n=== Add to CLASSES array ===");
  for (const g of generated) {
    console.log(`  ${g.camel},`);
  }
  console.log("\n=== Add to scripts/build-perk-i18n.ts SOURCE_MAP ===");
  for (const s of SOURCES) {
    console.log(`  ${JSON.stringify(s.id)}: { game: ${JSON.stringify(s.game)}, file: ${JSON.stringify(s.file)} },`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
