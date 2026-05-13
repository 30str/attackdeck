# Attack Deck

Cross-platform mobile companion app for the attack modifier decks in **Gloomhaven**, **Frosthaven**, **Jaws of the Lion**, **Forgotten Circles**, **Trail of Ashes**, plus the fan expansions **The Crimson Scales** and **CCUG**. Built with React Native + Expo so the same codebase runs on iOS and Android. Mobile-first; the original *Gloomhaven Attack Deck* app is iOS-only — this fills the Android gap.

Unofficial fan-made tool. Gloomhaven and Frosthaven are trademarks of Cephalofair Games. Not affiliated with Cephalofair.

Developed by [30str](https://30str.com).

## Status

v1 feature-complete; preparing for App Store / Google Play submission. Currently bundles **98 classes** — 64 from officially-published printings plus 34 community fan-expansion classes.

### Official content (64)

| Game | Starting | Unlockable |
|---|---|---|
| Gloomhaven | Brute, Cragheart, Mindthief, Scoundrel, Spellweaver, Tinkerer | Beast Tyrant, Berserker, Bladeswarm (Envelope X), Doomstalker, Elementalist, Nightshroud, Plagueherald, Quartermaster, Sawbones, Soothsinger, Summoner, Sunkeeper |
| Gloomhaven (2nd Edition) | Bruiser, Cragheart, Mindthief, Silent Knife, Spellweaver, Tinkerer | Berserker, Bladeswarm, Doomstalker, Elementalist, Nightshroud, Plagueherald, Quartermaster, Sawbones, Soothsinger, Soultether, Sunkeeper, Wildfury |
| Forgotten Circles | — | Diviner |
| Frosthaven | Banner Spear, Blinkblade, Boneshaper, Deathwalker, Drifter, Geminate | Crashing Tide, Deepwraith, Frozen Fist, HIVE, Infuser, Metal Mosaic, Pain Conduit, Pyroclast, Shattersong, Snowdancer, Trapper |
| Trail of Ashes | — | Shardrender, Rimehearth, Tempest, Thornreaper, Incarnate, Vanquisher (Envelope V) |
| Jaws of the Lion | Demolitionist, Hatchet, Red Guard, Voidwarden | — |

GH1 and GH2E are listed as separate game groups so users who own either (or both) printings see their version of each class with the correct rebalanced perks. GH2E renamed several classes (Brute→Bruiser, Scoundrel→Silent Knife, Summoner→Soultether, Beast Tyrant→Wildfury) and promoted Bladeswarm — the hidden GH1 Envelope X reward — into a regular unlockable.

Unlockable classes are hidden behind their canonical GHS code names ("Lightning", "Eclipse", "Astral", etc.) in the character picker — tap twice to reveal.

### Fan expansions (34)

Community-authored content, sourced from [Gloomhaven Secretariat](https://github.com/Lurkars/gloomhavensecretariat). Custom effects that don't map to a standard tag are rendered as ★ — the perk description carries the real rule. Class data is rendered from primitives only; no copyrighted artwork is bundled.

| Source | Classes |
|---|---|
| The Crimson Scales (14) | Amber Aegis, Artificer, Bombard, Brightspark, Chainguard, Chieftain, Fire Knight, Hierophant, Hollowpact, Luminary, Mirefoot, Ruinmaw, Spirit Caller, Starslinger |
| CCUG Custom Classes (20) | Alchemancer, Core, Dome, Echowight, Frostborn, Glacial Torrent, Jester Twins, Lifespeaker, Lightracer, Powdercoat, Progenitor, Reeftender, Rekindled, Rootwhisperer, Skitterclaw, Swarmshift, Veilpiercer, Vimthreader, Wildborn, Woebound |

The Crimson Scales is a fan project by Bas Hoogeboom and contributors; CCUG classes are individually authored by community members. Not affiliated with either.

## Features

- Per-class attack-modifier decks with **perk tracking** — toggle a perk and the deck rebuilds automatically.
- **Advantage and Disadvantage** draw modes — two sequences side-by-side, undone as one atomic step.
- **Multi-character party** support, persisted locally on the device (no account required).
- **Undo** the last draw — drawn cards go back to the top of the deck.
- **Two shuffle modes** — full reshuffle, or shuffle the un-drawn pile only.
- **Bless / Curse** one-shot cards that remove themselves on draw.
- **End-of-round shuffle prompt** when a Miss or ×2 is revealed.
- **Rolling modifier accumulation** that respects the Gloomhaven and Frosthaven rules variants.
- **Spoiler-safe** class picker — unlockable classes shown by code name until you tap to reveal.
- **Haptic feedback** on draw and shuffle (toggleable in settings).
- **1-second cooldown** with refill animation on the draw button to prevent accidental double-taps.
- Card flip animation with scale-punch, border glow, and value-aware idle tint (red for miss, green for ×2).
- **Localised** in English, German, French, Spanish, and Italian — auto-detects device locale; manual override in settings.
- Dark UI throughout, sized for one-thumb operation.

## Run it

```bash
npm install
npm run start
```

Scan the QR with Expo Go (Android or iOS) or press `w` to launch in a browser. The persistence layer uses AsyncStorage, which works in Expo Go without a custom dev build.

### Other useful commands

| Command | What it does |
|---|---|
| `npm test` | Engine unit tests (vitest). |
| `npm run test:watch` | Vitest in watch mode. |
| `npm run verify-data` | Asserts every class has valid perk data. |
| `npm run generate-icons` | Regenerates the app icon set from the SVG source. |
| `npm run web` | Web preview (no native modules). |
| `npm run lint` | Expo lint. |

## Data sources

Per-class perk lists, the base attack modifier deck, and the spoiler-safe code-name mappings are adapted from [Gloomhaven Secretariat](https://github.com/Lurkars/gloomhavensecretariat) — the actively maintained open-source successor to Gloomhaven Helper. Each class file in `src/data/classes/` cites the GHS source path it was transcribed from. UI translations for the supported locales were hand-translated using standard board-game terminology. See [CREDITS.md](CREDITS.md) for the full attribution.

## Architecture

A few high-level pointers; deeper notes live in [CLAUDE.md](CLAUDE.md).

- **`src/engine/deck.ts`** — pure-TypeScript deck state machine. No React. 29 unit tests. The only file with non-trivial game logic.
- **`src/data/`** — typed game data. Each class is a self-contained TS file that uses helpers in `_perkHelpers.ts` for compact perk definitions.
- **`src/state/`** — Zustand stores (`party`, `settings`) with AsyncStorage persistence.
- **`src/i18n/`** — i18next setup + locale JSON files. Game-data perks deliberately stay in English; UI chrome is localised.
- **`app/`** — Expo Router file-based routes for the three feature screens (`/`, `/character/[id]`, `/draw/[id]`) plus `/settings`.
- **`src/components/Card.tsx`** — renders one attack modifier card from primitives (value + effect tags). No copyrighted card art is bundled.
- **`release/maestro/smoke.yaml`** — generic Maestro E2E flow runnable by any contributor with a dev build.

## Contributing

Spot a transcription error in a perk? Open an issue with the class name, perk number, and what the correct text/effect should be — or edit the relevant `src/data/classes/*.ts` and send a patch. Run `npm run verify-data` and `npm test` before submitting.

Adding a new language? Drop a `src/i18n/locales/<code>.json` (copy `en.json` as a starting point), add the code to `SUPPORTED_LOCALES` in `src/i18n/index.ts`, and add a label entry in every locale's `languages` block.
