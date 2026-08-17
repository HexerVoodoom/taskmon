import { useEffect, useCallback } from 'react';
import { FORM_REQUIREMENTS, MAX_HP_BY_FORM, getStageLevel, canSelectWeekdays, type PetType } from '../types/progression';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { getNextEvolution } from '../utils/dailyReset';
import { weekKey } from '../utils/economy';

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
      let newMaxActivityCap = prev.maxActivityCap;

      // HP penalty: proportional to the tasks NOT done, measured against the
      // same daily goal. Meeting it = safe; registering MORE than required
      // never adds risk. No tasks registered → nothing to fail.
      const completionRatio = dailyGoal > 0 ? Math.min(1, dailyDone / dailyGoal) : 1;
      let heartsLost = Math.floor((1 - completionRatio) * prev.maxHealthPoints);

      // Dia sem NENHUMA tarefa cadastrada é neutro: a agenda é do adulto, não
      // da criança — não perde coração nem dia perfeito (dossiê P3).
      const neutralDay = totalTasks === 0;

      // 🛡️ Escudo semanal: 1× por semana, automático, um dia ruim não perde
      // coração nem dias perfeitos (streak-freeze do Duolingo, dossiê G2/R07).
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

      // 💤 HP 0 → modo dorminhoco, NÃO regride mais de fase (dossiê P3/P5:
      // punição de perda de vínculo é forte demais pra essa idade; regressão
      // agora só manual, pelo botão "Voltar" da página de Evolução). O pet fica
      // dormindo com meio coração até ser curado (carinho/coraçãozinho).
      let newSleepyMode = prev.sleepyMode ?? false;
      if (newHP === 0) {
        newSleepyMode = true;
        newHP = 0.5;
      } else if (newHP >= 1) {
        newSleepyMode = false;
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
        degeneratedByHP: false,
        sleepyMode: newSleepyMode,
        shieldUsedWeek: newShieldUsedWeek,
        gameBitsToday: 0, // teto diário de Bits de minijogo reinicia na virada
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
          degenerated: false,
          shieldUsed,
          sleepy: newSleepyMode,
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
