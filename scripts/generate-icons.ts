import sharp from "sharp";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

const OUT = join(__dirname, "..", "assets", "images");
const STORE_OUT = join(__dirname, "..", "release");

const COLORS = {
  bg: "#0a0a0a",
  panel: "#1a1a1a",
  border: "#2a2a2a",
  gold: "#cbb26a",
  goldSoft: "#e8d394",
};

/**
 * Builds the icon SVG. The "main" composition is a small attack-modifier card
 * tilted slightly, with "+1" in gold on a panel background. Padding around
 * the composition leaves room for adaptive-icon masking on Android.
 */
function iconSvg(opts: { size: number; bg: string | null; pad: number; transparent?: boolean }): string {
  const { size, bg, pad, transparent } = opts;
  const cardW = (size - pad * 2) * 0.65;
  const cardH = cardW * 1.38;
  const cardX = (size - cardW) / 2;
  const cardY = (size - cardH) / 2;
  const radius = cardW * 0.12;

  const bgFill = transparent ? "transparent" : bg ?? COLORS.bg;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${bgFill}"/>
  <g transform="rotate(-6 ${size / 2} ${size / 2})">
    <rect x="${cardX}" y="${cardY}" width="${cardW}" height="${cardH}"
          rx="${radius}" ry="${radius}"
          fill="${COLORS.panel}" stroke="${COLORS.border}" stroke-width="${size * 0.012}"/>
    <text x="${size / 2}" y="${size / 2}"
          font-family="system-ui, -apple-system, sans-serif"
          font-size="${cardW * 0.62}"
          font-weight="800"
          fill="${COLORS.gold}"
          text-anchor="middle"
          dominant-baseline="central">+1</text>
  </g>
</svg>`;
}

function featureGraphicSvg(): string {
  const W = 1024;
  const H = 500;
  const cardW = 220;
  const cardH = cardW * 1.38;
  const cy = H / 2;
  const cardPanel = "#222222";
  const cardBorder = COLORS.gold;

  const card = (cx: number, rotate: number, label: string, accent: string = COLORS.gold) => {
    const x = cx - cardW / 2;
    const y = cy - cardH / 2;
    return `<g transform="rotate(${rotate} ${cx} ${cy})">
      <rect x="${x}" y="${y}" width="${cardW}" height="${cardH}"
            rx="${cardW * 0.1}" ry="${cardW * 0.1}"
            fill="${cardPanel}" stroke="${cardBorder}" stroke-width="3" stroke-opacity="0.55"/>
      <text x="${cx}" y="${cy}"
            font-family="system-ui, -apple-system, sans-serif"
            font-size="${cardW * 0.55}"
            font-weight="800"
            fill="${accent}"
            text-anchor="middle"
            dominant-baseline="central">${label}</text>
    </g>`;
  };

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="vignette" cx="40%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#1c1c1c"/>
      <stop offset="100%" stop-color="${COLORS.bg}"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#vignette)"/>
  ${card(260, -16, "−1", COLORS.goldSoft)}
  ${card(460, 0, "+1")}
  ${card(660, 16, "×2", COLORS.goldSoft)}
</svg>`;
}

function monochromeSvg(size: number): string {
  const cardW = size * 0.55;
  const cardH = cardW * 1.38;
  const cardX = (size - cardW) / 2;
  const cardY = (size - cardH) / 2;
  const radius = cardW * 0.12;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <g transform="rotate(-6 ${size / 2} ${size / 2})">
    <rect x="${cardX}" y="${cardY}" width="${cardW}" height="${cardH}"
          rx="${radius}" ry="${radius}"
          fill="#ffffff" fill-opacity="0.92"/>
    <text x="${size / 2}" y="${size / 2}"
          font-family="system-ui, -apple-system, sans-serif"
          font-size="${cardW * 0.62}"
          font-weight="800"
          fill="${COLORS.bg}"
          text-anchor="middle"
          dominant-baseline="central">+1</text>
  </g>
</svg>`;
}

async function renderToPng(svg: string, file: string, size: number, dir: string = OUT) {
  const out = await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toBuffer();
  await writeFile(join(dir, file), out);
  console.log(`✓ ${file} (${size}×${size})`);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  await mkdir(STORE_OUT, { recursive: true });

  // Standard iOS / store-listing icon
  await renderToPng(iconSvg({ size: 1024, bg: COLORS.bg, pad: 80 }), "icon.png", 1024);

  // Google Play high-res icon — 512×512 PNG, opaque background
  await renderToPng(iconSvg({ size: 512, bg: COLORS.bg, pad: 40 }), "play-icon-512.png", 512, STORE_OUT);

  // Google Play feature graphic — 1024×500 banner
  const featureBuf = await sharp(Buffer.from(featureGraphicSvg())).png().toBuffer();
  await writeFile(join(STORE_OUT, "play-feature-graphic.png"), featureBuf);
  console.log(`✓ play-feature-graphic.png (1024×500)`);

  // Web favicon
  await renderToPng(iconSvg({ size: 256, bg: COLORS.bg, pad: 16 }), "favicon.png", 256);

  // Android adaptive icon: foreground (transparent), background (solid), monochrome
  await renderToPng(
    iconSvg({ size: 1024, bg: null, pad: 200, transparent: true }),
    "android-icon-foreground.png",
    1024
  );
  await renderToPng(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="1024" height="1024" fill="${COLORS.bg}"/></svg>`,
    "android-icon-background.png",
    1024
  );
  await renderToPng(monochromeSvg(1024), "android-icon-monochrome.png", 1024);

  // Splash uses a centered card image only; Expo composites onto its own bg.
  await renderToPng(iconSvg({ size: 512, bg: null, pad: 32, transparent: true }), "splash-icon.png", 512);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
