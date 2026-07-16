import { canSelectWeekdays, getStageLevel, stageForLevel, PETS, type PetType, type EvolutionStage } from '../types/progression';
import { ActivityCategory } from '../types/attributes';

// Tipos necessários para o reset
interface Activity {
  id: string;
  name: string;
  category: ActivityCategory;
  emoji: string;
  steps: { id: string; label: string; completed: boolean; }[];
  weekDays: number[];
  alarm?: { time: string; };
  completedToday?: boolean;
  lastCompletedDate?: string;
}

interface Task {
  id: string;
  name: string;
  category: ActivityCategory;
  emoji: string;
  completed: boolean;
}

export interface GameState {
  activities: Activity[];
  tasks: Task[];
  healthPoints: number;
  maxHealthPoints: number;
  perfectDays: number;
  totalXP: number;
  evolutionStage: string;
  unlockedEvolutions: string[];
  degeneratedByHP: boolean;
  lastDayWasPerfect: boolean;
  [key: string]: any;
}

// Calcula se o dia anterior foi perfeito (antes de resetar)
export function wasDayPerfect(prev: GameState): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayString = yesterday.toDateString();
  const yesterdayWeekDay = yesterday.getDay();

  let totalTasks = 0;
  let completedTasks = 0;

  // Filtra atividades disponíveis para ontem
  const availableActivities = !canSelectWeekdays(prev.evolutionStage)
    ? prev.activities
    : prev.activities.filter(a => a.weekDays?.includes(yesterdayWeekDay));

  availableActivities.forEach(activity => {
    totalTasks++;

    let isComplete = false;
    if (activity.steps.length > 0) {
      isComplete = activity.steps.every(s => s.completed);
    } else {
      isComplete = !!activity.completedToday && activity.lastCompletedDate === yesterdayString;
    }

    if (isComplete) {
      completedTasks++;
    }
  });

  // Adiciona tasks
  totalTasks += prev.tasks.length;
  completedTasks += prev.tasks.filter(t => t.completed).length;

  return totalTasks > 0 && completedTasks === totalTasks;
}

// Conta quantas tarefas foram concluídas ontem (para verificar se perdeu HP)
export function countCompletedYesterday(prev: GameState): number {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayString = yesterday.toDateString();
  const yesterdayWeekDay = yesterday.getDay();

  let completed = 0;

  const availableActivities = !canSelectWeekdays(prev.evolutionStage)
    ? prev.activities
    : prev.activities.filter(a => a.weekDays?.includes(yesterdayWeekDay));

  availableActivities.forEach(activity => {
    let isComplete = false;
    if (activity.steps.length > 0) {
      isComplete = activity.steps.every(s => s.completed);
    } else {
      isComplete = !!activity.completedToday && activity.lastCompletedDate === yesterdayString;
    }

    if (isComplete) {
      completed++;
    }
  });

  completed += prev.tasks.filter(t => t.completed).length;

  return completed;
}

// Ordem linear dos níveis — cada pet evolui sempre nessa sequência.
const LEVEL_ORDER: EvolutionStage[] = ['egg', 'fase-1', 'fase-2', 'fase-3'];

/** Próxima evolução (linear por pet). Na fase 3 fica onde está. */
export function getNextEvolution(currentStage: string, petType: PetType): string {
  const pet = PETS[petType] ? petType : 'vix';
  const idx = LEVEL_ORDER.indexOf(getStageLevel(currentStage));
  const nextLevel = LEVEL_ORDER[Math.min(idx + 1, LEVEL_ORDER.length - 1)];
  return stageForLevel(pet, nextLevel);
}

/** Forma anterior (degeneração linear). Do ovo não regride. */
export function getPreviousForm(currentStage: string, petType: PetType): string {
  const pet = PETS[petType] ? petType : 'vix';
  const idx = LEVEL_ORDER.indexOf(getStageLevel(currentStage));
  const prevLevel = LEVEL_ORDER[Math.max(idx - 1, 0)];
  return stageForLevel(pet, prevLevel);
}
