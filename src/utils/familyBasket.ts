// 🧺 Cesta do Piquenique da Família — estado COMPARTILHADO pelos 3 perfis
// (chave não escopada por perfil, de propósito: a cesta é uma só).
//
// Como enche: toda tarefa/atividade real concluída por qualquer uma das 3
// gera a comida normal no inventário dela E deixa uma CÓPIA na cesta comum
// (a criança não perde nada — é um extra). A cesta mostra as comidinhas de
// verdade que a família juntou na semana.
//
// Quando enche: o piquenique acontece na 4ª casinha e cada pet pode pegar
// um 💗 Coraçãozinho lá (uma vez por semana, por perfil). Zera na segunda.

import { weekKey } from './economy';
import { HEART_ITEM_EMOJI } from './shop';

const KEY = 'digiapp-family-basket';

/** Comidinhas necessárias pra encher a cesta e liberar o piquenique. */
export const FAMILY_BASKET_GOAL = 15;

/** Teto de itens guardados (a barra satura na meta; evita crescer sem fim). */
const MAX_STORED = FAMILY_BASKET_GOAL * 2;

export interface FamilyBasket {
  /** Semana (segunda) a que esta cesta pertence — vira sozinha na virada. */
  week: string;
  /** Emojis das comidinhas juntadas pela família nesta semana. */
  foods: string[];
  /** Índices dos perfis que já pegaram o presente do piquenique. */
  claimed: number[];
}

function empty(week: string): FamilyBasket {
  return { week, foods: [], claimed: [] };
}

/** Lê a cesta da semana corrente (reseta sozinha quando a semana vira). */
export function readBasket(now: Date = new Date()): FamilyBasket {
  const week = weekKey(now);
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty(week);
    const parsed = JSON.parse(raw) as Partial<FamilyBasket>;
    if (parsed.week !== week) return empty(week);
    return {
      week,
      foods: Array.isArray(parsed.foods) ? parsed.foods : [],
      claimed: Array.isArray(parsed.claimed) ? parsed.claimed : [],
    };
  } catch {
    return empty(week);
  }
}

function write(basket: FamilyBasket): FamilyBasket {
  try {
    localStorage.setItem(KEY, JSON.stringify(basket));
  } catch { /* storage cheio: a cesta é cosmética, não vale quebrar o app */ }
  return basket;
}

/** Soma uma comidinha à cesta comum (cópia — não sai do inventário de ninguém). */
export function addToBasket(emoji: string, now: Date = new Date()): FamilyBasket {
  const basket = readBasket(now);
  if (basket.foods.length >= MAX_STORED) return basket;
  return write({ ...basket, foods: [...basket.foods, emoji] });
}

/** A cesta bateu a meta da semana? */
export function isBasketFull(basket: FamilyBasket): boolean {
  return basket.foods.length >= FAMILY_BASKET_GOAL;
}

/** Este perfil ainda pode pegar o presente do piquenique desta semana? */
export function canClaimPicnic(basket: FamilyBasket, profile: number): boolean {
  return isBasketFull(basket) && !basket.claimed.includes(profile);
}

/**
 * Marca o presente do piquenique como pego por este perfil.
 * Devolve o emoji do presente, ou null se não havia o que pegar.
 * Quem credita o item no inventário é quem chama (App), não este módulo.
 */
export function claimPicnicGift(profile: number, now: Date = new Date()): string | null {
  const basket = readBasket(now);
  if (!canClaimPicnic(basket, profile)) return null;
  write({ ...basket, claimed: [...basket.claimed, profile] });
  return HEART_ITEM_EMOJI;
}
