import { describe, it, expect } from 'vitest';
import {
  wasDayPerfect,
  countCompletedYesterday,
  getNextEvolution,
  getPreviousForm,
  type GameState,
} from './dailyReset';

// Helpers
const makeActivity = (overrides: Partial<{
  id: string;
  steps: { id: string; label: string; completed: boolean }[];
  completedToday: boolean;
  lastCompletedDate: string;
  weekDays: number[];
}> = {}) => ({
  id: 'act-1',
  name: 'Test',
  category: 'Health' as const,
  emoji: '💪',
  steps: [],
  weekDays: [0, 1, 2, 3, 4, 5, 6],
  completedToday: false,
  lastCompletedDate: undefined,
  ...overrides,
});

const makeTask = (completed = false) => ({
  id: 'task-1',
  name: 'Task',
  category: 'Study' as const,
  emoji: '📚',
  completed,
});

const baseState = (): GameState => ({
  activities: [],
  tasks: [],
  healthPoints: 3,
  maxHealthPoints: 3,
  perfectDays: 0,
  totalXP: 0,
  evolutionStage: 'vix-2',
  unlockedEvolutions: ['egg', 'vix-1', 'vix-2'],
  degeneratedByHP: false,
  lastDayWasPerfect: false,
});

// Compute yesterday the same way the functions do — no fake timers needed.
// This ensures the strings are always in sync regardless of timezone or test-runner time.
const _now = new Date();
const _yesterday = new Date(_now);
_yesterday.setDate(_now.getDate() - 1);
const YESTERDAY_STRING = _yesterday.toDateString();
const YESTERDAY_WEEKDAY = _yesterday.getDay();
// A weekday guaranteed to differ from yesterday's, so the weekday filter excludes it
const NOT_YESTERDAY_WEEKDAY = (YESTERDAY_WEEKDAY + 1) % 7;

// ── wasDayPerfect ──────────────────────────────────────────────

describe('wasDayPerfect', () => {
  it('returns false when no activities and no tasks', () => {
    expect(wasDayPerfect(baseState())).toBe(false);
  });

  it('returns true when all step-activities completed yesterday', () => {
    const state = baseState();
    state.activities = [
      makeActivity({
        steps: [{ id: 's1', label: 'step', completed: true }],
        weekDays: [YESTERDAY_WEEKDAY], // Tuesday
      }),
    ];
    expect(wasDayPerfect(state)).toBe(true);
  });

  it('returns false when step-activity incomplete', () => {
    const state = baseState();
    state.activities = [
      makeActivity({
        steps: [
          { id: 's1', label: 'step1', completed: true },
          { id: 's2', label: 'step2', completed: false },
        ],
        weekDays: [YESTERDAY_WEEKDAY],
      }),
    ];
    expect(wasDayPerfect(state)).toBe(false);
  });

  it('returns true when no-step activity was completed yesterday', () => {
    const state = baseState();
    state.activities = [
      makeActivity({
        completedToday: true,
        lastCompletedDate: YESTERDAY_STRING,
        weekDays: [YESTERDAY_WEEKDAY],
      }),
    ];
    expect(wasDayPerfect(state)).toBe(true);
  });

  it('returns false when no-step activity completed on a different date', () => {
    const state = baseState();
    state.activities = [
      makeActivity({
        completedToday: true,
        lastCompletedDate: 'Mon Jun 14 2026', // older date, not yesterday
        weekDays: [YESTERDAY_WEEKDAY],
      }),
    ];
    expect(wasDayPerfect(state)).toBe(false);
  });

  it('ignores activities not scheduled for yesterday (weekday filter)', () => {
    const state = baseState();
    // Scheduled for a weekday that is NOT yesterday — should be excluded by the filter
    state.activities = [
      makeActivity({ weekDays: [NOT_YESTERDAY_WEEKDAY] }),
    ];
    // Only the task counts
    state.tasks = [makeTask(true)];
    expect(wasDayPerfect(state)).toBe(true);
  });

  it('returns true when all tasks completed and no activities', () => {
    const state = baseState();
    state.tasks = [makeTask(true), makeTask(true)];
    expect(wasDayPerfect(state)).toBe(true);
  });

  it('returns false when some tasks not completed', () => {
    const state = baseState();
    state.tasks = [makeTask(true), makeTask(false)];
    expect(wasDayPerfect(state)).toBe(false);
  });

  it('ignores weekday filter before fase 2', () => {
    const state = baseState();
    state.evolutionStage = 'egg';
    // Activity with only Thursday (4) — yesterday was Tuesday (2), so normally excluded
    // Before fase 2 the weekday filter is ignored — activity is always included
    state.activities = [
      makeActivity({
        weekDays: [4],
        steps: [{ id: 's1', label: 'step', completed: true }],
      }),
    ];
    // Pre-fase-2 ignores weekDay filter — activity is included
    expect(wasDayPerfect(state)).toBe(true);
  });
});

// ── countCompletedYesterday ────────────────────────────────────

describe('countCompletedYesterday', () => {
  it('returns 0 when nothing was done', () => {
    const state = baseState();
    state.activities = [makeActivity({ weekDays: [YESTERDAY_WEEKDAY] })];
    state.tasks = [makeTask(false)];
    expect(countCompletedYesterday(state)).toBe(0);
  });

  it('counts completed activities and tasks independently', () => {
    const state = baseState();
    state.activities = [
      makeActivity({
        steps: [{ id: 's1', label: 'step', completed: true }],
        weekDays: [YESTERDAY_WEEKDAY],
      }),
    ];
    state.tasks = [makeTask(true), makeTask(false)];
    expect(countCompletedYesterday(state)).toBe(2);
  });
});

// ── getNextEvolution (linear por pet) ──────────────────────────

describe('getNextEvolution', () => {
  it('egg → fase 1 do pet', () => {
    expect(getNextEvolution('egg', 'vix')).toBe('vix-1');
    expect(getNextEvolution('egg', 'momo')).toBe('momo-1');
    expect(getNextEvolution('egg', 'kiwi')).toBe('kiwi-1');
  });

  it('fase 1 → fase 2 → fase 3', () => {
    expect(getNextEvolution('vix-1', 'vix')).toBe('vix-2');
    expect(getNextEvolution('momo-2', 'momo')).toBe('momo-3');
  });

  it('fase 3 é final — fica onde está', () => {
    expect(getNextEvolution('kiwi-3', 'kiwi')).toBe('kiwi-3');
  });

  it('formas legadas evoluem pelo nível equivalente', () => {
    // tapirmon (rookie → fase 2) evolui para a fase 3 do pet migrado
    expect(getNextEvolution('tapirmon', 'vix')).toBe('vix-3');
    // pichimon (baby-i → fase 1) → fase 2
    expect(getNextEvolution('pichimon', 'vix')).toBe('vix-2');
  });
});

// ── getPreviousForm (degeneração linear) ───────────────────────

describe('getPreviousForm', () => {
  it('fase 3 → fase 2 → fase 1 → egg', () => {
    expect(getPreviousForm('vix-3', 'vix')).toBe('vix-2');
    expect(getPreviousForm('momo-2', 'momo')).toBe('momo-1');
    expect(getPreviousForm('kiwi-1', 'kiwi')).toBe('egg');
  });

  it('do ovo não regride', () => {
    expect(getPreviousForm('egg', 'vix')).toBe('egg');
  });
});
