import { describe, it, expect } from 'vitest';
import { gameBitsCapFor, weekKey, TASK_BITS, GAME_BITS_BASE, GAME_BITS_PER_TASK } from './economy';

describe('gameBitsCapFor — teto diário de Bits de minijogo', () => {
  it('sem tarefa no dia, só o piso', () => {
    expect(gameBitsCapFor(0)).toBe(GAME_BITS_BASE);
  });

  it('escala linearmente com as tarefas do dia', () => {
    expect(gameBitsCapFor(1)).toBe(GAME_BITS_BASE + GAME_BITS_PER_TASK);
    expect(gameBitsCapFor(3)).toBe(GAME_BITS_BASE + 3 * GAME_BITS_PER_TASK);
  });

  it('valores negativos contam como zero', () => {
    expect(gameBitsCapFor(-2)).toBe(GAME_BITS_BASE);
  });

  it('uma tarefa vale mais Bits que o piso de jogo inteiro (incentivo certo)', () => {
    // A regra do dossiê: o caminho mais rentável precisa passar pela tarefa.
    expect(GAME_BITS_PER_TASK + TASK_BITS).toBeGreaterThan(GAME_BITS_BASE);
  });
});

describe('weekKey — semana começa na segunda', () => {
  it('todos os dias de uma mesma semana compartilham a chave', () => {
    // 2026-08-10 é segunda; 2026-08-16 é domingo.
    expect(weekKey(new Date(2026, 7, 10))).toBe('2026-08-10');
    expect(weekKey(new Date(2026, 7, 13))).toBe('2026-08-10');
    expect(weekKey(new Date(2026, 7, 16))).toBe('2026-08-10');
  });

  it('segunda seguinte muda a chave', () => {
    expect(weekKey(new Date(2026, 7, 17))).toBe('2026-08-17');
  });
});
