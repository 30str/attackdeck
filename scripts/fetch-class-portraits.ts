/*
 * Fetches class art from Gloomhaven Secretariat:
 *   - Icon glyphs (SVG, rasterized to PNG via sharp at multiple scales)
 *     → small tiles in the party screen / class picker.
 *   - Portrait thumbnails (PNG, downscaled to @1x via sharp; source kept as @2x)
 *     → faded backgrounds on the draw screen.
 *
 * Writes per-class at multiple densities for Play Store compatibility:
 *   - assets/images/classes/icons/<id>.png       (mdpi   — 128px)
 *   - assets/images/classes/icons/<id>@2x.png    (xhdpi  — 256px)
 *   - assets/images/classes/icons/<id>@3x.png    (xxhdpi — 384px)
 *   - assets/images/classes/portraits/<id>.png   (mdpi   — ~half source)
 *   - assets/images/classes/portraits/<id>@2x.png (xhdpi  — source)
 *
 * Generating only mdpi caused Play to flag the build as losing 18.5k devices
 * (density-coverage heuristic).  Metro's asset resolver auto-routes the @Nx
 * siblings into the correct drawable-<dpi>-v4 buckets when you require the
 * base filename.
 *
 * Regenerates src/assets/classPortraits.ts with two require-maps Metro bundles
 * at build time: CLASS_ICONS and CLASS_PORTRAITS.  We require the base name
 * (`<id>.png`) and Metro picks up the @2x/@3x variants automatically.
 *
 * GHS naming: starters use the kebab class name; spoiler-renamed unlockables
 * use the original icon-glyph slug.  We try `<classId>.png|svg` first then
 * fall back to `<gamePrefix>-<iconRef>.png|svg`, which our existing iconRef
 * field already stores.
 *
 * Portraits exceeding MAX_PORTRAIT_BYTES are dropped (one GHS upload is
 * ~470 KB — twelve times the average — and bloats the bundle for no visible
 * gain at the dimmed-background opacity we render at).
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
const ICON_BASE_PX = 128; // @1x mdpi
const ICON_SCALES = [1, 2, 3] as const;
const MAX_PORTRAIT_BYTES = 150 * 1024;

function candidateFilenames(id: string, iconRef: string): string[] {
  const gamePrefix = id.split("-")[0]!;
  const out = new Set<string>([id, `${gamePrefix}-${iconRef}`]);
  // GH 2nd Edition re-skins many original GH classes with the same icon glyph.
  // GHS only stores icons under `gh-*`, so probe there as a final fallback.
  if (gamePrefix === "gh2e") out.add(`gh-${iconRef}`);
  return [...out];
}

function scaledName(id: string, scale: number): string {
  return scale === 1 ? `${id}.png` : `${id}@${scale}x.png`;
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

async function rasterizeSvgAt(svg: Uint8Array, sizePx: number): Promise<Uint8Array> {
  // Density 300 is enough to rasterize cleanly above any of our target sizes
  // (128/256/384) for the resize step. Higher densities blow past sharp's
  // pixel-input cap on some GHS SVGs whose viewBox is large in user units.
  // Transparent background; SVG fills (per-class brand colors) come through.
  const out = await sharp(Buffer.from(svg), {
    density: 300,
    limitInputPixels: 100_000_000,
  })
    .resize(sizePx, sizePx, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  return new Uint8Array(out);
}

async function downscalePng(png: Uint8Array, divisor: number): Promise<Uint8Array> {
  const meta = await sharp(Buffer.from(png)).metadata();
  const w = Math.max(1, Math.round((meta.width ?? 220) / divisor));
  const h = Math.max(1, Math.round((meta.height ?? 220) / divisor));
  // palette mode (8-bit) + max compression. The @1x portrait is bundled to
  // satisfy Play's density-coverage check; most devices fetch @2x at runtime,
  // so this file size matters more than colour fidelity.
  const out = await sharp(Buffer.from(png))
    .resize(w, h, { fit: "inside", withoutEnlargement: true })
    .png({ palette: true, compressionLevel: 9, effort: 10 })
    .toBuffer();
  return new Uint8Array(out);
}

type Result = {
  id: string;
  icon: { ok: true; totalBytes: number } | { ok: false };
  portrait:
    | { ok: true; totalBytes: number }
    | { ok: false; reason: "missing" | "too-large" };
};

async function processOne(klass: { id: string; iconRef: string }): Promise<Result> {
  const candidates = candidateFilenames(klass.id, klass.iconRef);

  // Icon (SVG → PNG at 3 scales)
  let iconResult: Result["icon"] = { ok: false };
  for (const filename of candidates) {
    const svg = await fetchBytes(`${GHS_BASE}/icons/${filename}.svg`);
    if (svg !== null) {
      try {
        let total = 0;
        for (const scale of ICON_SCALES) {
          const png = await rasterizeSvgAt(svg, ICON_BASE_PX * scale);
          await writeFile(join(ICONS_DIR, scaledName(klass.id, scale)), png);
          total += png.byteLength;
        }
        iconResult = { ok: true, totalBytes: total };
      } catch (e) {
        console.warn(`! ${klass.id} icon rasterize failed:`, e);
      }
      break;
    }
  }

  // Portrait (source PNG as @2x, halved as @1x)
  let portraitResult: Result["portrait"] = { ok: false, reason: "missing" };
  for (const filename of candidates) {
    const png = await fetchBytes(`${GHS_BASE}/thumbnail/${filename}.png`);
    if (png !== null) {
      if (png.byteLength > MAX_PORTRAIT_BYTES) {
        portraitResult = { ok: false, reason: "too-large" };
      } else {
        const halved = await downscalePng(png, 2);
        await writeFile(join(PORTRAITS_DIR, scaledName(klass.id, 1)), halved);
        await writeFile(join(PORTRAITS_DIR, scaledName(klass.id, 2)), png);
        portraitResult = {
          ok: true,
          totalBytes: halved.byteLength + png.byteLength,
        };
      }
      break;
    }
  }

  const iconStr = iconResult.ok
    ? `icon ${(iconResult.totalBytes / 1024).toFixed(1)}KB`
    : "icon —";
  const portraitStr = portraitResult.ok
    ? `portrait ${(portraitResult.totalBytes / 1024).toFixed(1)}KB`
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

async function removeStaleDir(dir: string) {
  // Wipe the directory of any PNGs so renamed/missing files don't linger.
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.isFile() && e.name.endsWith(".png")) {
        await unlink(join(dir, e.name));
      }
    }
  } catch {
    // dir may not exist on first run
  }
}

async function main() {
  await mkdir(ICONS_DIR, { recursive: true });
  await mkdir(PORTRAITS_DIR, { recursive: true });
  await mkdir(dirname(MAP_FILE), { recursive: true });
  await removeStaleDir(ICONS_DIR);
  await removeStaleDir(PORTRAITS_DIR);
  // Earlier versions wrote portraits flat under classes/.  Clean any leftovers.
  await removeStaleDir(CLASSES_DIR);

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
    "//",
    "// Each require() points at the @1x file; Metro auto-resolves the @2x/@3x",
    "// siblings sitting next to it and bundles each at the correct density.",
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

  const iconBytes = results.reduce(
    (s, r) => s + (r.icon.ok ? r.icon.totalBytes : 0),
    0,
  );
  const portraitBytes = results.reduce(
    (s, r) => s + (r.portrait.ok ? r.portrait.totalBytes : 0),
    0,
  );
  console.log("");
  console.log(
    `Icons:     ${iconsOk.length}/${results.length} (${(iconBytes / 1024).toFixed(1)} KB across 3 scales)`,
  );
  console.log(
    `Portraits: ${portraitsOk.length}/${results.length} (${(portraitBytes / 1024).toFixed(1)} KB across 2 scales)`,
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
