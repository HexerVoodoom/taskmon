import { describe, it, expect } from 'vitest';
import { MISSIONS, getMissionProgress, isMissionComplete, isShopItemUnlocked, type MissionState } from './missions';
import { SHOP_ITEMS } from './shop';
import { PET_BACKGROUNDS } from './backgrounds';

const base: MissionState = {
  evolutionStage: 'kiwi-1',
  unlockedEvolutions: ['egg', 'kiwi-1'],
  dungeonKills: 0,
  dungeonRunsCompleted: 0,
  dinoBest: 0,
  totalPerfectDays: 0,
};

describe('missions — progress', () => {
  it('stage missions trigger on reaching the level (current OR unlocked forms)', () => {
    const p0 = getMissionProgress(base);
    expect(p0['mission-fase2']).toBe(0);
    expect(p0['mission-fase3']).toBe(0);

    // Current form at fase 2 (legacy champion forms count too)
    const f2 = getMissionProgress({ ...base, evolutionStage: 'kiwi-2' });
    expect(f2['mission-fase2']).toBe(1);
    expect(f2['mission-fase3']).toBe(0);

    // Ever-unlocked fase 3 counts even after degeneration back to fase 1
    const f3 = getMissionProgress({ ...base, evolutionStage: 'kiwi-1', unlockedEvolutions: ['kiwi-3'] });
    expect(f3['mission-fase2']).toBe(1);
    expect(f3['mission-fase3']).toBe(1);
  });

  it('counter missions clamp at the target', () => {
    const p = getMissionProgress({ ...base, dungeonKills: 250, dinoBest: 5000, totalPerfectDays: 31, dungeonRunsCompleted: 10 });
    expect(p['mission-kills-100']).toBe(100);
    expect(p['mission-dino-1000']).toBe(1000);
    expect(p['mission-perfect-30']).toBe(30);
    expect(p['mission-runs-3']).toBe(3);
  });
});

describe('missions — shop unlock gating', () => {
  it('every mission unlocks a distinct shop item, with CSS defined for bg rewards', () => {
    const rewards = MISSIONS.map(m => m.bgReward);
    expect(new Set(rewards).size).toBe(rewards.length);
    for (const id of rewards) {
      const item = SHOP_ITEMS.find(i => i.id === id);
      expect(item, id).toBeDefined();
      expect(item!.unlock).toEqual({ kind: 'mission', missionId: MISSIONS.find(m => m.bgReward === id)!.id });
      if (item!.kind === 'bg') expect(PET_BACKGROUNDS[id]?.css).toBeTruthy();
    }
  });

  it('mission-gated item unlocks only when the mission completes', () => {
    const item = SHOP_ITEMS.find(i => i.id === 'bg-mission-coliseum')!;
    const at = (kills: number) => getMissionProgress({ ...base, dungeonKills: kills });
    expect(isMissionComplete('mission-kills-100', at(99))).toBe(false);
    expect(isMissionComplete('mission-kills-100', at(100))).toBe(true);
    expect(isShopItemUnlocked(item, at(99))).toBe(false);
    expect(isShopItemUnlocked(item, at(100))).toBe(true);
  });

  it('plain items are always unlocked; Glitchtama is never sold', () => {
    const progress = getMissionProgress(base);
    const heart = SHOP_ITEMS.find(i => i.id === 'heart-item')!;
    expect(isShopItemUnlocked(heart, progress)).toBe(true);
    expect(SHOP_ITEMS.some(i => i.id === 'glitchtama')).toBe(false);
  });
});
