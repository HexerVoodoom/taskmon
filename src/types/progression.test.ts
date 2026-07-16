import { describe, it, expect } from 'vitest';
import {
  getStageLevel, canSelectWeekdays, getPetOfStage, stageForLevel,
  getMaxEnergyForStage, FORM_REQUIREMENTS, MAX_HP_BY_FORM, PETS,
} from './progression';

describe('getStageLevel', () => {
  it('maps egg to egg', () => {
    expect(getStageLevel('egg')).toBe('egg');
  });

  it('maps each phase of each pet', () => {
    expect(getStageLevel('vix-1')).toBe('fase-1');
    expect(getStageLevel('momo-2')).toBe('fase-2');
    expect(getStageLevel('kiwi-3')).toBe('fase-3');
  });

  it('maps legacy DigiApp stages to the equivalent level', () => {
    expect(getStageLevel('digiegg')).toBe('egg');
    expect(getStageLevel('pichimon')).toBe('fase-1');   // baby-i
    expect(getStageLevel('nyaromon')).toBe('fase-1');   // baby-ii
    expect(getStageLevel('tapirmon')).toBe('fase-2');   // rookie
    expect(getStageLevel('greymon')).toBe('fase-2');    // champion (item)
    expect(getStageLevel('angewomon')).toBe('fase-3');  // ultimate
    expect(getStageLevel('gaioumon-itto')).toBe('fase-3'); // ultra
  });

  it('falls back to egg for unknown stages', () => {
    expect(getStageLevel('unknown-pet')).toBe('egg');
  });
});

describe('getPetOfStage / stageForLevel', () => {
  it('extracts the pet from a form id', () => {
    expect(getPetOfStage('vix-2')).toBe('vix');
    expect(getPetOfStage('kiwi-1')).toBe('kiwi');
  });

  it('uses the fallback for egg/unknown', () => {
    expect(getPetOfStage('egg', 'momo')).toBe('momo');
    expect(getPetOfStage('whatever', 'kiwi')).toBe('kiwi');
  });

  it('builds the form id for a pet at a level', () => {
    expect(stageForLevel('vix', 'egg')).toBe('egg');
    expect(stageForLevel('momo', 'fase-1')).toBe('momo-1');
    expect(stageForLevel('kiwi', 'fase-3')).toBe('kiwi-3');
  });
});

describe('canSelectWeekdays', () => {
  it('returns false before fase 2', () => {
    expect(canSelectWeekdays('egg')).toBe(false);
    expect(canSelectWeekdays('vix-1')).toBe(false);
  });

  it('returns true from fase 2 on', () => {
    expect(canSelectWeekdays('vix-2')).toBe(true);
    expect(canSelectWeekdays('momo-3')).toBe(true);
  });

  it('returns false for unknown stages', () => {
    expect(canSelectWeekdays('unknown')).toBe(false);
  });
});

describe('requirements & HP scale with the level', () => {
  const order = ['egg', 'fase-1', 'fase-2', 'fase-3'] as const;

  it('required tasks grow monotonically', () => {
    for (let i = 1; i < order.length; i++) {
      expect(FORM_REQUIREMENTS[order[i]].required).toBeGreaterThan(FORM_REQUIREMENTS[order[i - 1]].required);
    }
  });

  it('activity cap grows monotonically', () => {
    for (let i = 1; i < order.length; i++) {
      expect(FORM_REQUIREMENTS[order[i]].cap).toBeGreaterThan(FORM_REQUIREMENTS[order[i - 1]].cap);
    }
  });

  it('max HP grows monotonically', () => {
    for (let i = 1; i < order.length; i++) {
      expect(MAX_HP_BY_FORM[order[i]]).toBeGreaterThan(MAX_HP_BY_FORM[order[i - 1]]);
    }
  });

  it('energy bars = the stage task requirement', () => {
    expect(getMaxEnergyForStage('vix-2')).toBe(FORM_REQUIREMENTS['fase-2'].required);
    expect(getMaxEnergyForStage('egg')).toBe(FORM_REQUIREMENTS.egg.required);
  });
});

describe('PETS metadata', () => {
  it('every pet has 3 phases and 3 names, tiered correctly', () => {
    for (const pet of Object.values(PETS)) {
      expect(pet.phases).toHaveLength(3);
      expect(pet.phaseNames).toHaveLength(3);
      pet.phases.forEach((formId, i) => {
        expect(getStageLevel(formId)).toBe(`fase-${i + 1}`);
      });
    }
  });
});
