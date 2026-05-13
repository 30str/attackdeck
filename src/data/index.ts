import type { ClassDef, Game } from "./types";
import { ghBrute } from "./classes/gh-brute";
import { ghCragheart } from "./classes/gh-cragheart";
import { ghMindthief } from "./classes/gh-mindthief";
import { ghScoundrel } from "./classes/gh-scoundrel";
import { ghSpellweaver } from "./classes/gh-spellweaver";
import { ghTinkerer } from "./classes/gh-tinkerer";
import { ghBeastTyrant } from "./classes/gh-beast-tyrant";
import { ghBerserker } from "./classes/gh-berserker";
import { ghDoomstalker } from "./classes/gh-doomstalker";
import { ghElementalist } from "./classes/gh-elementalist";
import { ghNightshroud } from "./classes/gh-nightshroud";
import { ghPlagueherald } from "./classes/gh-plagueherald";
import { ghQuartermaster } from "./classes/gh-quartermaster";
import { ghSawbones } from "./classes/gh-sawbones";
import { ghSoothsinger } from "./classes/gh-soothsinger";
import { ghSummoner } from "./classes/gh-summoner";
import { ghSunkeeper } from "./classes/gh-sunkeeper";
import { ghBladeswarm } from "./classes/gh-bladeswarm";
import { fhBannerSpear } from "./classes/fh-banner-spear";
import { fhBlinkblade } from "./classes/fh-blinkblade";
import { fhBoneshaper } from "./classes/fh-boneshaper";
import { fhDeathwalker } from "./classes/fh-deathwalker";
import { fhDrifter } from "./classes/fh-drifter";
import { fhGeminate } from "./classes/fh-geminate";
import { fhCrashingTide } from "./classes/fh-crashing-tide";
import { fhDeepwraith } from "./classes/fh-deepwraith";
import { fhFrozenFist } from "./classes/fh-frozen-fist";
import { fhHive } from "./classes/fh-hive";
import { fhInfuser } from "./classes/fh-infuser";
import { fhMetalMosaic } from "./classes/fh-metal-mosaic";
import { fhPainConduit } from "./classes/fh-pain-conduit";
import { fhPyroclast } from "./classes/fh-pyroclast";
import { fhShattersong } from "./classes/fh-shattersong";
import { fhSnowdancer } from "./classes/fh-snowdancer";
import { fhTrapper } from "./classes/fh-trapper";
import { jotlDemolitionist } from "./classes/jotl-demolitionist";
import { jotlHatchet } from "./classes/jotl-hatchet";
import { jotlRedGuard } from "./classes/jotl-red-guard";
import { jotlVoidwarden } from "./classes/jotl-voidwarden";
import { fcDiviner } from "./classes/fc-diviner";
import { gh2eBruiser } from "./classes/gh2e-bruiser";
import { gh2eCragheart } from "./classes/gh2e-cragheart";
import { gh2eMindthief } from "./classes/gh2e-mindthief";
import { gh2eSilentKnife } from "./classes/gh2e-silent-knife";
import { gh2eSpellweaver } from "./classes/gh2e-spellweaver";
import { gh2eTinkerer } from "./classes/gh2e-tinkerer";
import { gh2eBerserker } from "./classes/gh2e-berserker";
import { gh2eBladeswarm } from "./classes/gh2e-bladeswarm";
import { gh2eDoomstalker } from "./classes/gh2e-doomstalker";
import { gh2eElementalist } from "./classes/gh2e-elementalist";
import { gh2eNightshroud } from "./classes/gh2e-nightshroud";
import { gh2ePlagueherald } from "./classes/gh2e-plagueherald";
import { gh2eQuartermaster } from "./classes/gh2e-quartermaster";
import { gh2eSawbones } from "./classes/gh2e-sawbones";
import { gh2eSoothsinger } from "./classes/gh2e-soothsinger";
import { gh2eSoultether } from "./classes/gh2e-soultether";
import { gh2eSunkeeper } from "./classes/gh2e-sunkeeper";
import { gh2eWildfury } from "./classes/gh2e-wildfury";
import { toaShardrender } from "./classes/toa-shardrender";
import { toaRimehearth } from "./classes/toa-rimehearth";
import { toaTempest } from "./classes/toa-tempest";
import { toaThornreaper } from "./classes/toa-thornreaper";
import { toaIncarnate } from "./classes/toa-incarnate";
import { toaVanquisher } from "./classes/toa-vanquisher";
import { csHierophant } from "./classes/cs-hierophant";
import { csSpiritCaller } from "./classes/cs-spirit-caller";
import { csChainguard } from "./classes/cs-chainguard";
import { csLuminary } from "./classes/cs-luminary";
import { csBrightspark } from "./classes/cs-brightspark";
import { csStarslinger } from "./classes/cs-starslinger";
import { csChieftain } from "./classes/cs-chieftain";
import { csHollowpact } from "./classes/cs-hollowpact";
import { csBombard } from "./classes/cs-bombard";
import { csFireKnight } from "./classes/cs-fire-knight";
import { csMirefoot } from "./classes/cs-mirefoot";
import { csAmberAegis } from "./classes/cs-amber-aegis";
import { csRuinmaw } from "./classes/cs-ruinmaw";
import { csArtificer } from "./classes/cs-artificer";
import { ccugAlchemancer } from "./classes/ccug-alchemancer";
import { ccugCore } from "./classes/ccug-core";
import { ccugDome } from "./classes/ccug-dome";
import { ccugEchowight } from "./classes/ccug-echowight";
import { ccugFrostborn } from "./classes/ccug-frostborn";
import { ccugGlacialTorrent } from "./classes/ccug-glacial-torrent";
import { ccugJesterTwins } from "./classes/ccug-jester-twins";
import { ccugLifespeaker } from "./classes/ccug-lifespeaker";
import { ccugLightracer } from "./classes/ccug-lightracer";
import { ccugPowdercoat } from "./classes/ccug-powdercoat";
import { ccugProgenitor } from "./classes/ccug-progenitor";
import { ccugReeftender } from "./classes/ccug-reeftender";
import { ccugRekindled } from "./classes/ccug-rekindled";
import { ccugRootwhisperer } from "./classes/ccug-rootwhisperer";
import { ccugSkitterclaw } from "./classes/ccug-skitterclaw";
import { ccugSwarmshift } from "./classes/ccug-swarmshift";
import { ccugVeilpiercer } from "./classes/ccug-veilpiercer";
import { ccugVimthreader } from "./classes/ccug-vimthreader";
import { ccugWildborn } from "./classes/ccug-wildborn";
import { ccugWoebound } from "./classes/ccug-woebound";

export { buildBaseDeck } from "./base-deck";
export type * from "./types";

export const GAMES: Game[] = [
  { id: "gloomhaven", name: "Gloomhaven", category: "official" },
  { id: "gloomhaven-2e", name: "Gloomhaven (2nd Edition)", category: "official" },
  { id: "forgotten-circles", name: "Forgotten Circles", category: "official" },
  { id: "frosthaven", name: "Frosthaven", category: "official" },
  { id: "trail-of-ashes", name: "Trail of Ashes", category: "official" },
  { id: "jaws-of-the-lion", name: "Jaws of the Lion", category: "official" },
  { id: "crimson-scales", name: "The Crimson Scales", category: "fan" },
  { id: "ccug", name: "CCUG Custom Classes", category: "fan" },
];

export const CLASSES: ClassDef[] = [
  ghBrute,
  ghCragheart,
  ghMindthief,
  ghScoundrel,
  ghSpellweaver,
  ghTinkerer,
  ghBeastTyrant,
  ghBerserker,
  ghDoomstalker,
  ghElementalist,
  ghNightshroud,
  ghPlagueherald,
  ghQuartermaster,
  ghSawbones,
  ghSoothsinger,
  ghSummoner,
  ghSunkeeper,
  ghBladeswarm,
  fhBannerSpear,
  fhBlinkblade,
  fhBoneshaper,
  fhDeathwalker,
  fhDrifter,
  fhGeminate,
  fhCrashingTide,
  fhDeepwraith,
  fhFrozenFist,
  fhHive,
  fhInfuser,
  fhMetalMosaic,
  fhPainConduit,
  fhPyroclast,
  fhShattersong,
  fhSnowdancer,
  fhTrapper,
  jotlDemolitionist,
  jotlHatchet,
  jotlRedGuard,
  jotlVoidwarden,
  fcDiviner,
  gh2eBruiser,
  gh2eCragheart,
  gh2eMindthief,
  gh2eSilentKnife,
  gh2eSpellweaver,
  gh2eTinkerer,
  gh2eBerserker,
  gh2eBladeswarm,
  gh2eDoomstalker,
  gh2eElementalist,
  gh2eNightshroud,
  gh2ePlagueherald,
  gh2eQuartermaster,
  gh2eSawbones,
  gh2eSoothsinger,
  gh2eSoultether,
  gh2eSunkeeper,
  gh2eWildfury,
  toaShardrender,
  toaRimehearth,
  toaTempest,
  toaThornreaper,
  toaIncarnate,
  toaVanquisher,
  csHierophant,
  csSpiritCaller,
  csChainguard,
  csLuminary,
  csBrightspark,
  csStarslinger,
  csChieftain,
  csHollowpact,
  csBombard,
  csFireKnight,
  csMirefoot,
  csAmberAegis,
  csRuinmaw,
  csArtificer,
  ccugAlchemancer,
  ccugCore,
  ccugDome,
  ccugEchowight,
  ccugFrostborn,
  ccugGlacialTorrent,
  ccugJesterTwins,
  ccugLifespeaker,
  ccugLightracer,
  ccugPowdercoat,
  ccugProgenitor,
  ccugReeftender,
  ccugRekindled,
  ccugRootwhisperer,
  ccugSkitterclaw,
  ccugSwarmshift,
  ccugVeilpiercer,
  ccugVimthreader,
  ccugWildborn,
  ccugWoebound,
];

export function findClass(id: string): ClassDef | undefined {
  return CLASSES.find((c) => c.id === id);
}

export function gameName(id: ClassDef["game"]): string {
  return GAMES.find((g) => g.id === id)?.name ?? id;
}
