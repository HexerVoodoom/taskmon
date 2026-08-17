// 💠 Economia Bits ↔ vida real (versão de teste — Onda 1 do dossiê de
// benchmarking, docs/BENCHMARKING-2026.md).
//
// Três regras novas:
// 1. Tarefa real concluída → +TASK_BITS direto (a moeda nasce da vida real).
// 2. Bits de MINIJOGO têm teto diário que escala com as tarefas do dia
//    (princípio de Premack: o jogo vira recompensa da tarefa, não substituto).
// 3. Loja ganha "Prêmios de verdade": catálogo editável pelo responsável,
//    resgatado com Bits, que gera um cartão pra mostrar (backup reinforcer da
//    economia de fichas — a ficha precisa comprar algo que vale fora do app).

/** Bits ganhos por tarefa/atividade real concluída. */
export const TASK_BITS = 10;

/** Piso diário de Bits de minijogo (dá pra brincar um pouco mesmo sem tarefa). */
export const GAME_BITS_BASE = 20;

/** Bits de minijogo extras liberados por tarefa real concluída no dia. */
export const GAME_BITS_PER_TASK = 30;

/** Teto diário de Bits vindos de minijogos, em função das tarefas do dia. */
export function gameBitsCapFor(tasksDoneToday: number): number {
  return GAME_BITS_BASE + GAME_BITS_PER_TASK * Math.max(0, tasksDoneToday);
}

/**
 * Chave da semana (segunda-feira como início) — usada pelo escudo semanal.
 * Formato estável tipo "2026-08-10" (a data da segunda daquela semana).
 */
export function weekKey(d: Date): string {
  const monday = new Date(d);
  const day = monday.getDay(); // 0=dom
  const diff = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + diff);
  const mm = String(monday.getMonth() + 1).padStart(2, '0');
  const dd = String(monday.getDate()).padStart(2, '0');
  return `${monday.getFullYear()}-${mm}-${dd}`;
}

export interface RealReward {
  id: string;
  namePt: string;
  nameEn: string;
  emoji: string;
  price: number;
}

export interface RewardRedemption {
  id: string;
  namePt: string;
  nameEn: string;
  emoji: string;
  price: number;
  /** ISO timestamp do resgate. */
  at: string;
}

/** Catálogo inicial — o responsável edita na aba Prêmios da loja. */
export const DEFAULT_REAL_REWARDS: RealReward[] = [
  { id: 'movie',   namePt: 'Escolher o filme da noite', nameEn: 'Pick the movie night film', emoji: '🎬', price: 150 },
  { id: 'story',   namePt: 'História extra antes de dormir', nameEn: 'Extra bedtime story', emoji: '📖', price: 120 },
  { id: 'dessert', namePt: 'Escolher a sobremesa', nameEn: 'Pick the dessert', emoji: '🍮', price: 180 },
  { id: 'park',    namePt: 'Passeio no parque', nameEn: 'Trip to the park', emoji: '🌳', price: 300 },
];
