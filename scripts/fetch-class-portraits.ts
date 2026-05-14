/*
 * Fetches class art from Gloomhaven Secretariat:
 *   - Icon glyphs (SVG, rasterized to 128px PNG via sharp) → small tiles.
 *   - Portrait thumbnails (PNG) → faded backgrounds on the draw screen.
 *
 * Writes to:
 *   - assets/images/classes/icons/<classId>.png
 *   - assets/images/classes/portraits/<classId>.png
 *
 * Regenerates src/assets/classPortraits.ts with two require-maps Metro bundles
 * at build time: CLASS_ICONS and CLASS_PORTRAITS.
 *
 * GHS naming: starters use the kebab class name; spoiler-renamed unlockables
 * use the original icon-glyph slug. We try `<classId>.png|svg` first then fall
 * back to `<gamePrefix>-<iconRef>.png|svg`, which our existing iconRef field
 * already stores.
 *
 * Portraits exceeding MAX_PORTRAIT_BYTES are dropped (one GHS upload is ~470 KB
 * — twelve times the average — and bloats the bundle for no visible gain at
 * the dimmed-background opacity we render at).
 *
 * Source art is CC BY-NC-SA 4.0 (Isaac Childres / Cephalofair Creator Pack).
 * See LICENSE-ART.md.
 *
 * Run with: npm run fetch-class-portraits
 */

import { writeFile, mkdir, readdir, unlink } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { CLASSES } from "../src/data/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const GHS_BASE =
  "https://raw.githubusercontent.com/Lurkars/gloomhavensecretariat/master/src/assets/images/character";

const ROOT = join(__dirname, "..");
const CLASSES_DIR = join(ROOT, "assets", "images", "classes");
const ICONS_DIR = join(CLASSES_DIR, "icons");
const PORTRAITS_DIR = join(CLASSES_DIR, "portraits");
const MAP_FILE = join(ROOT, "src", "assets", "classPortraits.ts");

const CONCURRENCY = 8;
const ICON_PNG_SIZE = 128;
const MAX_PORTRAIT_BYTES = 150 * 1024;

function candidateFilenames(id: string, iconRef: string): string[] {
  const gamePrefix = id.split("-")[0]!;
  const out = new Set<string>([id, `${gamePrefix}-${iconRef}`]);
  // GH 2nd Edition re-skins many original GH classes with the same icon glyph.
  // GHS only stores icons under `gh-*`, so probe there as a final fallback.
  if (gamePrefix === "gh2e") out.add(`gh-${iconRef}`);
  return [...out];
}

async function fetchBytes(url: string): Promise<Uint8Array | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    return new Uint8Array(buf);
  } catch {
    return null;
  }
}

async function rasterizeSvg(svg: Uint8Array): Promise<Uint8Array> {
  // density 256 oversamples so the resize step downsamples for clean edges.
  // Transparent background; SVG fills (per-class brand colors) come through.
  const out = await sharp(Buffer.from(svg), { density: 256 })
    .resize(ICON_PNG_SIZE, ICON_PNG_SIZE, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  return new Uint8Array(out);
}

type Result = {
  id: string;
  icon: { ok: true; bytes: number } | { ok: false };
  portrait: { ok: true; bytes: number } | { ok: false; reason: "missing" | "too-large" };
};

async function processOne(klass: { id: string; iconRef: string }): Promise<Result> {
  const candidates = candidateFilenames(klass.id, klass.iconRef);

  // Icon (SVG → PNG)
  let iconResult: Result["icon"] = { ok: false };
  for (const filename of candidates) {
    const svg = await fetchBytes(`${GHS_BASE}/icons/${filename}.svg`);
    if (svg !== null) {
      try {
        const png = await rasterizeSvg(svg);
        await writeFile(join(ICONS_DIR, `${klass.id}.png`), png);
        iconResult = { ok: true, bytes: png.byteLength };
      } catch (e) {
        console.warn(`! ${klass.id} icon rasterize failed:`, e);
      }
      break;
    }
  }

  // Portrait (PNG, size-gated)
  let portraitResult: Result["portrait"] = { ok: false, reason: "missing" };
  for (const filename of candidates) {
    const png = await fetchBytes(`${GHS_BASE}/thumbnail/${filename}.png`);
    if (png !== null) {
      if (png.byteLength > MAX_PORTRAIT_BYTES) {
        portraitResult = { ok: false, reason: "too-large" };
      } else {
        await writeFile(join(PORTRAITS_DIR, `${klass.id}.png`), png);
        portraitResult = { ok: true, bytes: png.byteLength };
      }
      break;
    }
  }

  const iconStr = iconResult.ok ? `icon ${(iconResult.bytes / 1024).toFixed(1)}KB` : "icon —";
  const portraitStr = portraitResult.ok
    ? `portrait ${(portraitResult.bytes / 1024).toFixed(1)}KB`
    : portraitResult.reason === "too-large"
      ? `portrait SKIPPED (>${MAX_PORTRAIT_BYTES / 1024}KB)`
      : "portrait —";
  console.log(`  ${klass.id}: ${iconStr}, ${portraitStr}`);

  return { id: klass.id, icon: iconResult, portrait: portraitResult };
}

async function runBatched<T, R>(
  items: T[],
  worker: (item: T) => Promise<R>,
  concurrency: number,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  async function next() {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      results[i] = await worker(items[i]!);
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => next());
  await Promise.all(workers);
  return results;
}

async function removeFlatLegacyPngs() {
  // Earlier versions of this script wrote portraits flat under classes/.
  // Now portraits live under classes/portraits/. Clean any leftover flat PNGs.
  try {
    const entries = await readdir(CLASSES_DIR, { withFileTypes: true });
    const stale = entries.filter((e) => e.isFile() && e.name.endsWith(".png"));
    for (const e of stale) {
      await unlink(join(CLASSES_DIR, e.name));
    }
    if (stale.length > 0) {
      console.log(`Removed ${stale.length} legacy flat-file PNGs from ${CLASSES_DIR}`);
    }
  } catch {
    // dir may not exist on first run
  }
}

async function main() {
  await mkdir(ICONS_DIR, { recursive: true });
  await mkdir(PORTRAITS_DIR, { recursive: true });
  await mkdir(dirname(MAP_FILE), { recursive: true });
  await removeFlatLegacyPngs();

  const inputs = CLASSES.map((c) => ({ id: c.id, iconRef: c.iconRef }));
  const results = await runBatched(inputs, processOne, CONCURRENCY);

  const iconsOk = results
    .filter((r) => r.icon.ok)
    .map((r) => r.id)
    .sort();
  const portraitsOk = results
    .filter((r) => r.portrait.ok)
    .map((r) => r.id)
    .sort();
  const portraitsTooLarge = results
    .filter((r) => !r.portrait.ok && r.portrait.reason === "too-large")
    .map((r) => r.id);

  const lines = [
    "// AUTO-GENERATED by scripts/fetch-class-portraits.ts — do not edit by hand.",
    "// Re-generate with: npm run fetch-class-portraits",
    "//",
    "// Art © Isaac Childres / Cephalofair Games, used under CC BY-NC-SA 4.0",
    "// via the Gloomhaven Creator Pack. See LICENSE-ART.md.",
    "",
    "export const CLASS_ICONS: Record<string, number> = {",
    ...iconsOk.map(
      (id) => `  "${id}": require("../../assets/images/classes/icons/${id}.png"),`,
    ),
    "};",
    "",
    "export const CLASS_PORTRAITS: Record<string, number> = {",
    ...portraitsOk.map(
      (id) => `  "${id}": require("../../assets/images/classes/portraits/${id}.png"),`,
    ),
    "};",
    "",
  ];
  await writeFile(MAP_FILE, lines.join("\n"));

  const iconBytes = results.reduce((s, r) => s + (r.icon.ok ? r.icon.bytes : 0), 0);
  const portraitBytes = results.reduce(
    (s, r) => s + (r.portrait.ok ? r.portrait.bytes : 0),
    0,
  );
  console.log("");
  console.log(`Icons:     ${iconsOk.length}/${results.length} (${(iconBytes / 1024).toFixed(1)} KB)`);
  console.log(
    `Portraits: ${portraitsOk.length}/${results.length} (${(portraitBytes / 1024).toFixed(1)} KB)`,
  );
  if (portraitsTooLarge.length > 0) {
    console.log(`  dropped for size: ${portraitsTooLarge.join(", ")}`);
  }
  console.log(`Wrote map: ${MAP_FILE}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
