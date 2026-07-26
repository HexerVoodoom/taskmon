// 🛒 Shop catalog — bought with minigame points (gamePoints). A la carte food
// only: each item goes to the Items folder as regular food (same +1 energy
// feed as task-completion food, utils/App.tsx `handleFeed`). Effects are
// applied in App.tsx (handleShopBuy).
export type ShopItemKind = 'food';

export interface ShopItem {
  id: string;
  kind: ShopItemKind;
  icon: string;
  namePt: string;
  nameEn: string;
  descPt: string;
  descEn: string;
  price: number;
}

export const HEART_HEAL = 1;   // hearts restored when a heart item is USED

export const HEART_ITEM_EMOJI = '💗';

// Consumables that live in the Items folder alongside food, but behave
// differently when USED: the heart item only heals HP and the Glitchtama
// grants a perfect day. Keyed by their inventory emoji. Neither is sold in
// the shop anymore (food-only) — hearts/Glitchtamas only come from dungeon
// drops (utils/dungeon.ts).
export interface SpecialItem {
  emoji: string;
  kind: 'heart' | 'glitchtama';
  namePt: string;
  nameEn: string;
  descPt: string;
  descEn: string;
}

// 🌀 Glitchtama — dropped by completing all 5 dungeon floors. Using it grants
// one perfect day (an evolution point), no questions asked.
export const GLITCHTAMA_EMOJI = '🌀';

export const SPECIAL_ITEMS: Record<string, SpecialItem> = {
  [GLITCHTAMA_EMOJI]: {
    emoji: GLITCHTAMA_EMOJI, kind: 'glitchtama',
    namePt: 'Glitchtama', nameEn: 'Glitchtama',
    descPt: 'Usar concede 1 dia perfeito (+1 ponto de evolução)', descEn: 'Use to gain 1 perfect day (+1 evolution point)',
  },
  [HEART_ITEM_EMOJI]: {
    emoji: HEART_ITEM_EMOJI, kind: 'heart',
    namePt: 'Coraçãozinho', nameEn: 'Little Heart',
    descPt: `Usar cura ${HEART_HEAL} coração`, descEn: `Use to heal ${HEART_HEAL} heart`,
  },
};

export function isSpecialItem(emoji: string): boolean {
  return emoji in SPECIAL_ITEMS;
}

// Comidas de tipos diferentes — todas dão o mesmo +1 de energia ao comer
// (limite de 5/hora), a variedade é só sabor/visual.
export const SHOP_ITEMS: ShopItem[] = [
  { id: 'food-apple', kind: 'food', icon: '🍎',
    namePt: 'Maçã', nameEn: 'Apple',
    descPt: 'Comer dá +1 de energia', descEn: 'Eating gives +1 energy', price: 10 },
  { id: 'food-grapes', kind: 'food', icon: '🍇',
    namePt: 'Uvas', nameEn: 'Grapes',
    descPt: 'Comer dá +1 de energia', descEn: 'Eating gives +1 energy', price: 10 },
  { id: 'food-donut', kind: 'food', icon: '🍩',
    namePt: 'Rosquinha', nameEn: 'Donut',
    descPt: 'Comer dá +1 de energia', descEn: 'Eating gives +1 energy', price: 12 },
  { id: 'food-salad', kind: 'food', icon: '🥗',
    namePt: 'Salada', nameEn: 'Salad',
    descPt: 'Comer dá +1 de energia', descEn: 'Eating gives +1 energy', price: 12 },
  { id: 'food-chicken', kind: 'food', icon: '🍗',
    namePt: 'Coxinha de Frango', nameEn: 'Chicken Leg',
    descPt: 'Comer dá +1 de energia', descEn: 'Eating gives +1 energy', price: 15 },
  { id: 'food-pizza', kind: 'food', icon: '🍕',
    namePt: 'Pizza', nameEn: 'Pizza',
    descPt: 'Comer dá +1 de energia', descEn: 'Eating gives +1 energy', price: 15 },
  { id: 'food-noodles', kind: 'food', icon: '🍜',
    namePt: 'Macarrão', nameEn: 'Noodles',
    descPt: 'Comer dá +1 de energia', descEn: 'Eating gives +1 energy', price: 18 },
  { id: 'food-cake', kind: 'food', icon: '🍰',
    namePt: 'Bolo', nameEn: 'Cake',
    descPt: 'Comer dá +1 de energia', descEn: 'Eating gives +1 energy', price: 20 },
];
