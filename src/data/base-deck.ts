import type { Card } from "./types";

let counter = 0;
const id = (label: string) => {
  counter += 1;
  return `base-${label}-${counter}`;
};

function plain(value: Card["value"], label: string): Card {
  return { id: id(label), value, rolling: false, effects: [] };
}

export function buildBaseDeck(): Card[] {
  const cards: Card[] = [];
  for (let i = 0; i < 6; i++) cards.push(plain(0, "0"));
  for (let i = 0; i < 5; i++) cards.push(plain(1, "+1"));
  for (let i = 0; i < 5; i++) cards.push(plain(-1, "-1"));
  cards.push(plain(2, "+2"));
  cards.push(plain(-2, "-2"));
  cards.push(plain("x2", "x2"));
  cards.push(plain("miss", "miss"));
  return cards;
}
