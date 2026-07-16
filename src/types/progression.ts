// Progressão do Taskmon — 3 pets originais, cada um com UMA linha evolutiva
// linear de 3 fases: ovo → fase 1 → fase 2 → fase 3. Sem branches, sem
// sistema de atributos.

export type PetType = 'vix' | 'momo' | 'kiwi';

/** Nível de progressão (o "tier" de uma forma). */
export type EvolutionStage = 'egg' | 'fase-1' | 'fase-2' | 'fase-3';

// Requisitos por nível: tarefas/dia (required), teto de atividades
// cadastráveis (cap) e dias perfeitos para evoluir (daysToEvolve).
export const FORM_REQUIREMENTS = {
  egg:      { required: 1, cap: 2, daysToEvolve: 1 },
  'fase-1': { required: 3, cap: 5, daysToEvolve: 3 },
  'fase-2': { required: 5, cap: 7, daysToEvolve: 10 },
  'fase-3': { required: 6, cap: 9, daysToEvolve: 999 },
} as const;

// HP máximo (corações) por nível
export const MAX_HP_BY_FORM = {
  egg: 1,
  'fase-1': 2,
  'fase-2': 3,
  'fase-3': 4,
} as const;

export interface PetInfo {
  id: PetType;
  /** Nome da linha (também é o nome da fase 2). */
  name: string;
  /** Cor de destaque do pet (bate com o tema do perfil correspondente). */
  accent: string;
  /** Ids das formas, na ordem fase 1 → 3. */
  phases: [string, string, string];
  /** Nomes exibidos das formas, na ordem fase 1 → 3. */
  phaseNames: [string, string, string];
  /** Nome do ovo (PT / EN). */
  eggNamePt: string;
  eggNameEn: string;
}

export const PETS: Record<PetType, PetInfo> = {
  vix: {
    id: 'vix', name: 'Vix', accent: '#a855f7',
    phases: ['vix-1', 'vix-2', 'vix-3'],
    phaseNames: ['Vixinho', 'Vix', 'Vixão'],
    eggNamePt: 'Ovo Roxo', eggNameEn: 'Purple Egg',
  },
  momo: {
    id: 'momo', name: 'Momo', accent: '#ec4899',
    phases: ['momo-1', 'momo-2', 'momo-3'],
    phaseNames: ['Mominho', 'Momo', 'Momão'],
    eggNamePt: 'Ovo Rosa', eggNameEn: 'Pink Egg',
  },
  kiwi: {
    id: 'kiwi', name: 'Kiwi', accent: '#22c55e',
    phases: ['kiwi-1', 'kiwi-2', 'kiwi-3'],
    phaseNames: ['Kiwinho', 'Kiwi', 'Kiwizão'],
    eggNamePt: 'Ovo Verde', eggNameEn: 'Green Egg',
  },
};

export const PET_TYPES = Object.keys(PETS) as PetType[];

// ── Migração de saves do DigiApp (formas Digimon antigas → fase equivalente) ──
// Só o NÍVEL importa: baby → fase 1, rookie/champion → fase 2, ultimate+ → fase 3.
const LEGACY_LEVEL: Record<string, EvolutionStage> = {};
{
  const put = (level: EvolutionStage, names: string[]) =>
    names.forEach(n => { LEGACY_LEVEL[n] = level; });
  put('egg', ['digiegg']);
  put('fase-1', [
    'pichimon', 'chicomon', 'yukimibotamon',           // baby-i
    'pukamon', 'chibimon', 'nyaromon',                 // baby-ii
  ]);
  put('fase-2', [
    'tapirmon', 'veemon', 'plotmon',                   // rookie
    'agumon', 'gabumon', 'piyomon', 'tentomon', 'patamon', 'palmon',
    'monochromon', 'tuskmon', 'bakemon',               // champion
    'exveemon', 'veedramon', 'flamedramon',
    'gatomon', 'gatomon-black', 'mikemon',
    'greymon', 'garurumon', 'meramon', 'devimon',
    'angemon', 'birdramon', 'kabuterimon', 'seadramon',
    'airdramon', 'ogremon', 'kuwagamon', 'numemon', 'raidramon-armor',
  ]);
  put('fase-3', [
    'gigadramon', 'triceramon', 'digitamamon',         // ultimate
    'paildramon', 'aeroveedramon', 'raidramon',
    'angewomon', 'ladydevimon', 'nefertimon',
    'monzaemon', 'etemon', 'andromon', 'megadramon', 'vademon', 'nanimon',
    'gaioumon', 'ultimatebrachiomon', 'titamon',       // mega
    'imperialdramon', 'ulforceveedramon', 'magnamon',
    'ophanimon', 'lilithmon', 'holydramon',
    'gaioumon-itto', 'imperialdramon-paladin', 'mastemon', // ultra
  ]);
}

/** eggType antigo (linha Digimon) → pet novo. */
export const LEGACY_EGG_TYPE: Record<string, PetType> = {
  tapirmon: 'vix',
  salamon: 'momo',
  veemon: 'kiwi',
};

/** Nível de qualquer forma (ids novos, ids legados e desconhecidos → egg). */
export function getStageLevel(stage: string): EvolutionStage {
  if (stage === 'egg' || stage === 'digiegg') return 'egg';
  const m = /^(vix|momo|kiwi)-([123])$/.exec(stage);
  if (m) return `fase-${m[2]}` as EvolutionStage;
  return LEGACY_LEVEL[stage] ?? 'egg';
}

/** Pet dono de uma forma ('egg'/desconhecido → fallback). */
export function getPetOfStage(stage: string, fallback: PetType = 'vix'): PetType {
  const m = /^(vix|momo|kiwi)-[123]$/.exec(stage);
  return m ? (m[1] as PetType) : fallback;
}

/** Forma de um pet em um nível ('egg' para o ovo). */
export function stageForLevel(pet: PetType, level: EvolutionStage): string {
  if (level === 'egg') return 'egg';
  return PETS[pet].phases[Number(level.slice(-1)) - 1];
}

// Barras de energia = requisito de tarefas do nível (fase 2 pede 5 → 5 barras).
export function getMaxEnergyForStage(stage: string): number {
  return FORM_REQUIREMENTS[getStageLevel(stage)].required;
}

// Seleção de dias da semana libera a partir da fase 2.
const WEEKDAY_LEVELS: EvolutionStage[] = ['fase-2', 'fase-3'];
export function canSelectWeekdays(stage: string): boolean {
  return WEEKDAY_LEVELS.includes(getStageLevel(stage));
}

/** Nome exibido de uma forma (ovo usa o idioma). */
export function getStageDisplayName(stage: string, language: 'pt-BR' | 'en-US' = 'pt-BR'): string {
  const level = getStageLevel(stage);
  if (level === 'egg') return language === 'pt-BR' ? 'Ovo' : 'Egg';
  const pet = PETS[getPetOfStage(stage)];
  return pet.phaseNames[Number(level.slice(-1)) - 1];
}
