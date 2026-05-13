export type GameId =
  | "gloomhaven"
  | "gloomhaven-2e"
  | "forgotten-circles"
  | "jaws-of-the-lion"
  | "frosthaven"
  | "trail-of-ashes"
  | "crimson-scales"
  | "ccug";

export type RulesVariant = "gh" | "fh";

export type Effect =
  | "fire"
  | "ice"
  | "earth"
  | "air"
  | "light"
  | "dark"
  | "wild"
  | "wound"
  | "poison"
  | "immobilize"
  | "stun"
  | "muddle"
  | "disarm"
  | "curse"
  | "bless"
  | "invisible"
  | "push"
  | "pull"
  | "pierce"
  | "target"
  | "advantage"
  | "refresh-item"
  | "refresh-spent"
  | "regenerate"
  | "heal"
  | "shield"
  | "retaliate"
  | "swing"
  | "brittle"
  | "ward"
  | "strengthen"
  | "impair"
  | "bane"
  | "chill"
  | "dodge"
  | "safeguard"
  | "custom";

export type CardValue = number | "miss" | "x2";

export type Card = {
  id: string;
  value: CardValue;
  rolling: boolean;
  effects: Effect[];
  oneShot?: boolean;
};

export type PerkOp =
  | { op: "add"; card: CardSpec; count: number }
  | { op: "remove"; card: CardSpec; count: number };

export type CardSpec = {
  value: CardValue;
  rolling?: boolean;
  effects?: Effect[];
};

export type Perk = {
  id: string;
  description: string;
  count: number;
  ops: PerkOp[];
};

export type ClassDef = {
  id: string;
  game: GameId;
  name: string;
  codeName?: string;
  iconRef: string;
  rulesVariant: RulesVariant;
  startingDeck: "base" | Card[];
  perks: Perk[];
};

export function isUnlockable(klass: ClassDef): boolean {
  return klass.codeName !== undefined;
}

export type GameCategory = "official" | "fan";

export type Game = {
  id: GameId;
  name: string;
  category: GameCategory;
};
