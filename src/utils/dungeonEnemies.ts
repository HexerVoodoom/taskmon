// 👻 Monstros dedicados da masmorra — criaturas originais (não são sombras
// dos pets) misturadas no sorteio de utils/dungeon.ts pra dar mais variedade
// visual às runs. Sprite gerado no Higgsfield, registrado em utils/sprites.ts
// (chave 'enemy-<id>'). Tier = fase equivalente de dificuldade (fase 1→3).
import type { EnemyTier } from './dungeon';

export interface DungeonMonster {
  id: string;
  namePt: string;
  nameEn: string;
  tier: EnemyTier;
}

export const DUNGEON_MONSTERS: DungeonMonster[] = [
  { id: 'slime', namePt: 'Geleia Sombria', nameEn: 'Shadow Slime', tier: 'fase-1' },
  { id: 'wisp', namePt: 'Fogo-Fátuo', nameEn: 'Will-o\'-Wisp', tier: 'fase-1' },
  { id: 'mummy', namePt: 'Múmia Travessa', nameEn: 'Mischievous Mummy', tier: 'fase-2' },
  { id: 'golem', namePt: 'Golem Enferrujado', nameEn: 'Rusty Golem', tier: 'fase-2' },
  { id: 'demon', namePt: 'Demônio Alado', nameEn: 'Winged Demon', tier: 'fase-3' },
  { id: 'wraith', namePt: 'Espectro Encapuzado', nameEn: 'Hooded Wraith', tier: 'fase-3' },
];

/** Monstros dedicados de um tier (sprite key 'enemy-<id>'). */
export function monstersForTier(tier: EnemyTier): DungeonMonster[] {
  return DUNGEON_MONSTERS.filter(m => m.tier === tier);
}
