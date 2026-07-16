// 🛒 Shop catalog — bought with minigame points (gamePoints).
// Effects are applied in App.tsx (handleShopBuy).
export type ShopItemKind = 'heart' | 'bg';

/**
 * Purchase gate. Locked items still show in the shop — darkened, with a
 * padlock; tapping them reveals HOW to unlock:
 * - 'mission': buyable after the mission (utils/missions.ts) is complete.
 */
export type UnlockReq = { kind: 'mission'; missionId: string };

export interface ShopItem {
  id: string;
  kind: ShopItemKind;
  icon: string;
  namePt: string;
  nameEn: string;
  descPt: string;
  descEn: string;
  price: number;
  /** When present, purchasing is locked until the requirement is met. */
  unlock?: UnlockReq;
}

export const HEART_HEAL = 1;   // hearts restored when a heart item is USED

export const HEART_ITEM_EMOJI = '💗';

// Consumables that live in the Items folder alongside food, but behave
// differently when USED: the heart item only heals HP and the Glitchtama
// grants a perfect day. Keyed by their inventory emoji.
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

export const SHOP_ITEMS: ShopItem[] = [
  // Heart item — the ONLY buyable HP heal. Goes to the Items folder; using it
  // restores a heart. Also drops (rarely) in the dungeon.
  { id: 'heart-item', kind: 'heart', icon: HEART_ITEM_EMOJI,
    namePt: 'Coraçãozinho', nameEn: 'Little Heart',
    descPt: `Vai pra pastinha; usar cura ${HEART_HEAL} coração`, descEn: `Goes to Items; use to heal ${HEART_HEAL} heart`, price: 150 },
  // (Glitchtama is deliberately NOT sold — the only way to get one is
  // clearing all 5 dungeon floors.)
  // Pet-box backgrounds — permanent, equippable (css in utils/backgrounds.ts)
  { id: 'bg-night',  kind: 'bg', icon: '🌌',
    namePt: 'Céu Noturno',  nameEn: 'Night Sky',
    descPt: 'Cenário estrelado para o box do pet', descEn: 'Starry backdrop for the pet box', price: 150 },
  { id: 'bg-desert', kind: 'bg', icon: '🏜️',
    namePt: 'Deserto Pixel', nameEn: 'Pixel Desert',
    descPt: 'Pôr do sol pixelado no deserto', descEn: 'Pixel sunset in the desert', price: 150 },
  { id: 'bg-matrix', kind: 'bg', icon: '🟩',
    namePt: 'Matriz Verde', nameEn: 'Green Matrix',
    descPt: 'Grade digital verde estilo matrix', descEn: 'Matrix-style green digital grid', price: 150 },
  { id: 'bg-forest', kind: 'bg', icon: '🌲',
    namePt: 'Floresta Nativa', nameEn: 'Native Forest',
    descPt: 'A floresta onde todo Taskmon nasce', descEn: 'The forest where every Taskmon is born', price: 150 },
  { id: 'bg-ocean', kind: 'bg', icon: '🐠',
    namePt: 'Fundo do Mar', nameEn: 'Deep Sea',
    descPt: 'Profundezas azuis com bolhas subindo', descEn: 'Blue depths with rising bubbles', price: 150 },
  { id: 'bg-gameboy', kind: 'bg', icon: '🕹️',
    namePt: 'LCD Retrô', nameEn: 'Retro LCD',
    descPt: 'Tela verde monocromática de 1989', descEn: 'Monochrome green screen, 1989 style', price: 150 },
  { id: 'bg-snow', kind: 'bg', icon: '❄️',
    namePt: 'Terra Gelada', nameEn: 'Freezeland',
    descPt: 'Planície congelada sob a neve', descEn: 'Frozen plains under falling snow', price: 180 },
  { id: 'bg-lava', kind: 'bg', icon: '🌋',
    namePt: 'Montanha de Lava', nameEn: 'Lava Mountain',
    descPt: 'Rocha escura e magma incandescente', descEn: 'Dark rock and glowing magma', price: 180 },
  { id: 'bg-sakura', kind: 'bg', icon: '🌸',
    namePt: 'Cerejeira', nameEn: 'Cherry Blossom',
    descPt: 'Pétalas cor-de-rosa ao vento', descEn: 'Pink petals drifting in the wind', price: 180 },
  { id: 'bg-toytown', kind: 'bg', icon: '🧸',
    namePt: 'Cidade dos Brinquedos', nameEn: 'Toy Town',
    descPt: 'Blocos pastel de uma cidade de brinquedo', descEn: 'Pastel blocks of a toy city', price: 200 },
  { id: 'bg-synthwave', kind: 'bg', icon: '🌆',
    namePt: 'Synthwave', nameEn: 'Synthwave',
    descPt: 'Sol neon e grade infinita anos 80', descEn: 'Neon sun over an endless 80s grid', price: 250 },
  // Mission-gated backdrops — visible from day one, locked behind achievements
  // (utils/missions.ts). Completing the mission unlocks the PURCHASE.
  { id: 'bg-mission-filecity', kind: 'bg', icon: '🏘️',
    namePt: 'Vila Pixel', nameEn: 'Pixel Village',
    descPt: 'A vila onde tudo começa', descEn: 'The village where it all begins', price: 300,
    unlock: { kind: 'mission', missionId: 'mission-fase2' } },
  { id: 'bg-mission-infinity', kind: 'bg', icon: '🗻',
    namePt: 'Monte Infinito', nameEn: 'Mount Infinity',
    descPt: 'O pico final sob as estrelas', descEn: 'The final peak under the stars', price: 300,
    unlock: { kind: 'mission', missionId: 'mission-fase3' } },
  { id: 'bg-mission-coliseum', kind: 'bg', icon: '🏟️',
    namePt: 'Coliseu Digital', nameEn: 'Digital Coliseum',
    descPt: 'Arena dourada dos gladiadores', descEn: 'Golden arena of gladiators', price: 300,
    unlock: { kind: 'mission', missionId: 'mission-kills-100' } },
  { id: 'bg-mission-abyss', kind: 'bg', icon: '🕳️',
    namePt: 'Abismo da Masmorra', nameEn: 'Dungeon Abyss',
    descPt: 'O fundo vermelho da masmorra', descEn: 'The dungeon\'s crimson depths', price: 300,
    unlock: { kind: 'mission', missionId: 'mission-runs-3' } },
  { id: 'bg-mission-dinoland', kind: 'bg', icon: '🦕',
    namePt: 'Vale dos Dinos', nameEn: 'Dino Valley',
    descPt: 'Pôr do sol pré-histórico', descEn: 'Prehistoric sunset', price: 300,
    unlock: { kind: 'mission', missionId: 'mission-dino-1000' } },
  { id: 'bg-mission-aurora', kind: 'bg', icon: '🌠',
    namePt: 'Aurora Digital', nameEn: 'Digital Aurora',
    descPt: 'Luzes dançando no céu polar', descEn: 'Lights dancing in the polar sky', price: 300,
    unlock: { kind: 'mission', missionId: 'mission-perfect-30' } },
];
