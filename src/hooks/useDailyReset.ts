import { useEffect, useCallback } from 'react';
import { FORM_REQUIREMENTS, MAX_HP_BY_FORM, getStageLevel, canSelectWeekdays, type PetType } from '../types/progression';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { getNextEvolution, getPreviousForm } from '../utils/dailyReset';

interface Step { id: string; label: string; completed: boolean; }
interface Activity {
  id: string;
  category: string;
  steps: Step[];
  weekDays: number[];
  completedToday?: boolean;
  lastCompletedDate?: string;
}
interface Task { id: string; completed: boolean; steps?: Step[]; }

interface ResetGameState {
  activities: Activity[];
  tasks: Task[];
  healthPoints: number;
  maxHealthPoints: number;
  energyPoints: number;
  perfectDays: number;
  totalXP: number;
  evolutionStage: string;
  eggType?: PetType;
  unlockedEvolutions: string[];
  maxActivityCap: number;
  lastResetDate: string;
  poopEventsShown: number[];
  poopEventsCompleted: number[];
}

interface UseDailyResetProps {
  gameState: ResetGameState;
  setGameState: (fn: (prev: any) => any) => void;
  hasShownRookiePopup: boolean;
  setShowRookieUnlockPopup: (v: boolean) => void;
  setHasShownRookiePopup: (v: boolean) => void;
}

export function useDailyReset({
  gameState,
  setGameState,
  hasShownRookiePopup,
  setShowRookieUnlockPopup,
  setHasShownRookiePopup,
}: UseDailyResetProps) {
  const performDailyReset = useCallback(() => {
    setGameState(prev => {
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
        : prev.activities.filter((a: Activity) => a.weekDays?.includes(yesterdayWeekDay));

      availableActivities.forEach((activity: Activity) => {
        let isComplete = false;
        if (activity.steps.length > 0) {
          isComplete = activity.steps.every(s => s.completed);
        } else {
          isComplete = !!activity.completedToday && activity.lastCompletedDate === yesterdayString;
        }
        if (isComplete) dailyDone++;
      });

      dailyDone += prev.tasks.filter((t: Task) => t.completed).length;

      // Daily goal = min(registered, stage requirement) — same rule as the HP
      // penalty: finishing everything you registered counts, and the stage
      // requirement is the ceiling.
      const totalTasks = availableActivities.length + prev.tasks.length;
      const dailyGoal = Math.min(totalTasks, requiredToday);

      // A perfect day (evolution point) requires completing the daily goal
      // (at least 1 task registered) AND full energy at the end of the day.
      // Energy bars = the stage's task requirement (requiredToday).
      const energyWasFull = (prev.energyPoints ?? 0) >= requiredToday;
      const dayWasPerfect = totalTasks > 0 && dailyDone >= dailyGoal && energyWasFull;

      let newHP = prev.healthPoints;
      let newPerfectDays = prev.perfectDays;
      let newEvolutionStage = prev.evolutionStage;
      const finalUnlockedEvolutions = [...prev.unlockedEvolutions];
      let wasDegeneratedByHP = false;
      let newMaxActivityCap = prev.maxActivityCap;

      // HP penalty: proportional to the tasks NOT done, measured against the
      // same daily goal. Meeting it = safe; registering MORE than required
      // never adds risk. No tasks registered → nothing to fail.
      const completionRatio = dailyGoal > 0 ? Math.min(1, dailyDone / dailyGoal) : 1;
      const heartsLost = Math.floor((1 - completionRatio) * prev.maxHealthPoints);
      if (heartsLost > 0) {
        newHP = Math.max(0, prev.healthPoints - heartsLost);
      }

      if (dayWasPerfect) {
        newPerfectDays++;
      } else {
        // Streak break: any non-perfect day loses one day of accumulated progress
        newPerfectDays = Math.max(0, prev.perfectDays - 1);
      }

      // Evolution check (linear per pet). The padlock on the Evolution page
      // blocks it entirely: perfect days keep accumulating, and unlocking makes
      // the pet evolve on the NEXT day turn (this same check passes then).
      if (!prev.evolutionLocked && newPerfectDays >= requirements.required) {
        newPerfectDays = 0;

        const wasPhase1 = currentLevel === 'fase-1';
        newEvolutionStage = getNextEvolution(prev.evolutionStage, prev.eggType ?? 'vix');

        // Ao chegar na fase 2 libera a seleção de dias da semana — popup 1×.
        if (wasPhase1 && !hasShownRookiePopup) {
          setShowRookieUnlockPopup(true);
          setHasShownRookiePopup(true);
          localStorage.setItem(STORAGE_KEYS.ROOKIE_POPUP_SHOWN, 'true');
        }

        const newStageLevel = getStageLevel(newEvolutionStage);
        newHP = MAX_HP_BY_FORM[newStageLevel];
        const newCap = FORM_REQUIREMENTS[newStageLevel].cap;
        if (newCap > newMaxActivityCap) newMaxActivityCap = newCap;

        if (!finalUnlockedEvolutions.includes(newEvolutionStage)) {
          finalUnlockedEvolutions.push(newEvolutionStage);
        }
      }

      // Degeneration by HP
      if (newHP === 0) {
        wasDegeneratedByHP = true;
        newEvolutionStage = getPreviousForm(prev.evolutionStage, prev.eggType ?? 'vix');

        const degeneratedLevel = getStageLevel(newEvolutionStage);
        newHP = MAX_HP_BY_FORM[degeneratedLevel];
        // Recovery discount: climbing back to the stage you fell from costs half
        // the perfect days (head start at floor(required/2)). Non-cumulative — it's
        // always half of the *new* (lower) stage's requirement, so a second
        // degeneration gets the same discount again, never a smaller one.
        newPerfectDays = Math.floor(FORM_REQUIREMENTS[degeneratedLevel].required / 2);
      }

      const resetActivities = prev.activities.map((activity: Activity) => ({
        ...activity,
        steps: activity.steps.map(step => ({ ...step, completed: false })),
        completedToday: false,
      }));

      const resetTasks = prev.tasks.map((task: Task) => ({ ...task, completed: false }));

      const finalStageLevel = getStageLevel(newEvolutionStage);
      const newMaxHP = MAX_HP_BY_FORM[finalStageLevel];

      return {
        ...prev,
        activities: resetActivities,
        tasks: resetTasks,
        healthPoints: newHP,
        maxHealthPoints: newMaxHP,
        perfectDays: newPerfectDays,
        lastResetDate: new Date().toDateString(),
        evolutionStage: newEvolutionStage,
        digivolutionSegments: 0,
        digivolutionSegmentsNeeded: 999,
        poopEventsScheduled: [],
        poopEventsCompleted: [],
        poopEventsShown: [],
        poopPenaltyClockAt: 0,
        unlockedEvolutions: finalUnlockedEvolutions,
        degeneratedByHP: wasDegeneratedByHP,
        lastDayWasPerfect: dayWasPerfect,
        // Lifetime perfect-day counter (missions) — never resets on evolution
        totalPerfectDays: (prev.totalPerfectDays ?? 0) + (dayWasPerfect ? 1 : 0),
        maxActivityCap: newMaxActivityCap,
        energyPoints: 0, // Energy resets daily (refills by feeding)
        // Summary of yesterday, shown once as a "daily report" on next open.
        lastDayReport: {
          date: yesterdayString,
          done: dailyDone,
          total: totalTasks,
          required: dailyGoal, // the effective goal: min(registered, stage requirement)
          heartsLost,
          wasPerfect: dayWasPerfect,
          energyWasFull,
          perfectDays: newPerfectDays,
          degenerated: wasDegeneratedByHP,
        },
      };
    });
  }, [hasShownRookiePopup, setShowRookieUnlockPopup, setHasShownRookiePopup]);

  // Day-rollover check. A 30s cadence is plenty (the reset just needs to land
  // shortly after midnight) and avoids the old 1s ticker that re-rendered the
  // whole app every second for a countdown string nothing displayed.
  useEffect(() => {
    const checkRollover = () => {
      if (new Date().toDateString() !== gameState.lastResetDate) {
        performDailyReset();
      }
    };

    checkRollover();
    const interval = setInterval(checkRollover, 30000);
    return () => clearInterval(interval);
  }, [gameState.lastResetDate, performDailyReset]);
}
