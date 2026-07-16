// ⚔️ Dungeon logic — an ascending ladder of shadow monsters (fase 1 → fase 3),
// each random within its tier and each stronger than the last. Clearing the
// whole ladder advances the "dungeon level" (wave): enemies then deal MORE
// damage and take LESS. That level persists (resets weekly), plus a score
// ranking and heart drops. Kept out of the component so the rules are testable.
import { PETS, PET_TYPES, getStageLevel, getPetOfStage, type EvolutionStage } from '../types/progression';
import { STORAGE_KEYS } from './storageKeys';

export interface DungeonEnemy {
  namePt: string;
  nameEn: string;
  stage: string;       // sprite key ('shadow-<pet>-<fase>')
  hp: number;
  atk: number;
  speed: number;       // timing-bar sweeps per second (higher = harder)
  points: number;      // Bits granted when defeated
  dmgReduction: number; // 0..~0.7 — fraction of the player's damage it shrugs off
}

// Enemies always climb these tiers in order within a wave (weakest → strongest):
// two shadow monsters per phase, fase 1 → fase 3.
export type EnemyTier = 'fase-1' | 'fase-2' | 'fase-3';
export const LADDER_TIERS: EnemyTier[] = ['fase-1', 'fase-1', 'fase-2', 'fase-2', 'fase-3', 'fase-3'];

// No daily run cap: entry is gated only by HP (losing costs a real heart, so the
// player can go as often as they can afford). Heart drops are deliberately rare.
const HEART_DROP_DAILY_CAP = 2;            // hearts the dungeon can drop per day
const HEART_DROP_CHANCE = 0.05;            // per enemy defeated (very low)

// Base enemy stats per tier, before the per-wave difficulty scaling. Within a
// tier, the SECOND ladder slot is slightly stronger (see buildDungeonWave).
const TIER_BASE: Record<EnemyTier, { hp: number; atk: number; speed: number; points: number }> = {
  'fase-1': { hp: 7,  atk: 2, speed: 0.9,  points: 2 },
  'fase-2': { hp: 13, atk: 4, speed: 1.1,  points: 5 },
  'fase-3': { hp: 22, atk: 7, speed: 1.45, points: 10 },
};

// Sombra de qual forma luta em cada tier: qualquer fase equivalente de
// qualquer pet, exceto a forma atual do jogador.
function poolForTier(tier: EnemyTier, excludeStage: string): string[] {
  const phaseIdx = Number(tier.slice(-1)) - 1;
  const pool = PET_TYPES.map(p => PETS[p].phases[phaseIdx]).filter(f => f !== excludeStage);
  return pool.length > 0 ? pool : PET_TYPES.map(p => PETS[p].phases[phaseIdx]);
}

function shadowNames(formId: string): { namePt: string; nameEn: string } {
  const pet = PETS[getPetOfStage(formId)];
  const level = getStageLevel(formId) as Exclude<EvolutionStage, 'egg'>;
  const base = pet.phaseNames[Number(level.slice(-1)) - 1];
  return { namePt: `${base} Sombrio`, nameEn: `Shadow ${base}` };
}

/**
 * Build one wave: 6 shadow monsters climbing fase 1 → fase 3 (two per phase),
 * with stats scaled by the dungeon `level`. Higher level = more enemy damage
 * dealt and less damage taken (dmgReduction). Random each call.
 */
export function buildDungeonWave(level: number, petStage: string): DungeonEnemy[] {
  // A "level" is roughly one player-phase of difficulty: level 1 suits fase 1,
  // level 2 fase 2… so a floor a couple levels above the player is brutal.
  const step = Math.max(0, level - 1);
  const hpMult = 1 + 0.14 * step;
  const atkMult = 1 + 0.2 * step;
  const dmgReduction = Math.min(0.72, 0.11 * step);
  const speedBump = Math.min(0.5, 0.05 * step);
  const ptsMult = 1 + 0.12 * step;

  return LADDER_TIERS.map((tier, i) => {
    const base = TIER_BASE[tier];
    // Second slot of each phase pair is a bit stronger, keeping the ladder rising.
    const slotMult = i % 2 === 1 ? 1.18 : 1;
    const pool = poolForTier(tier, petStage);
    const key = pool[Math.floor(Math.random() * pool.length)];
    const names = shadowNames(key);
    const variance = 0.9 + Math.random() * 0.2;    // ±10% on HP
    return {
      ...names,
      stage: `shadow-${key}`,
      hp: Math.max(5, Math.round(base.hp * hpMult * slotMult * variance)),
      atk: Math.max(2, Math.round(base.atk * atkMult * slotMult)),
      speed: +(base.speed * (i % 2 === 1 ? 1.05 : 1) + speedBump).toFixed(2),
      points: Math.max(2, Math.round(base.points * ptsMult * slotMult)),
      dmgReduction: +dmgReduction.toFixed(2),
    };
  });
}

// ── Dungeon base level (persists; resets weekly) ────────────────────────────
function weekKey(d = new Date()): string {
  // Simple year+week bucket — good enough for a weekly reset boundary.
  const onejan = new Date(d.getFullYear(), 0, 1);
  const days = Math.floor((d.getTime() - onejan.getTime()) / 86400000);
  const week = Math.floor((days + onejan.getDay()) / 7);
  return `${d.getFullYear()}-W${week}`;
}

/** Base dungeon level (floor 1's difficulty). Resets to 1 each week. */
export function getDungeonDifficulty(): number {
  const week = weekKey();
  try {
    const rec = JSON.parse(localStorage.getItem(STORAGE_KEYS.DUNGEON_DIFFICULTY) || 'null');
    if (rec?.week === week && typeof rec.level === 'number') return rec.level;
  } catch { /* fall through to reset */ }
  localStorage.setItem(STORAGE_KEYS.DUNGEON_DIFFICULTY, JSON.stringify({ week, level: 1 }));
  return 1;
}

/** Raise the persisted base level to at least `level` (called on run completion). */
export function setDungeonDifficultyAtLeast(level: number): number {
  const next = Math.max(getDungeonDifficulty(), level);
  localStorage.setItem(STORAGE_KEYS.DUNGEON_DIFFICULTY, JSON.stringify({ week: weekKey(), level: next }));
  return next;
}

// ── Best score (ranking) ─────────────────────────────────────────────────────
export function getDungeonBest(): number {
  const v = Number(localStorage.getItem(STORAGE_KEYS.DUNGEON_BEST) || '0');
  return Number.isFinite(v) ? v : 0;
}

/** Record a run's score; returns the (possibly new) best. */
export function recordDungeonScore(score: number): number {
  const best = Math.max(getDungeonBest(), score);
  localStorage.setItem(STORAGE_KEYS.DUNGEON_BEST, String(best));
  return best;
}

// ── Heart drops ──────────────────────────────────────────────────────────────
/** Roll for a heart drop (capped per day). Returns true when one dropped. */
export function rollDungeonHeartDrop(): boolean {
  const today = new Date().toDateString();
  let rec = { date: today, count: 0 };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.DUNGEON_HEART_DROPS) || 'null');
    if (saved?.date === today) rec = saved;
  } catch { /* fresh */ }
  if (rec.count >= HEART_DROP_DAILY_CAP) return false;
  if (Math.random() > HEART_DROP_CHANCE) return false;
  localStorage.setItem(STORAGE_KEYS.DUNGEON_HEART_DROPS, JSON.stringify({ date: today, count: rec.count + 1 }));
  return true;
}
