// Arte dos pets — mascotes SVG originais (estilo flat/arredondado), gerados em
// código e servidos como data-URIs. O mapa STAGE_SPRITES mantém o mesmo
// contrato de antes (chave da forma → src de imagem), então CompanionHUD,
// masmorra, página de evolução e onboarding consomem sem mudanças de shape.
//
// Chaves disponíveis:
//   'egg'                     — ovo neutro (fallback)
//   'egg-vix' | 'egg-momo' | 'egg-kiwi' — ovo na cor do pet
//   '<pet>-<1|2|3>'           — as 9 formas (3 pets × 3 fases)
//   'shadow-<pet>-<1|2|3>'    — variantes sombrias (inimigos da masmorra)
import { PETS, PET_TYPES, type PetType } from '../types/progression';

interface Palette {
  body: string; body2: string; belly: string; outline: string; cheek: string; pupil: string;
}

const PALETTES: Record<PetType, Palette> = {
  vix:  { body: '#a855f7', body2: '#7e22ce', belly: '#e9d5ff', outline: '#3b1d5e', cheek: '#c084fc', pupil: '#2e1065' },
  momo: { body: '#f472b6', body2: '#db2777', belly: '#fce7f3', outline: '#83184a', cheek: '#f9a8d4', pupil: '#500724' },
  kiwi: { body: '#4ade80', body2: '#16a34a', belly: '#dcfce7', outline: '#14532d', cheek: '#86efac', pupil: '#052e16' },
};

const SHADOW_PALETTE: Palette = {
  body: '#4b4458', body2: '#332d3e', belly: '#6b6478', outline: '#17141d', cheek: '#4b4458', pupil: '#f87171',
};

const uri = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
const wrap = (inner: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${inner}</svg>`;

// Olhos + bochechas + boca, compartilhados pelas 3 fases.
function face(p: Palette, cx: number, cy: number, s: number, shadow: boolean): string {
  const ex = 8.5 * s; // afastamento do olho
  const er = 5 * s;   // raio do olho
  const pr = 2.4 * s; // pupila
  const eyes = shadow
    ? `<circle cx="${cx - ex}" cy="${cy}" r="${pr * 1.4}" fill="${p.pupil}"/>` +
      `<circle cx="${cx + ex}" cy="${cy}" r="${pr * 1.4}" fill="${p.pupil}"/>` +
      `<path d="M ${cx - ex - er} ${cy - er} l ${er * 1.4} ${er * 0.7}" stroke="${p.pupil}" stroke-width="${1.8 * s}" stroke-linecap="round"/>` +
      `<path d="M ${cx + ex + er} ${cy - er} l ${-er * 1.4} ${er * 0.7}" stroke="${p.pupil}" stroke-width="${1.8 * s}" stroke-linecap="round"/>`
    : `<circle cx="${cx - ex}" cy="${cy}" r="${er}" fill="#fff"/>` +
      `<circle cx="${cx + ex}" cy="${cy}" r="${er}" fill="#fff"/>` +
      `<circle cx="${cx - ex + 1.2 * s}" cy="${cy + 0.6 * s}" r="${pr}" fill="${p.pupil}"/>` +
      `<circle cx="${cx + ex + 1.2 * s}" cy="${cy + 0.6 * s}" r="${pr}" fill="${p.pupil}"/>`;
  const cheeks = shadow ? '' :
    `<circle cx="${cx - ex - 5 * s}" cy="${cy + 6 * s}" r="${2.6 * s}" fill="${p.cheek}" opacity="0.85"/>` +
    `<circle cx="${cx + ex + 5 * s}" cy="${cy + 6 * s}" r="${2.6 * s}" fill="${p.cheek}" opacity="0.85"/>`;
  const mouth = shadow
    ? `<path d="M ${cx - 3.5 * s} ${cy + 8 * s} q ${3.5 * s} ${-3 * s} ${7 * s} 0" fill="none" stroke="${p.pupil}" stroke-width="${1.8 * s}" stroke-linecap="round"/>`
    : `<path d="M ${cx - 3.5 * s} ${cy + 7 * s} q ${3.5 * s} ${3.5 * s} ${7 * s} 0" fill="none" stroke="${p.outline}" stroke-width="${1.8 * s}" stroke-linecap="round"/>`;
  return eyes + cheeks + mouth;
}

// Detalhe de topo por pet: orelhas pontudas (vix), orelhas redondas (momo),
// brotinho de folha (kiwi). `y` = topo do corpo; `s` = escala.
function topFeature(pet: PetType, p: Palette, cx: number, y: number, s: number): string {
  const o = `stroke="${p.outline}" stroke-width="3" stroke-linejoin="round"`;
  if (pet === 'vix') {
    return `<path d="M ${cx - 16 * s} ${y + 6 * s} L ${cx - 22 * s} ${y - 14 * s} L ${cx - 6 * s} ${y - 2 * s} Z" fill="${p.body2}" ${o}/>` +
           `<path d="M ${cx + 16 * s} ${y + 6 * s} L ${cx + 22 * s} ${y - 14 * s} L ${cx + 6 * s} ${y - 2 * s} Z" fill="${p.body2}" ${o}/>`;
  }
  if (pet === 'momo') {
    return `<ellipse cx="${cx - 12 * s}" cy="${y - 6 * s}" rx="${6.5 * s}" ry="${10 * s}" fill="${p.body}" ${o} transform="rotate(-18 ${cx - 12 * s} ${y - 6 * s})"/>` +
           `<ellipse cx="${cx + 12 * s}" cy="${y - 6 * s}" rx="${6.5 * s}" ry="${10 * s}" fill="${p.body}" ${o} transform="rotate(18 ${cx + 12 * s} ${y - 6 * s})"/>`;
  }
  // kiwi: brotinho
  return `<path d="M ${cx} ${y + 2 * s} q ${-1.5 * s} ${-8 * s} ${1.5 * s} ${-12 * s}" fill="none" stroke="${p.outline}" stroke-width="${2.4 * s}" stroke-linecap="round"/>` +
         `<ellipse cx="${cx + 7 * s}" cy="${y - 12 * s}" rx="${7 * s}" ry="${4 * s}" fill="${p.body2}" ${o} transform="rotate(-24 ${cx + 7 * s} ${y - 12 * s})"/>`;
}

// Extra da fase 3 (forma final): asas (vix), laço (momo), espinhos (kiwi).
function grandFeature(pet: PetType, p: Palette, cx: number, cy: number, ry: number): string {
  const o = `stroke="${p.outline}" stroke-width="3" stroke-linejoin="round"`;
  if (pet === 'vix') {
    return `<path d="M ${cx - 30} ${cy - 6} q -18 -4 -14 -22 q 12 4 16 12 Z" fill="${p.body2}" ${o}/>` +
           `<path d="M ${cx + 30} ${cy - 6} q 18 -4 14 -22 q -12 4 -16 12 Z" fill="${p.body2}" ${o}/>`;
  }
  if (pet === 'momo') {
    const y = cy - ry - 4;
    return `<path d="M ${cx - 3} ${y} L ${cx - 17} ${y - 9} L ${cx - 15} ${y + 8} Z" fill="${p.body2}" ${o}/>` +
           `<path d="M ${cx + 3} ${y} L ${cx + 17} ${y - 9} L ${cx + 15} ${y + 8} Z" fill="${p.body2}" ${o}/>` +
           `<circle cx="${cx}" cy="${y}" r="5" fill="${p.body}" ${o}/>`;
  }
  const y = cy - ry + 4;
  return `<path d="M ${cx - 22} ${y + 10} l -8 -12 l 12 2 Z" fill="${p.body2}" ${o}/>` +
         `<path d="M ${cx + 22} ${y + 10} l 8 -12 l -12 2 Z" fill="${p.body2}" ${o}/>`;
}

/** Uma forma do pet. phase: 1 (pequeno) · 2 (médio) · 3 (grande). */
function petSVG(pet: PetType, phase: 1 | 2 | 3, shadow = false): string {
  const p = shadow ? SHADOW_PALETTE : PALETTES[pet];
  const o = `stroke="${p.outline}" stroke-width="3.5"`;
  const cx = 50;
  if (phase === 1) {
    const cy = 62, r = 25;
    return wrap(
      topFeature(pet, p, cx, cy - r + 4, 0.8) +
      `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${p.body}" ${o}/>` +
      `<ellipse cx="${cx}" cy="${cy + 11}" rx="12" ry="8" fill="${p.belly}"/>` +
      `<ellipse cx="${cx - 11}" cy="${cy + r - 2}" rx="6" ry="4" fill="${p.body2}" ${o}/>` +
      `<ellipse cx="${cx + 11}" cy="${cy + r - 2}" rx="6" ry="4" fill="${p.body2}" ${o}/>` +
      face(p, cx, cy - 4, 0.85, shadow),
    );
  }
  if (phase === 2) {
    const cy = 58, rx = 27, ry = 32;
    return wrap(
      topFeature(pet, p, cx, cy - ry + 5, 1) +
      `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${p.body}" ${o}/>` +
      `<ellipse cx="${cx}" cy="${cy + 14}" rx="14" ry="11" fill="${p.belly}"/>` +
      `<ellipse cx="${cx - rx - 2}" cy="${cy + 8}" rx="6" ry="8" fill="${p.body}" ${o}/>` +
      `<ellipse cx="${cx + rx + 2}" cy="${cy + 8}" rx="6" ry="8" fill="${p.body}" ${o}/>` +
      `<ellipse cx="${cx - 12}" cy="${cy + ry - 2}" rx="7" ry="4.5" fill="${p.body2}" ${o}/>` +
      `<ellipse cx="${cx + 12}" cy="${cy + ry - 2}" rx="7" ry="4.5" fill="${p.body2}" ${o}/>` +
      face(p, cx, cy - 8, 1, shadow),
    );
  }
  const cy = 56, rx = 32, ry = 37;
  return wrap(
    grandFeature(pet, p, cx, cy, ry) +
    topFeature(pet, p, cx, cy - ry + 6, 1.15) +
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${p.body}" ${o}/>` +
    `<ellipse cx="${cx}" cy="${cy + 17}" rx="17" ry="13" fill="${p.belly}"/>` +
    `<ellipse cx="${cx - rx - 2}" cy="${cy + 10}" rx="7" ry="10" fill="${p.body}" ${o}/>` +
    `<ellipse cx="${cx + rx + 2}" cy="${cy + 10}" rx="7" ry="10" fill="${p.body}" ${o}/>` +
    `<ellipse cx="${cx - 14}" cy="${cy + ry - 2}" rx="8" ry="5" fill="${p.body2}" ${o}/>` +
    `<ellipse cx="${cx + 14}" cy="${cy + ry - 2}" rx="8" ry="5" fill="${p.body2}" ${o}/>` +
    face(p, cx, cy - 10, 1.15, shadow) +
    (shadow ? '' : `<path d="M ${cx + rx - 4} ${cy - ry + 2} l 2.4 4.8 l 5.2 0.8 l -3.8 3.7 l 0.9 5.2 l -4.7 -2.5 l -4.7 2.5 l 0.9 -5.2 l -3.8 -3.7 l 5.2 -0.8 Z" fill="#fde047" stroke="${p.outline}" stroke-width="2"/>`),
  );
}

/** Ovo — casca clara com pintas na cor do pet (ou neutro, sem pet). */
function eggSVG(pet: PetType | null): string {
  const p = pet ? PALETTES[pet] : { body: '#94a3b8', body2: '#64748b', belly: '#f1f5f9', outline: '#334155', cheek: '', pupil: '' };
  return wrap(
    `<path d="M 50 16 C 32 16 24 40 24 58 C 24 76 35 88 50 88 C 65 88 76 76 76 58 C 76 40 68 16 50 16 Z" fill="${p.belly}" stroke="${p.outline}" stroke-width="3.5"/>` +
    `<circle cx="42" cy="44" r="6" fill="${p.body}"/>` +
    `<circle cx="60" cy="58" r="7.5" fill="${p.body}"/>` +
    `<circle cx="44" cy="70" r="5" fill="${p.body2}"/>` +
    `<circle cx="59" cy="34" r="4" fill="${p.body2}"/>`,
  );
}

export const STAGE_SPRITES: Record<string, string> = { egg: uri(eggSVG(null)) };
for (const pet of PET_TYPES) {
  STAGE_SPRITES[`egg-${pet}`] = uri(eggSVG(pet));
  PETS[pet].phases.forEach((formId, i) => {
    const phase = (i + 1) as 1 | 2 | 3;
    STAGE_SPRITES[formId] = uri(petSVG(pet, phase));
    STAGE_SPRITES[`shadow-${formId}`] = uri(petSVG(pet, phase, true));
  });
}

/** Sprite de uma forma; para 'egg', o eggType (quando conhecido) colore o ovo. */
export function getSpriteForStage(stage: string, eggType?: string | null): string {
  const key = stage.toLowerCase();
  if (key === 'egg' || key === 'digiegg') {
    return STAGE_SPRITES[`egg-${eggType ?? ''}`] ?? STAGE_SPRITES.egg;
  }
  return STAGE_SPRITES[key] ?? STAGE_SPRITES.egg;
}

/** Sprites desenhados virados para a ESQUERDA (nenhum, na arte nova). */
export const LEFT_FACING_STAGES: string[] = [];
