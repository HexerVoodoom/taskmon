import { describe, it, expect, beforeEach } from 'vitest';
import {
  readBasket, addToBasket, isBasketFull, canClaimPicnic, claimPicnicGift,
  FAMILY_BASKET_GOAL,
} from './familyBasket';
import { HEART_ITEM_EMOJI } from './shop';

// localStorage mínimo pro ambiente de teste (vitest roda em node puro aqui).
beforeEach(() => {
  const store = new Map<string, string>();
  (globalThis as unknown as { localStorage: Storage }).localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => { store.set(k, v); },
    removeItem: (k: string) => { store.delete(k); },
    clear: () => store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() { return store.size; },
  } as Storage;
});

const fill = (n: number) => { for (let i = 0; i < n; i++) addToBasket('🍎'); };

describe('cesta do piquenique — enchimento', () => {
  it('começa vazia', () => {
    expect(readBasket().foods).toHaveLength(0);
    expect(isBasketFull(readBasket())).toBe(false);
  });

  it('cada comidinha adicionada entra na cesta', () => {
    addToBasket('🍎');
    addToBasket('🍕');
    expect(readBasket().foods).toEqual(['🍎', '🍕']);
  });

  it('enche ao atingir a meta', () => {
    fill(FAMILY_BASKET_GOAL - 1);
    expect(isBasketFull(readBasket())).toBe(false);
    addToBasket('🍰');
    expect(isBasketFull(readBasket())).toBe(true);
  });

  it('reseta sozinha quando a semana vira', () => {
    fill(5);
    const proximaSemana = new Date();
    proximaSemana.setDate(proximaSemana.getDate() + 7);
    expect(readBasket(proximaSemana).foods).toHaveLength(0);
  });
});

describe('cesta do piquenique — presente por perfil', () => {
  it('ninguém pega presente com a cesta pela metade', () => {
    fill(3);
    expect(canClaimPicnic(readBasket(), 0)).toBe(false);
    expect(claimPicnicGift(0)).toBeNull();
  });

  it('cada um dos 3 perfis pega o seu, uma vez só', () => {
    fill(FAMILY_BASKET_GOAL);
    expect(claimPicnicGift(0)).toBe(HEART_ITEM_EMOJI);
    expect(claimPicnicGift(1)).toBe(HEART_ITEM_EMOJI);
    expect(claimPicnicGift(2)).toBe(HEART_ITEM_EMOJI);
    // segunda tentativa de qualquer um deles não rende nada
    expect(claimPicnicGift(0)).toBeNull();
    expect(claimPicnicGift(2)).toBeNull();
  });

  it('o resgate de uma irmã não consome o das outras', () => {
    fill(FAMILY_BASKET_GOAL);
    claimPicnicGift(1);
    expect(canClaimPicnic(readBasket(), 0)).toBe(true);
    expect(canClaimPicnic(readBasket(), 1)).toBe(false);
    expect(canClaimPicnic(readBasket(), 2)).toBe(true);
  });
});
