/*
 * Fetches GHS's translated perk descriptions for DE/FR/ES/IT and writes them
 * to src/i18n/locales/perks-<locale>.json keyed by `<classId>.<perkId>`.
 *
 * Scope: only `type: "custom"` perks (the long descriptive class-specific
 * rules). Pure structural perks (Remove/Add/Replace) stay in English; the
 * Character screen falls back to perk.description for missing translations.
 *
 * Run with: npm run build-perk-i18n
 */

import { writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { CLASSES } from "../src/data/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LOCALES = ["de", "fr", "es", "it"] as const;
type Locale = (typeof LOCALES)[number];

const GHS_BASE =
  "https://raw.githubusercontent.com/Lurkars/gloomhavensecretariat/master";

/** Master locale path inside the GHS repo. */
const MASTER_LOCALE = (locale: Locale) =>
  `${GHS_BASE}/src/assets/locales/${locale}.json`;

/** Per-game label paths inside data/. */
const GAME_LABEL = (game: string, locale: Locale) =>
  `${GHS_BASE}/data/${game}/label/${locale}.json`;
const GAME_SPOILER_LABEL = (game: string, locale: Locale) =>
  `${GHS_BASE}/data/${game}/label/spoiler/${locale}.json`;
const CHARACTER_JSON = (game: string, file: string) =>
  `${GHS_BASE}/data/${game}/character/${file}.json`;

// Map our class ids to their GHS source folder + filename.
const SOURCE_MAP: Record<string, { game: string; file: string }> = {
  // Gloomhaven starters
  "gh-brute": { game: "gh", file: "brute" },
  "gh-cragheart": { game: "gh", file: "cragheart" },
  "gh-mindthief": { game: "gh", file: "mindthief" },
  "gh-scoundrel": { game: "gh", file: "scoundrel" },
  "gh-spellweaver": { game: "gh", file: "spellweaver" },
  "gh-tinkerer": { game: "gh", file: "tinkerer" },
  // Gloomhaven unlockables
  "gh-beast-tyrant": { game: "gh", file: "two-mini" },
  "gh-berserker": { game: "gh", file: "lightning" },
  "gh-doomstalker": { game: "gh", file: "angry-face" },
  "gh-elementalist": { game: "gh", file: "triangles" },
  "gh-nightshroud": { game: "gh", file: "eclipse" },
  "gh-plagueherald": { game: "gh", file: "squidface" },
  "gh-quartermaster": { game: "gh", file: "three-spears" },
  "gh-sawbones": { game: "gh", file: "saw" },
  "gh-soothsinger": { game: "gh", file: "music-note" },
  "gh-summoner": { game: "gh", file: "circles" },
  "gh-sunkeeper": { game: "gh", file: "sun" },
  "gh-bladeswarm": { game: "gh-envx", file: "envx" },
  // Forgotten Circles
  "fc-diviner": { game: "fc", file: "diviner" },
  // Frosthaven starters
  "fh-banner-spear": { game: "fh", file: "banner-spear" },
  "fh-blinkblade": { game: "fh", file: "blinkblade" },
  "fh-boneshaper": { game: "fh", file: "boneshaper" },
  "fh-deathwalker": { game: "fh", file: "deathwalker" },
  "fh-drifter": { game: "fh", file: "drifter" },
  "fh-geminate": { game: "fh", file: "geminate" },
  // Frosthaven unlockables
  "fh-crashing-tide": { game: "fh", file: "coral" },
  "fh-deepwraith": { game: "fh", file: "kelp" },
  "fh-frozen-fist": { game: "fh", file: "fist" },
  "fh-hive": { game: "fh", file: "prism" },
  "fh-infuser": { game: "fh", file: "astral" },
  "fh-metal-mosaic": { game: "fh", file: "drill" },
  "fh-pain-conduit": { game: "fh", file: "shackles" },
  "fh-pyroclast": { game: "fh", file: "meteor" },
  "fh-shattersong": { game: "fh", file: "shards" },
  "fh-snowdancer": { game: "fh", file: "snowflake" },
  "fh-trapper": { game: "fh", file: "trap" },
  // Jaws of the Lion
  "jotl-demolitionist": { game: "jotl", file: "demolitionist" },
  "jotl-hatchet": { game: "jotl", file: "hatchet" },
  "jotl-red-guard": { game: "jotl", file: "red-guard" },
  "jotl-voidwarden": { game: "jotl", file: "voidwarden" },
  // Trail of Ashes
  "toa-shardrender": { game: "toa", file: "gemstone" },
  "toa-rimehearth": { game: "toa", file: "ice-meteor" },
  "toa-tempest": { game: "toa", file: "lightning-ball" },
  "toa-thornreaper": { game: "toa", file: "spiked-ring" },
  "toa-incarnate": { game: "toa", file: "three-eyes" },
  "toa-vanquisher": { game: "toa-envv", file: "envv" },
  // Gloomhaven 2nd Edition
  "gh2e-bruiser": { game: "gh2e", file: "bruiser" },
  "gh2e-cragheart": { game: "gh2e", file: "cragheart" },
  "gh2e-mindthief": { game: "gh2e", file: "mindthief" },
  "gh2e-silent-knife": { game: "gh2e", file: "silent-knife" },
  "gh2e-spellweaver": { game: "gh2e", file: "spellweaver" },
  "gh2e-tinkerer": { game: "gh2e", file: "tinkerer" },
  "gh2e-berserker": { game: "gh2e", file: "lightning" },
  "gh2e-bladeswarm": { game: "gh2e", file: "crossed-swords" },
  "gh2e-doomstalker": { game: "gh2e", file: "angry-face" },
  "gh2e-elementalist": { game: "gh2e", file: "triangles" },
  "gh2e-nightshroud": { game: "gh2e", file: "eclipse" },
  "gh2e-plagueherald": { game: "gh2e", file: "squidface" },
  "gh2e-quartermaster": { game: "gh2e", file: "three-spears" },
  "gh2e-sawbones": { game: "gh2e", file: "saw" },
  "gh2e-soothsinger": { game: "gh2e", file: "music-note" },
  "gh2e-soultether": { game: "gh2e", file: "circles" },
  "gh2e-sunkeeper": { game: "gh2e", file: "sun" },
  "gh2e-wildfury": { game: "gh2e", file: "two-mini" },
  // Crimson Scales (main 11 + 3 add-on "Mercenary" classes)
  "cs-hierophant": { game: "cs", file: "beetle" },
  "cs-spirit-caller": { game: "cs", file: "bleeding-claw" },
  "cs-chainguard": { game: "cs", file: "chain-helmet" },
  "cs-luminary": { game: "cs", file: "crescent-sun" },
  "cs-brightspark": { game: "cs", file: "flask" },
  "cs-starslinger": { game: "cs", file: "galaxy" },
  "cs-chieftain": { game: "cs", file: "ladder-axe" },
  "cs-hollowpact": { game: "cs", file: "leaf" },
  "cs-bombard": { game: "cs", file: "skull" },
  "cs-fire-knight": { game: "cs", file: "target" },
  "cs-mirefoot": { game: "cs", file: "tools" },
  "cs-amber-aegis": { game: "cs", file: "sprig" },
  "cs-ruinmaw": { game: "cs", file: "tusks" },
  "cs-artificer": { game: "cs", file: "vortex" },
  // CCUG custom classes
  "ccug-alchemancer": { game: "ccug", file: "alchemancer" },
  "ccug-core": { game: "ccug", file: "core" },
  "ccug-dome": { game: "ccug", file: "dome" },
  "ccug-echowight": { game: "ccug", file: "echowight" },
  "ccug-frostborn": { game: "ccug", file: "frostborn" },
  "ccug-glacial-torrent": { game: "ccug", file: "glacialtorrent" },
  "ccug-jester-twins": { game: "ccug", file: "jestertwins" },
  "ccug-lifespeaker": { game: "ccug", file: "lifespeaker" },
  "ccug-lightracer": { game: "ccug", file: "lightracer" },
  "ccug-powdercoat": { game: "ccug", file: "powdercoat" },
  "ccug-progenitor": { game: "ccug", file: "progenitor" },
  "ccug-reeftender": { game: "ccug", file: "reeftender" },
  "ccug-rekindled": { game: "ccug", file: "rekindled" },
  "ccug-rootwhisperer": { game: "ccug", file: "rootwhisperer" },
  "ccug-skitterclaw": { game: "ccug", file: "skitterclaw" },
  "ccug-swarmshift": { game: "ccug", file: "swarmshift" },
  "ccug-veilpiercer": { game: "ccug", file: "veilpiercer" },
  "ccug-vimthreader": { game: "ccug", file: "vimthreader" },
  "ccug-wildborn": { game: "ccug", file: "wildborn" },
  "ccug-woebound": { game: "ccug", file: "woebound" },
};

const fetchCache = new Map<string, unknown>();

async function fetchJson(url: string): Promise<unknown> {
  if (fetchCache.has(url)) return fetchCache.get(url);
  try {
    const res = await fetch(url);
    if (!res.ok) {
      fetchCache.set(url, null);
      return null;
    }
    const json = await res.json();
    fetchCache.set(url, json);
    return json;
  } catch {
    fetchCache.set(url, null);
    return null;
  }
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

/** Returns the canonical display string for a vocabulary entry. GHS uses
 *  either bare strings or { "": "name", "hint": "..." } objects. */
function normaliseVocabValue(v: unknown): string | null {
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
      out[k] = deepMerge(
        out[k] as Record<string, unknown>,
        v as Record<string, unknown>
      );
    } else {
      out[k] = v;
    }
  }
  return out;
}

type LocaleData = {
  /** Master locale — used for %game.X% placeholders. */
  master: Record<string, unknown>;
  /** Per-game label merge (main + spoiler) — used for %data.X% placeholders. */
  gameLabels: Record<string, unknown>;
};

async function loadLocaleData(locale: Locale, game: string): Promise<LocaleData> {
  const [master, main, spoiler] = await Promise.all([
    fetchJson(MASTER_LOCALE(locale)),
    fetchJson(GAME_LABEL(game, locale)),
    fetchJson(GAME_SPOILER_LABEL(game, locale)),
  ]);
  return {
    master: (master ?? {}) as Record<string, unknown>,
    gameLabels: deepMerge(
      (main ?? {}) as Record<string, unknown>,
      (spoiler ?? {}) as Record<string, unknown>
    ),
  };
}

type ResolveResult = { text: string; fullyResolved: boolean };

/** Resolve %X.Y.Z:N% placeholders. Two namespaces:
 *  - `game.*` → look up in the master locale file (with `game.` stripped).
 *  - `data.*` → look up in the per-game labels (with `data.` stripped).
 *  Other prefixes left unresolved. Iterates up to 5 times for nested refs.
 *  Returns fullyResolved=false if any placeholder couldn't be resolved or if
 *  the resulting string still has GHS template markers like {0}. */
function resolvePlaceholders(text: string, locale: LocaleData): ResolveResult {
  let cur = text;
  for (let i = 0; i < 5; i++) {
    const next = cur.replace(/%([^%]+)%/g, (match, inner: string) => {
      const colonIdx = inner.indexOf(":");
      const fullPath = colonIdx >= 0 ? inner.slice(0, colonIdx) : inner;
      const suffix = colonIdx >= 0 ? inner.slice(colonIdx + 1) : "";

      let val: unknown = undefined;
      if (fullPath.startsWith("game.")) {
        val = getPath(locale.master, fullPath.slice("game.".length));
        if (val === undefined) val = getPath(locale.master, fullPath);
      } else if (fullPath.startsWith("data.")) {
        val = getPath(locale.gameLabels, fullPath.slice("data.".length));
        if (val === undefined) val = getPath(locale.gameLabels, fullPath);
      } else {
        val = getPath(locale.master, fullPath);
      }

      const name = normaliseVocabValue(val);
      if (name == null) return match;
      return suffix ? `${name} ${suffix}` : name;
    });
    if (next === cur) break;
    cur = next;
  }

  const hasUnresolvedPlaceholder = /%[^%]+%/.test(cur);
  const hasTemplateMarker = /\{[0-9]+\}/.test(cur);
  const fullyResolved = !hasUnresolvedPlaceholder && !hasTemplateMarker;

  // Clean up: strip unresolved placeholders, normalise whitespace
  const cleaned = cur
    .replace(/%[^%]+%/g, "")
    .replace(/\{[0-9]+\}/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s,/g, ",")
    .replace(/,\s*,/g, ",")
    .trim();

  return { text: cleaned, fullyResolved };
}

/** Render one GHS perk for one locale. Returns null when no translation can be
 *  derived (caller lets it fall back to EN). */
function renderPerk(
  ghsPerk: Record<string, unknown>,
  locale: LocaleData
): string | null {
  const type = ghsPerk["type"] as string | undefined;
  const customRef = ghsPerk["custom"] as string | undefined;

  // Pure custom perk — the long descriptive ones
  if (type === "custom" && customRef) {
    const { text, fullyResolved } = resolvePlaceholders(customRef, locale);
    // Only emit if everything resolved cleanly — otherwise let it fall back
    // to the EN perk.description at runtime.
    if (!fullyResolved || text.length < 4) return null;
    return text;
  }

  // Structural perks (add/remove/replace) — left in EN. The Character screen
  // falls back to perk.description.
  return null;
}

async function main() {
  const out: Record<Locale, Record<string, Record<string, string>>> = {
    de: {},
    fr: {},
    es: {},
    it: {},
  };

  for (const klass of CLASSES) {
    const source = SOURCE_MAP[klass.id];
    if (!source) {
      console.warn(`✗ No GHS source for ${klass.id}`);
      continue;
    }
    const charJson = (await fetchJson(
      CHARACTER_JSON(source.game, source.file)
    )) as { perks?: Record<string, unknown>[] } | null;
    if (!charJson?.perks) {
      console.warn(`✗ No perks fetched for ${klass.id}`);
      continue;
    }

    for (const locale of LOCALES) {
      const localeData = await loadLocaleData(locale, source.game);
      const translations: Record<string, string> = {};

      charJson.perks.forEach((ghsPerk, i) => {
        const ourPerkId = `p${String(i + 1).padStart(2, "0")}`;
        const rendered = renderPerk(ghsPerk, localeData);
        if (rendered) translations[ourPerkId] = rendered;
      });

      if (Object.keys(translations).length > 0) {
        out[locale][klass.id] = translations;
      }
    }
  }

  const localesDir = join(__dirname, "..", "src", "i18n", "locales");
  await mkdir(localesDir, { recursive: true });

  for (const locale of LOCALES) {
    const path = join(localesDir, `perks-${locale}.json`);
    await writeFile(path, JSON.stringify(out[locale], null, 2) + "\n");
    const totalPerks = Object.values(out[locale]).reduce(
      (sum, v) => sum + Object.keys(v).length,
      0
    );
    console.log(
      `✓ ${path}: ${Object.keys(out[locale]).length} classes / ${totalPerks} perks translated`
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
