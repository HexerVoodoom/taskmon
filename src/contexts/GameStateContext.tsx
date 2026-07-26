import { createContext, useContext, useState, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { type ActivityCategory } from '../types/attributes';
import { MAX_HP_BY_FORM, getStageLevel, FORM_REQUIREMENTS, LEGACY_EGG_TYPE, PET_TYPES, stageForLevel, type PetType, type EvolutionStage } from '../types/progression';
import { STORAGE_KEYS, getActiveProfile } from '../utils/storageKeys';
import { cloudSave } from '../utils/cloudSave';
import { buildHubCloudPayload } from '../utils/profiles';

export interface Step {
  id: string;
  label: string;
  completed: boolean;
}

export interface Activity {
  id: string;
  name: string;
  category: ActivityCategory;
  emoji: string;
  steps: Step[];
  weekDays: number[];
  alarm?: { time: string };
  completedToday?: boolean;
  lastCompletedDate?: string;
}

export interface Task {
  id: string;
  name: string;
  category: ActivityCategory;
  emoji: string;
  completed: boolean;
  deadline?: { date: string; time: string };
  alarm?: { type: '2h' | '1h' | '30min' | 'custom'; time?: string };
  steps?: Step[];
}

export interface CompletedTask {
  id: string;
  name: string;
  category: ActivityCategory;
  emoji: string;
  completedAt: string;
}

export interface ActivityStats {
  [activityId: string]: {
    name: string;
    emoji: string;
    category: ActivityCategory;
    completionCount: number;
  };
}

export interface GameState {
  activities: Activity[];
  tasks: Task[];
  completedTasks: CompletedTask[];
  activityStats: ActivityStats;
  healthPoints: number;
  maxHealthPoints: number;
  /** Energia/saciedade — enche só comendo, zera todo dia. */
  energyPoints: number;
  perfectDays: number;
  totalXP: number;
  lastResetDate: string;
  /** Forma atual: 'egg' ou '<pet>-<1|2|3>' (ex.: 'vix-2'). */
  evolutionStage: string;
  digivolutionSegments: number;
  digivolutionSegmentsNeeded: number;
  poopEventsScheduled: number[];
  poopEventsCompleted: number[];
  unlockedEvolutions: string[];
  degeneratedByHP: boolean;
  lastDayWasPerfect: boolean;
  maxActivityCap: number;
  /** Pet escolhido no onboarding — define a linha evolutiva (linear). */
  eggType?: PetType;
  /** Estoque de comida por emoji. */
  foodInventory: Record<string, number>;
  /** Indices of scheduled poop events that actually appeared on screen (so sleep-skipped ones don't penalize). */
  poopEventsShown: number[];
  /** Epoch ms clock for the "uncleaned poop drains 1 heart / 6h" penalty (0 = inactive). */
  poopPenaltyClockAt: number;
  /** Bits: minigame currency earned in the Activities games, spent in the shop. */
  gamePoints: number;
  /** Shop: pet-box backgrounds owned (ids from utils/shop.ts). */
  ownedBackgrounds: string[];
  /** Shop: equipped pet-box background id, or null for the default. */
  equippedBackground: string | null;
  /** Evolution lock (padlock on the Evolution page): while true the pet never evolves at the day turn. */
  evolutionLocked?: boolean;
  /** Mission counters (lifetime, cloud-synced) — see utils/missions.ts. */
  dungeonKills?: number;
  dungeonRunsCompleted?: number;
  dinoBest?: number;
  totalPerfectDays?: number;
  /** Summary of the previous day, written at the daily reset and shown once as a report. */
  lastDayReport?: {
    date: string;
    done: number;
    total: number;
    required: number;
    heartsLost: number;
    wasPerfect: boolean;
    energyWasFull?: boolean;
    perfectDays: number;
    degenerated: boolean;
  };
}

export function getMaxHPForStage(stage: GameState['evolutionStage']): number {
  return MAX_HP_BY_FORM[getStageLevel(stage)];
}

// ── Migração DigiApp → Taskmon ───────────────────────────────────────────────
// Saves antigos guardam formas Digimon ('tapirmon', 'greymon'…) e eggTypes de
// linha ('tapirmon'|'veemon'|'salamon'). Mapeia para o pet novo preservando o
// NÍVEL de progresso, e limpa itens que deixaram de existir (chips etc.).
const NEW_STAGE_RE = /^(egg|(vix|momo|kiwi)-[123])$/;
const REMOVED_ITEM_EMOJIS = ['🦠', '💾', '💉', '🌞', '🌩️', '🔥', '🐺', '🐣', '🐞', '🍃', '🌺'];

function migrateEggType(raw: string | null | undefined): PetType {
  if (raw === 'vix' || raw === 'momo' || raw === 'kiwi') return raw;
  return LEGACY_EGG_TYPE[raw ?? ''] ?? 'vix';
}

function migrateLoadedState(loaded: Partial<GameState> & Record<string, unknown>): Partial<GameState> {
  const eggType = migrateEggType(loaded.eggType as string | undefined);
  let stage = (loaded.evolutionStage as string | undefined) ?? 'egg';
  if (!NEW_STAGE_RE.test(stage)) {
    stage = stageForLevel(eggType, getStageLevel(stage));
  }
  // unlockedEvolutions: reconstrói a trilha linear até a forma atual.
  const level = getStageLevel(stage);
  const phase = level === 'egg' ? 0 : Number(level.slice(-1));
  const unlocked = ['egg'];
  for (let i = 1; i <= phase; i++) unlocked.push(stageForLevel(eggType, `fase-${i}` as EvolutionStage));

  // foodInventory: descarta itens de sistemas removidos (chips/itens de evolução).
  const inv: Record<string, number> = { ...(loaded.foodInventory ?? {}) };
  for (const emoji of REMOVED_ITEM_EMOJIS) delete inv[emoji];

  return { ...loaded, eggType, evolutionStage: stage, unlockedEvolutions: unlocked, foodInventory: inv };
}

interface GameStateContextType {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
}

const GameStateContext = createContext<GameStateContextType | null>(null);

export function GameStateProvider({ children }: { children: ReactNode }) {
  const [gameState, setGameState] = useState<GameState>(() => {
    // A corrupted save must never white-screen the app — fall back to a fresh state.
    let loadedState: Partial<GameState> | null = null;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GAME_STATE);
      if (saved) loadedState = JSON.parse(saved) as Partial<GameState>;
    } catch {
      loadedState = null;
    }
    if (loadedState) {
      const migrated = migrateLoadedState(loadedState as Partial<GameState> & Record<string, unknown>);
      const stage = migrated.evolutionStage ?? 'egg';
      return {
        ...migrated,
        tasks: migrated.tasks ?? [],
        completedTasks: migrated.completedTasks ?? [],
        activityStats: migrated.activityStats ?? {},
        maxHealthPoints: getMaxHPForStage(stage),
        healthPoints: Math.min(migrated.healthPoints ?? 1, getMaxHPForStage(stage)),
        energyPoints: migrated.energyPoints ?? 0,
        perfectDays: migrated.perfectDays ?? 0,
        lastDayWasPerfect: migrated.lastDayWasPerfect ?? false,
        poopEventsScheduled: migrated.poopEventsScheduled ?? [],
        poopEventsCompleted: migrated.poopEventsCompleted ?? [],
        unlockedEvolutions: migrated.unlockedEvolutions ?? ['egg'],
        degeneratedByHP: migrated.degeneratedByHP ?? false,
        maxActivityCap: Math.max(
          migrated.maxActivityCap ?? 0,
          FORM_REQUIREMENTS[getStageLevel(stage)].cap,
        ),
        foodInventory: migrated.foodInventory ?? {},
        poopEventsShown: migrated.poopEventsShown ?? [],
        poopPenaltyClockAt: migrated.poopPenaltyClockAt ?? 0,
        gamePoints: migrated.gamePoints ?? 0,
        ownedBackgrounds: migrated.ownedBackgrounds ?? [],
        equippedBackground: migrated.equippedBackground ?? null,
      } as GameState;
    }
    // Perfil sem save nenhum (nunca passou pelo onboarding, que não roda mais):
    // entra direto no jogo já com o pet da casinha (vix/momo/kiwi) na fase 1,
    // em vez do ovo. Um eggType salvo (save legado/onboarding antigo) preserva
    // o comportamento anterior (ovo).
    const savedEggType = localStorage.getItem(STORAGE_KEYS.EGG_TYPE);
    const isFreshProfile = savedEggType === null;
    const eggType = isFreshProfile
      ? (PET_TYPES[getActiveProfile()] ?? 'vix')
      : migrateEggType(savedEggType);
    const startStage = isFreshProfile ? stageForLevel(eggType, 'fase-1') : 'egg';
    return {
      activities: [],
      tasks: [],
      completedTasks: [],
      activityStats: {},
      healthPoints: isFreshProfile ? MAX_HP_BY_FORM['fase-1'] : 1,
      maxHealthPoints: isFreshProfile ? MAX_HP_BY_FORM['fase-1'] : 1,
      energyPoints: 0,
      perfectDays: 0,
      totalXP: 0,
      lastResetDate: new Date().toDateString(),
      evolutionStage: startStage,
      digivolutionSegments: 0,
      digivolutionSegmentsNeeded: 1,
      poopEventsScheduled: [],
      poopEventsCompleted: [],
      unlockedEvolutions: isFreshProfile ? ['egg', startStage] : ['egg'],
      degeneratedByHP: false,
      lastDayWasPerfect: false,
      maxActivityCap: isFreshProfile ? FORM_REQUIREMENTS['fase-1'].cap : 2,
      eggType,
      foodInventory: {},
      poopEventsShown: [],
      poopPenaltyClockAt: 0,
      gamePoints: 0,
      ownedBackgrounds: [],
      equippedBackground: null,
    };
  });

  const isFirstRender = useRef(true);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify(gameState));

    // Skip cloud backup on first render (initial load from localStorage)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Generate save ID on first use
    let saveId = localStorage.getItem(STORAGE_KEYS.SAVE_ID);
    if (!saveId) {
      saveId = crypto.randomUUID();
      localStorage.setItem(STORAGE_KEYS.SAVE_ID, saveId);
    }

    // Bundles ALL 3 profiles (read fresh from localStorage, which the
    // localStorage.setItem above already synced for this profile) — the
    // hub's cloud save always carries every profile together.
    const timer = setTimeout(() => cloudSave(saveId!, buildHubCloudPayload()), 3000);
    return () => clearTimeout(timer);
  }, [gameState]);

  const value = useMemo(() => ({ gameState, setGameState }), [gameState]);

  return (
    <GameStateContext.Provider value={value}>
      {children}
    </GameStateContext.Provider>
  );
}

export function useGameState() {
  const ctx = useContext(GameStateContext);
  if (!ctx) throw new Error('useGameState must be used within GameStateProvider');
  return ctx;
}
