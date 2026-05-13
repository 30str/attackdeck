import type { CardSpec, Effect, Perk } from "./types";

export function card(
  value: CardSpec["value"],
  rolling: boolean = false,
  ...effects: Effect[]
): CardSpec {
  const out: CardSpec = { value };
  if (rolling) out.rolling = true;
  if (effects.length) out.effects = effects;
  return out;
}

export function remove(
  id: string,
  count: number,
  n: number,
  c: CardSpec,
  description: string
): Perk {
  return { id, description, count, ops: [{ op: "remove", card: c, count: n }] };
}

export function add(
  id: string,
  count: number,
  n: number,
  c: CardSpec,
  description: string
): Perk {
  return { id, description, count, ops: [{ op: "add", card: c, count: n }] };
}

export function replace(
  id: string,
  count: number,
  fromN: number,
  from: CardSpec,
  toN: number,
  to: CardSpec,
  description: string
): Perk {
  return {
    id,
    description,
    count,
    ops: [
      { op: "remove", card: from, count: fromN },
      { op: "add", card: to, count: toN },
    ],
  };
}

export function multi(
  id: string,
  count: number,
  description: string,
  ...ops: Perk["ops"]
): Perk {
  return { id, description, count, ops };
}

export function note(id: string, count: number, description: string): Perk {
  return { id, description, count, ops: [] };
}
