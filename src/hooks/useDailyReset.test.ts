import { describe, it, expect } from 'vitest';
import { FORM_REQUIREMENTS, MAX_HP_BY_FORM, getStageLevel, canSelectWeekdays, getMaxEnergyForStage } from '../types/progression';
import { getNextEvolution } from '../utils/dailyReset';
import { weekKey } from '../utils/economy';

// Replicate the performDailyReset state-updater logic for unit testing.
// This mirrors the implementation in useDailyReset.ts exactly.
function simulateReset(prev: any): any {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayString = yesterday.toDateString();
  const yesterdayWeekDay = yesterday.getDay();

  const currentLevel = getStageLevel(prev.evolutionStage);
  const requirements = FORM_REQUIREMENTS[currentLevel];
  const requiredToday = requirements.required;

  let dailyDone = 0;
  const availableActivities = !canSelectWeekdays(prev.evolutionStage)
    ? prev.activities
    : prev.activities.filter((a: any) => a.weekDays?.includes(yesterdayWeekDay));

  availableActivities.forEach((activity: any) => {
    let isComplete = false;
    if (activity.steps.length > 0) {
      isComplete = activity.steps.every((s: any) => s.completed);
    } else {
      isComplete = !!activity.completedToday && activity.lastCompletedDate === yesterdayString;
    }
    if (isComplete) dailyDone++;
  });

  dailyDone += prev.tasks.filter((t: any) => t.completed).length;

  // Daily goal = min(registered, requirement); perfect day = goal met (with at
  // least 1 task registered) AND full energy at day's end
  const totalTasks = availableActivities.length + prev.tasks.length;
  const dailyGoal = Math.min(totalTasks, requiredToday);
  // Energy bars = the stage's task requirement (requiredToday), not maxHP.
  const energyWasFull = (prev.energyPoints ?? 0) >= requiredToday;
  const dayWasPerfect = totalTasks > 0 && dailyDone >= dailyGoal && energyWasFull;

  let newHP = prev.healthPoints;
  let newPerfectDays = prev.perfectDays;
  let newEvolutionStage = prev.evolutionStage;
  const finalUnlockedEvolutions = [...prev.unlockedEvolutions];
  let newMaxActivityCap = prev.maxActivityCap;

  // Proportional HP loss vs the same daily goal.
  const completionRatio = dailyGoal > 0 ? Math.min(1, dailyDone / dailyGoal) : 1;
  let heartsLost = Math.floor((1 - completionRatio) * prev.maxHealthPoints);

  // Dia sem tarefa cadastrada é neutro (não perde coração nem dia perfeito).
  const neutralDay = totalTasks === 0;

  // 🛡️ Escudo semanal automático (1×/semana) absorve um dia ruim.
  const currentWeek = weekKey(new Date());
  const shieldAvailable = (prev.shieldUsedWeek ?? '') !== currentWeek;
  const badDay = !neutralDay && (heartsLost > 0 || !dayWasPerfect);
  const shieldUsed = badDay && shieldAvailable;
  let newShieldUsedWeek = prev.shieldUsedWeek ?? '';
  if (shieldUsed) {
    heartsLost = 0;
    newShieldUsedWeek = currentWeek;
  }

  if (heartsLost > 0) {
    newHP = Math.max(0, prev.healthPoints - heartsLost);
  }

  if (dayWasPerfect) {
    newPerfectDays++;
  } else if (!neutralDay && !shieldUsed) {
    newPerfectDays = Math.max(0, prev.perfectDays - 1);
  }

  if (newPerfectDays >= requirements.required) {
    newPerfectDays = 0;
    newEvolutionStage = getNextEvolution(prev.evolutionStage, prev.eggType ?? 'vix');

    const newStageLevel = getStageLevel(newEvolutionStage);
    newHP = MAX_HP_BY_FORM[newStageLevel];
    const newCap = FORM_REQUIREMENTS[newStageLevel].cap;
    if (newCap > newMaxActivityCap) newMaxActivityCap = newCap;
    if (!finalUnlockedEvolutions.includes(newEvolutionStage)) {
      finalUnlockedEvolutions.push(newEvolutionStage);
    }
  }

  // 💤 HP 0 → modo dorminhoco, sem regressão de fase automática.
  let newSleepyMode = prev.sleepyMode ?? false;
  if (newHP === 0) {
    newSleepyMode = true;
    newHP = 0.5;
  } else if (newHP >= 1) {
    newSleepyMode = false;
  }

  const resetActivities = prev.activities.map((a: any) => ({
    ...a,
    steps: a.steps.map((s: any) => ({ ...s, completed: false })),
    completedToday: false,
  }));
  const resetTasks = prev.tasks.map((t: any) => ({ ...t, completed: false }));
  const finalStageLevel = getStageLevel(newEvolutionStage);
  const newMaxHP = MAX_HP_BY_FORM[finalStageLevel];

  return {
    ...prev,
    activities: resetActivities,
    tasks: resetTasks,
    healthPoints: newHP,
    maxHealthPoints: newMaxHP,
    perfectDays: newPerfectDays,
    evolutionStage: newEvolutionStage,
    unlockedEvolutions: finalUnlockedEvolutions,
    degeneratedByHP: false,
    sleepyMode: newSleepyMode,
    shieldUsedWeek: newShieldUsedWeek,
    shieldUsed,
    lastDayWasPerfect: dayWasPerfect,
    maxActivityCap: newMaxActivityCap,
  };
}

const baseState = () => ({
  activities: [],
  tasks: [],
  healthPoints: 3,
  maxHealthPoints: 3,
  energyPoints: 10, // full by default (≥ any stage requirement) so task-focused tests aren't affected
  perfectDays: 0,
  evolutionStage: 'vix-2', // fase 2 — requer 5 tarefas/dia
  eggType: 'vix' as const,
  unlockedEvolutions: ['egg', 'vix-1', 'vix-2'],
  maxActivityCap: 7,
  lastResetDate: 'yesterday',
  // Escudo já consumido nesta semana — os testes de punição medem a regra crua;
  // os testes do escudo passam '' explicitamente.
  shieldUsedWeek: weekKey(new Date()),
});

describe('performDailyReset — proportional HP loss', () => {
  it('no penalty when there were no tasks to do', () => {
    const result = simulateReset({ ...baseState(), healthPoints: 3 });
    expect(result.healthPoints).toBe(3);
    expect(result.lastDayWasPerfect).toBe(false);
  });

  it('no penalty when all tasks were completed', () => {
    const tasks = [{ id: 't1', completed: true }, { id: 't2', completed: true }];
    const result = simulateReset({ ...baseState(), tasks, healthPoints: 3 });
    expect(result.healthPoints).toBe(3);
  });

  it('meeting the stage requirement is safe even with many registered tasks', () => {
    // fase 2 requires 5; 10 registered but 5 done → goal met → no loss
    const tasks = Array.from({ length: 10 }, (_, i) => ({ id: `t${i}`, completed: i < 5 }));
    const result = simulateReset({ ...baseState(), tasks, healthPoints: 3 });
    expect(result.healthPoints).toBe(3);
  });

  it('doing 1 of the required 5 loses 2 hearts (floor(0.8*3))', () => {
    const tasks = Array.from({ length: 10 }, (_, i) => ({ id: `t${i}`, completed: i < 1 }));
    const result = simulateReset({ ...baseState(), tasks, healthPoints: 3 });
    expect(result.healthPoints).toBe(1);
    expect(result.lastDayWasPerfect).toBe(false);
  });

  it('60% done with 3 hearts loses 1 heart (floor(0.4*3))', () => {
    const tasks = Array.from({ length: 5 }, (_, i) => ({ id: `t${i}`, completed: i < 3 }));
    const result = simulateReset({ ...baseState(), tasks, healthPoints: 3 });
    expect(result.healthPoints).toBe(2);
  });

  it('increments perfectDays on a perfect day', () => {
    // fase 2 requires 5; give 5 completed tasks + full energy (baseState)
    const tasks = Array.from({ length: 5 }, (_, i) => ({ id: `t${i}`, completed: true }));
    const result = simulateReset({ ...baseState(), tasks });
    expect(result.lastDayWasPerfect).toBe(true);
    expect(result.perfectDays).toBeGreaterThanOrEqual(1);
  });

  it('doing ALL registered tasks (fewer than the requirement) + full energy = perfect day', () => {
    // fase 2 requires 5, but only 3 registered — all 3 done, energy full
    const tasks = Array.from({ length: 3 }, (_, i) => ({ id: `t${i}`, completed: true }));
    const result = simulateReset({ ...baseState(), tasks });
    expect(result.lastDayWasPerfect).toBe(true);
    expect(result.healthPoints).toBe(3);
  });

  it('tasks met but energy NOT full → day is not perfect', () => {
    const tasks = Array.from({ length: 5 }, (_, i) => ({ id: `t${i}`, completed: true }));
    const result = simulateReset({ ...baseState(), tasks, energyPoints: 1 });
    expect(result.lastDayWasPerfect).toBe(false);
    // No heart loss either — tasks were all done
    expect(result.healthPoints).toBe(3);
  });

  it('resets activities and tasks to incomplete', () => {
    const tasks = [{ id: 't1', completed: true }];
    const acts = [{ id: 'a1', category: 'Health', steps: [{ id: 's1', label: 'x', completed: true }], weekDays: [0,1,2,3,4,5,6] }];
    const result = simulateReset({ ...baseState(), tasks, activities: acts });
    expect(result.tasks[0].completed).toBe(false);
    expect(result.activities[0].steps[0].completed).toBe(false);
  });
});

describe('getMaxEnergyForStage — energy bars = task requirement', () => {
  it('matches the stage requirement for each form', () => {
    expect(getMaxEnergyForStage('vix-2')).toBe(FORM_REQUIREMENTS['fase-2'].required);  // 5
    expect(getMaxEnergyForStage('momo-3')).toBe(FORM_REQUIREMENTS['fase-3'].required); // 6
    expect(getMaxEnergyForStage('egg')).toBe(FORM_REQUIREMENTS.egg.required);          // 1
  });

  it('can differ from the stage max HP (fase 2: 5 energy bars, 3 hearts)', () => {
    expect(getMaxEnergyForStage('vix-2')).toBe(5);
    expect(MAX_HP_BY_FORM['fase-2']).toBe(3);
  });
});

describe('performDailyReset — dia neutro (sem tarefa cadastrada)', () => {
  it('não perde dias perfeitos num dia sem nenhuma tarefa cadastrada', () => {
    const result = simulateReset({ ...baseState(), perfectDays: 4 });
    expect(result.perfectDays).toBe(4);
    expect(result.healthPoints).toBe(3);
  });
});

describe('performDailyReset — 🛡️ escudo semanal', () => {
  it('absorve a perda de coração e preserva os dias perfeitos quando disponível', () => {
    // 5 tarefas, 1 feita → sem escudo perderia 2 corações e 1 dia perfeito
    const tasks = Array.from({ length: 10 }, (_, i) => ({ id: `t${i}`, completed: i < 1 }));
    const result = simulateReset({ ...baseState(), tasks, perfectDays: 4, shieldUsedWeek: '' });
    expect(result.shieldUsed).toBe(true);
    expect(result.healthPoints).toBe(3);
    expect(result.perfectDays).toBe(4);
    expect(result.shieldUsedWeek).toBe(weekKey(new Date()));
  });

  it('só funciona 1 vez por semana', () => {
    const tasks = Array.from({ length: 10 }, (_, i) => ({ id: `t${i}`, completed: i < 1 }));
    const first = simulateReset({ ...baseState(), tasks, shieldUsedWeek: '' });
    expect(first.shieldUsed).toBe(true);
    const second = simulateReset({ ...first, tasks, healthPoints: 3, perfectDays: 2 });
    expect(second.shieldUsed).toBe(false);
    expect(second.healthPoints).toBe(1); // floor(0.8*3)=2 perdidos
    expect(second.perfectDays).toBe(1);
  });

  it('não é consumido num dia perfeito nem num dia neutro', () => {
    const perfect = simulateReset({
      ...baseState(),
      tasks: Array.from({ length: 5 }, (_, i) => ({ id: `t${i}`, completed: true })),
      shieldUsedWeek: '',
    });
    expect(perfect.shieldUsed).toBe(false);
    const neutral = simulateReset({ ...baseState(), shieldUsedWeek: '' });
    expect(neutral.shieldUsed).toBe(false);
  });
});

describe('performDailyReset — 💤 modo dorminhoco (sem regressão automática)', () => {
  it('HP 0 vira modo dorminhoco com meio coração, mantendo a fase', () => {
    // 3 tasks, none done → perde o único coração → dorme em vez de regredir
    const tasks = Array.from({ length: 3 }, (_, i) => ({ id: `t${i}`, completed: false }));
    const result = simulateReset({ ...baseState(), tasks, healthPoints: 1, evolutionStage: 'vix-2' });
    expect(result.degeneratedByHP).toBe(false);
    expect(result.sleepyMode).toBe(true);
    expect(result.evolutionStage).toBe('vix-2'); // NÃO regrediu
    expect(result.healthPoints).toBe(0.5);
  });

  it('acorda do modo dorminhoco quando chega na virada com ≥1 coração', () => {
    const result = simulateReset({ ...baseState(), sleepyMode: true, healthPoints: 2 });
    expect(result.sleepyMode).toBe(false);
  });
});

describe('performDailyReset — evolution', () => {
  it('evolves linearly when perfect days meet the requirement', () => {
    // fase 1 (vix-1) precisa de 3 dias perfeitos; chega com 2 + dia perfeito de ontem
    const tasks = Array.from({ length: 3 }, (_, i) => ({ id: `t${i}`, completed: true }));
    const result = simulateReset({
      ...baseState(),
      tasks,
      evolutionStage: 'vix-1',
      unlockedEvolutions: ['egg', 'vix-1'],
      perfectDays: 2,
      healthPoints: 2,
      maxHealthPoints: 2,
    });
    expect(result.evolutionStage).toBe('vix-2');
    expect(result.maxHealthPoints).toBe(MAX_HP_BY_FORM['fase-2']);
    expect(result.unlockedEvolutions).toContain('vix-2');
  });
});
