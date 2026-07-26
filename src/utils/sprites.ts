// Arte dos pets — mascotes SVG originais (estilo flat/arredondado), gerados em
// código e servidos como data-URIs. O mapa STAGE_SPRITES mantém o mesmo
// contrato de antes (chave da forma → src de imagem), então CompanionHUD,
// masmorra, página de evolução e onboarding consomem sem mudanças de shape.
//
// Espécie por pet (cresce em "assinatura" a cada fase):
//   vix  (roxo)  — Gatoelho-lebrilope: gato + orelhas de lebre + chifres de antílope
//   momo (rosa)  — Cérbero: cão de 1 → 2 → 3 cabeças + coleira de espinhos
//   kiwi (verde) — Cachorro-panqueca: corpo achatando a cada fase até virar panqueca
//
// Chaves disponíveis:
//   'egg'                     — ovo neutro (fallback)
//   'egg-vix' | 'egg-momo' | 'egg-kiwi' — ovo na cor do pet
//   '<pet>-<1|2|3>'           — as 9 formas (3 pets × 3 fases)
//   'shadow-<pet>-<1|2|3>'    — variantes sombrias (inimigos da masmorra)
import { PETS, PET_TYPES, type PetType } from '../types/progression';

// Arte PNG (pixel art) — os 3 pets usam imagens (src/assets/pets/*.png,
// 320×320, fundo transparente) em vez de SVG gerado. As shadow-* são as
// silhuetas dos inimigos da masmorra.
import vix1 from '../assets/pets/vix-1.png';
import vix2 from '../assets/pets/vix-2.png';
import vix3 from '../assets/pets/vix-3.png';
import shadowVix1 from '../assets/pets/shadow-vix-1.png';
import shadowVix2 from '../assets/pets/shadow-vix-2.png';
import shadowVix3 from '../assets/pets/shadow-vix-3.png';
import momo1 from '../assets/pets/momo-1.png';
import momo2 from '../assets/pets/momo-2.png';
import momo3 from '../assets/pets/momo-3.png';
import kiwi1 from '../assets/pets/kiwi-1.png';
import kiwi2 from '../assets/pets/kiwi-2.png';
import kiwi3 from '../assets/pets/kiwi-3.png';
import shadowMomo1 from '../assets/pets/shadow-momo-1.png';
import shadowMomo2 from '../assets/pets/shadow-momo-2.png';
import shadowMomo3 from '../assets/pets/shadow-momo-3.png';
import shadowKiwi1 from '../assets/pets/shadow-kiwi-1.png';
import shadowKiwi2 from '../assets/pets/shadow-kiwi-2.png';
import shadowKiwi3 from '../assets/pets/shadow-kiwi-3.png';

// Expressões extras por FASE (comer/andar/feliz/idle alternativo/sonolento)
// — uma pose por forma (9 formas × 5 poses = 45), pra bater com a arte de
// cada fase. Geradas no Higgsfield a partir do sprite de cada forma.
import vix1Eat from '../assets/pets/vix-1-eat.png';
import vix1Walk from '../assets/pets/vix-1-walk.png';
import vix1Happy from '../assets/pets/vix-1-happy.png';
import vix1Idle2 from '../assets/pets/vix-1-idle2.png';
import vix1Sleepy from '../assets/pets/vix-1-sleepy.png';
import vix2Eat from '../assets/pets/vix-2-eat.png';
import vix2Walk from '../assets/pets/vix-2-walk.png';
import vix2Happy from '../assets/pets/vix-2-happy.png';
import vix2Idle2 from '../assets/pets/vix-2-idle2.png';
import vix2Sleepy from '../assets/pets/vix-2-sleepy.png';
import vix3Eat from '../assets/pets/vix-3-eat.png';
import vix3Walk from '../assets/pets/vix-3-walk.png';
import vix3Happy from '../assets/pets/vix-3-happy.png';
import vix3Idle2 from '../assets/pets/vix-3-idle2.png';
import vix3Sleepy from '../assets/pets/vix-3-sleepy.png';
import momo1Eat from '../assets/pets/momo-1-eat.png';
import momo1Walk from '../assets/pets/momo-1-walk.png';
import momo1Happy from '../assets/pets/momo-1-happy.png';
import momo1Idle2 from '../assets/pets/momo-1-idle2.png';
import momo1Sleepy from '../assets/pets/momo-1-sleepy.png';
import momo2Eat from '../assets/pets/momo-2-eat.png';
import momo2Walk from '../assets/pets/momo-2-walk.png';
import momo2Happy from '../assets/pets/momo-2-happy.png';
import momo2Idle2 from '../assets/pets/momo-2-idle2.png';
import momo2Sleepy from '../assets/pets/momo-2-sleepy.png';
import momo3Eat from '../assets/pets/momo-3-eat.png';
import momo3Walk from '../assets/pets/momo-3-walk.png';
import momo3Happy from '../assets/pets/momo-3-happy.png';
import momo3Idle2 from '../assets/pets/momo-3-idle2.png';
import momo3Sleepy from '../assets/pets/momo-3-sleepy.png';
import kiwi1Eat from '../assets/pets/kiwi-1-eat.png';
import kiwi1Walk from '../assets/pets/kiwi-1-walk.png';
import kiwi1Happy from '../assets/pets/kiwi-1-happy.png';
import kiwi1Idle2 from '../assets/pets/kiwi-1-idle2.png';
import kiwi1Sleepy from '../assets/pets/kiwi-1-sleepy.png';
import kiwi2Eat from '../assets/pets/kiwi-2-eat.png';
import kiwi2Walk from '../assets/pets/kiwi-2-walk.png';
import kiwi2Happy from '../assets/pets/kiwi-2-happy.png';
import kiwi2Idle2 from '../assets/pets/kiwi-2-idle2.png';
import kiwi2Sleepy from '../assets/pets/kiwi-2-sleepy.png';
import kiwi3Eat from '../assets/pets/kiwi-3-eat.png';
import kiwi3Walk from '../assets/pets/kiwi-3-walk.png';
import kiwi3Happy from '../assets/pets/kiwi-3-happy.png';
import kiwi3Idle2 from '../assets/pets/kiwi-3-idle2.png';
import kiwi3Sleepy from '../assets/pets/kiwi-3-sleepy.png';

// Monstros criativos da masmorra (além das sombras dos 3 pets): sorteados
// junto com shadow-<pet>-<fase> em utils/dungeon.ts (ver dungeonEnemies.ts).
import enemySlime from '../assets/enemies/enemy-slime.png';
import enemyWisp from '../assets/enemies/enemy-wisp.png';
import enemyMummy from '../assets/enemies/enemy-mummy.png';
import enemyGolem from '../assets/enemies/enemy-golem.png';
import enemyDemon from '../assets/enemies/enemy-demon.png';
import enemyWraith from '../assets/enemies/enemy-wraith.png';

const PNG_SPRITES: Record<string, string> = {
  'vix-1': vix1, 'vix-2': vix2, 'vix-3': vix3,
  'shadow-vix-1': shadowVix1, 'shadow-vix-2': shadowVix2, 'shadow-vix-3': shadowVix3,
  'momo-1': momo1, 'momo-2': momo2, 'momo-3': momo3,
  'kiwi-1': kiwi1, 'kiwi-2': kiwi2, 'kiwi-3': kiwi3,
  'shadow-momo-1': shadowMomo1, 'shadow-momo-2': shadowMomo2, 'shadow-momo-3': shadowMomo3,
  'shadow-kiwi-1': shadowKiwi1, 'shadow-kiwi-2': shadowKiwi2, 'shadow-kiwi-3': shadowKiwi3,
  'enemy-slime': enemySlime, 'enemy-wisp': enemyWisp, 'enemy-mummy': enemyMummy,
  'enemy-golem': enemyGolem, 'enemy-demon': enemyDemon, 'enemy-wraith': enemyWraith,
};

export type PetExpression = 'eat' | 'walk' | 'happy' | 'idle2' | 'sleepy';

// Chave = forma completa ('vix-1', 'momo-2', ...) — cada fase tem sua
// própria pose (a arte muda bastante entre fases, uma pose só por espécie
// não bateria direito com fase 2/3).
const STAGE_EXPRESSIONS: Record<string, Record<PetExpression, string>> = {
  'vix-1': { eat: vix1Eat, walk: vix1Walk, happy: vix1Happy, idle2: vix1Idle2, sleepy: vix1Sleepy },
  'vix-2': { eat: vix2Eat, walk: vix2Walk, happy: vix2Happy, idle2: vix2Idle2, sleepy: vix2Sleepy },
  'vix-3': { eat: vix3Eat, walk: vix3Walk, happy: vix3Happy, idle2: vix3Idle2, sleepy: vix3Sleepy },
  'momo-1': { eat: momo1Eat, walk: momo1Walk, happy: momo1Happy, idle2: momo1Idle2, sleepy: momo1Sleepy },
  'momo-2': { eat: momo2Eat, walk: momo2Walk, happy: momo2Happy, idle2: momo2Idle2, sleepy: momo2Sleepy },
  'momo-3': { eat: momo3Eat, walk: momo3Walk, happy: momo3Happy, idle2: momo3Idle2, sleepy: momo3Sleepy },
  'kiwi-1': { eat: kiwi1Eat, walk: kiwi1Walk, happy: kiwi1Happy, idle2: kiwi1Idle2, sleepy: kiwi1Sleepy },
  'kiwi-2': { eat: kiwi2Eat, walk: kiwi2Walk, happy: kiwi2Happy, idle2: kiwi2Idle2, sleepy: kiwi2Sleepy },
  'kiwi-3': { eat: kiwi3Eat, walk: kiwi3Walk, happy: kiwi3Happy, idle2: kiwi3Idle2, sleepy: kiwi3Sleepy },
};

/** Pose extra de uma forma (comer/andar/feliz/idle alternativo/sonolento).
 * Cai pro sprite normal da forma quando não há pose extra (ovo, formas
 * desconhecidas). */
export function getExpressionSprite(stage: string, expr: PetExpression): string {
  const key = stage.toLowerCase();
  return STAGE_EXPRESSIONS[key]?.[expr] ?? getSpriteForStage(stage);
}

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

// Olhos + bochechas + boca, compartilhados pelas 3 espécies.
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

// Bigodes de gato — só no Vix (gatoelho-lebrilope).
function whiskers(p: Palette, cx: number, cy: number, s: number): string {
  const side = (sign: 1 | -1) => {
    const baseX = cx + sign * 15 * s;
    return [-3, 0, 3].map(dy =>
      `<line x1="${baseX}" y1="${cy + dy * s}" x2="${baseX + sign * 9 * s}" y2="${cy + dy * 1.4 * s}" stroke="${p.outline}" stroke-width="${0.9 * s}" stroke-linecap="round" opacity="0.5"/>`
    ).join('');
  };
  return side(1) + side(-1);
}

// Pé/perna simples, reaproveitado pelas 3 espécies.
function feet(p: Palette, cx: number, cy: number, spread: number, s: number): string {
  const o = `stroke="${p.outline}" stroke-width="2.6"`;
  return `<ellipse cx="${cx - spread}" cy="${cy}" rx="${6 * s}" ry="${4 * s}" fill="${p.body2}" ${o}/>` +
         `<ellipse cx="${cx + spread}" cy="${cy}" rx="${6 * s}" ry="${4 * s}" fill="${p.body2}" ${o}/>`;
}

// ── Vix — Gatoelho-lebrilope (gato + orelhas de lebre + chifres de antílope) ──
function earsCatSmall(p: Palette, cx: number, y: number, s: number): string {
  const o = `stroke="${p.outline}" stroke-width="3" stroke-linejoin="round"`;
  return `<path d="M ${cx - 15 * s} ${y + 6 * s} L ${cx - 20 * s} ${y - 11 * s} L ${cx - 5 * s} ${y - 1 * s} Z" fill="${p.body2}" ${o}/>` +
         `<path d="M ${cx + 15 * s} ${y + 6 * s} L ${cx + 20 * s} ${y - 11 * s} L ${cx + 5 * s} ${y - 1 * s} Z" fill="${p.body2}" ${o}/>`;
}

function earsHareTall(p: Palette, cx: number, y: number, s: number, height: number): string {
  const o = `stroke="${p.outline}" stroke-width="3" stroke-linejoin="round"`;
  const ear = (sign: 1 | -1) => `
    <path d="M ${cx + sign * 11 * s} ${y + 4 * s}
             C ${cx + sign * 6 * s} ${y - height * 0.5} ${cx + sign * 13 * s} ${y - height * 0.85} ${cx + sign * 9 * s} ${y - height}
             C ${cx + sign * 5 * s} ${y - height * 0.82} ${cx + sign * 1 * s} ${y - height * 0.4} ${cx + sign * 1 * s} ${y + 2 * s} Z"
          fill="${p.body}" ${o}/>
    <path d="M ${cx + sign * 8 * s} ${y - 1 * s}
             C ${cx + sign * 5 * s} ${y - height * 0.5} ${cx + sign * 9.5 * s} ${y - height * 0.78} ${cx + sign * 7 * s} ${y - height * 0.9}
             C ${cx + sign * 4 * s} ${y - height * 0.5} ${cx + sign * 3.5 * s} ${y - height * 0.25} ${cx + sign * 4 * s} ${y}  Z"
          fill="${p.belly}"/>`;
  return ear(1) + ear(-1);
}

// Chifres sólidos (preenchidos, não só um traço) — uma base junto à cabeça
// que se curva pra fora e volta pra dentro na ponta, silhueta de chifre.
function hornsAntelope(p: Palette, cx: number, y: number, s: number, len: number): string {
  const o = `stroke="${p.outline}" stroke-width="1.8" stroke-linejoin="round"`;
  const horn = (sign: 1 | -1) => {
    const baseIn = cx + sign * 3 * s;
    const baseOut = cx + sign * 8 * s;
    const tipX = cx + sign * 11 * s;
    const tipY = y - len;
    const ctrlOutX = cx + sign * 15 * s;
    const ctrlInX = cx + sign * 2 * s;
    let d = `M ${baseIn} ${y} L ${baseOut} ${y} Q ${ctrlOutX} ${y - len * 0.6} ${tipX} ${tipY} Q ${ctrlInX} ${y - len * 0.5} ${baseIn} ${y} Z`;
    let path = `<path d="${d}" fill="${p.body2}" ${o}/>`;
    // 1 anel de textura perto da base
    const ringY = y - len * 0.32;
    path += `<line x1="${cx + sign * 2.5 * s}" y1="${ringY}" x2="${cx + sign * 10 * s}" y2="${ringY - len * 0.06}" stroke="${p.outline}" stroke-width="1.2" opacity="0.5"/>`;
    return path;
  };
  return horn(1) + horn(-1);
}

// Rabo fofo — encostado na base do corpo, quase todo "atrás" (só o volume aparece).
function tailCotton(p: Palette, cx: number, cy: number, s: number): string {
  return `<circle cx="${cx}" cy="${cy}" r="${6 * s}" fill="${p.belly}" stroke="${p.outline}" stroke-width="2.2"/>` +
    `<circle cx="${cx + 3 * s}" cy="${cy - 3 * s}" r="${3 * s}" fill="${p.belly}" stroke="${p.outline}" stroke-width="1.6"/>`;
}

function vixSVG(phase: 1 | 2 | 3, p: Palette, shadow: boolean): string {
  const o = `stroke="${p.outline}" stroke-width="3.5"`;
  const cx = 50;
  // Chifres e rabo-de-algodão são desenhados por CIMA do corpo (senão a
  // elipse do corpo, pintada depois, cobriria eles por completo).
  if (phase === 1) {
    const cy = 62, r = 25;
    return wrap(
      earsCatSmall(p, cx, cy - r + 4, 0.85) +
      `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${p.body}" ${o}/>` +
      `<ellipse cx="${cx}" cy="${cy + 11}" rx="12" ry="8" fill="${p.belly}"/>` +
      feet(p, cx, cy + r - 2, 11, 1) +
      face(p, cx, cy - 4, 0.85, shadow) +
      (shadow ? '' : whiskers(p, cx, cy - 2, 0.85)),
    );
  }
  if (phase === 2) {
    const cy = 58, rx = 27, ry = 32;
    return wrap(
      earsHareTall(p, cx, cy - ry + 10, 1, 26) +
      `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${p.body}" ${o}/>` +
      `<ellipse cx="${cx}" cy="${cy + 14}" rx="14" ry="11" fill="${p.belly}"/>` +
      feet(p, cx, cy + ry - 2, 13, 1) +
      (shadow ? '' : hornsAntelope(p, cx, cy - ry + 13, 1, 11)) +
      face(p, cx, cy - 6, 1, shadow) +
      (shadow ? '' : whiskers(p, cx, cy - 4, 1)),
    );
  }
  const cy = 56, rx = 32, ry = 37;
  return wrap(
    earsHareTall(p, cx, cy - ry + 12, 1.15, 34) +
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${p.body}" ${o}/>` +
    `<ellipse cx="${cx}" cy="${cy + 17}" rx="17" ry="13" fill="${p.belly}"/>` +
    feet(p, cx, cy + ry - 3, 15, 1) +
    (shadow ? '' : tailCotton(p, cx + rx - 10, cy + ry * 0.55, 1)) +
    (shadow ? '' : hornsAntelope(p, cx, cy - ry + 15, 1.15, 20)) +
    face(p, cx, cy - 8, 1.15, shadow) +
    (shadow ? '' : whiskers(p, cx, cy - 6, 1.15)),
  );
}

// ── Momo — Cérbero (cão de 1 → 2 → 3 cabeças + coleira de espinhos) ──────────
function earDogFloppy(p: Palette, cx: number, cy: number, s: number, sign: 1 | -1, size = 1): string {
  const o = `stroke="${p.outline}" stroke-width="2.6" stroke-linejoin="round"`;
  const w = 9 * s * size, h = 15 * s * size;
  return `<path d="M ${cx} ${cy}
           C ${cx + sign * w} ${cy - h * 0.3} ${cx + sign * w * 1.25} ${cy + h * 0.55} ${cx + sign * w * 0.55} ${cy + h}
           C ${cx + sign * w * 0.15} ${cy + h * 0.55} ${cx} ${cy + h * 0.15} ${cx} ${cy} Z" fill="${p.body2}" ${o}/>`;
}

// Colar de espinhos — uma faixa FINA e ESTREITA (não pode competir com o
// rosto): fica abaixo do queixo, bem menor que a largura do corpo.
function collarSpikes(p: Palette, cx: number, cy: number, halfWidth: number): string {
  const o = `stroke="${p.outline}" stroke-width="1.2" stroke-linejoin="round"`;
  let out = `<rect x="${cx - halfWidth}" y="${cy - 1.5}" width="${halfWidth * 2}" height="3" rx="1.5" fill="${p.body2}" ${o}/>`;
  const count = 4;
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1) - 0.5;
    const x = cx + t * halfWidth * 1.7;
    out += `<path d="M ${x - 2.2} ${cy} L ${x} ${cy - 4.5} L ${x + 2.2} ${cy} Z" fill="#e2e8f0" ${o}/>`;
  }
  return out;
}

function sideHead(p: Palette, cx: number, cy: number, r: number, sign: 1 | -1, shadow: boolean): string {
  const o = `stroke="${p.outline}" stroke-width="2.4"`;
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${p.body}" ${o}/>` +
    earDogFloppy(p, cx + sign * r * 0.6, cy - r * 0.5, 1, sign, 0.55) +
    face(p, cx, cy + 1, r / 11, shadow);
}

function momoSVG(phase: 1 | 2 | 3, p: Palette, shadow: boolean): string {
  const o = `stroke="${p.outline}" stroke-width="3.5"`;
  const cx = 50;
  if (phase === 1) {
    const cy = 62, r = 25;
    return wrap(
      earDogFloppy(p, cx - r * 0.55, cy - r * 0.55, 1, -1, 0.85) +
      earDogFloppy(p, cx + r * 0.55, cy - r * 0.55, 1, 1, 0.85) +
      `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${p.body}" ${o}/>` +
      `<ellipse cx="${cx}" cy="${cy + 11}" rx="12" ry="8" fill="${p.belly}"/>` +
      feet(p, cx, cy + r - 2, 11, 1) +
      face(p, cx, cy - 2, 0.85, shadow),
    );
  }
  if (phase === 2) {
    const cy = 58, rx = 27, ry = 32;
    const faceCy = cy - 6;
    return wrap(
      sideHead(p, cx + rx - 2, cy - ry + 16, 11, 1, shadow) +
      earDogFloppy(p, cx - rx * 0.55, cy - ry + 8, 1, -1, 1) +
      earDogFloppy(p, cx + rx * 0.4, cy - ry + 4, 1, 1, 0.8) +
      `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${p.body}" ${o}/>` +
      `<ellipse cx="${cx}" cy="${cy + 14}" rx="14" ry="11" fill="${p.belly}"/>` +
      feet(p, cx, cy + ry - 2, 13, 1) +
      face(p, cx - 3, faceCy, 1, shadow) +
      (shadow ? '' : collarSpikes(p, cx - 3, faceCy + 15, 9)),
    );
  }
  const cy = 56, rx = 32, ry = 37;
  const faceCy = cy - 11;
  return wrap(
    sideHead(p, cx - rx + 2, cy - ry + 20, 13, -1, shadow) +
    sideHead(p, cx + rx - 2, cy - ry + 20, 13, 1, shadow) +
    earDogFloppy(p, cx - rx * 0.42, cy - ry + 6, 1.1, -1, 1.05) +
    earDogFloppy(p, cx + rx * 0.42, cy - ry + 6, 1.1, 1, 1.05) +
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${p.body}" ${o}/>` +
    `<ellipse cx="${cx}" cy="${cy + 17}" rx="17" ry="13" fill="${p.belly}"/>` +
    feet(p, cx, cy + ry - 3, 15, 1) +
    face(p, cx, faceCy, 1.15, shadow) +
    (shadow ? '' : collarSpikes(p, cx, faceCy + 17, 11)),
  );
}

// ── Kiwi — Cachorro-panqueca (achata mais a cada fase) ──────────────────────
// Recebe o centro da orelha JÁ calculado pelo chamador (não deriva do próprio
// raio da orelha) — senão, em corpos largos, as duas orelhas ficam pertinho
// do centro e formam um "laço" em vez de ficarem nas laterais.
function earPancake(p: Palette, ex: number, ey: number, sign: 1 | -1, rx: number, ry: number): string {
  const o = `stroke="${p.outline}" stroke-width="2.6"`;
  return `<ellipse cx="${ex}" cy="${ey}" rx="${rx}" ry="${ry}" fill="${p.body2}" ${o} transform="rotate(${sign * 24} ${ex} ${ey})"/>`;
}

function noseDot(p: Palette, cx: number, cy: number, s: number): string {
  return `<circle cx="${cx}" cy="${cy}" r="${1.8 * s}" fill="${p.outline}"/>`;
}

function pancakeTopping(cx: number, y: number): string {
  // pingo de manteiga + fiozinho de calda — só na fase 3, puro visual, cor fixa
  return `<rect x="${cx - 4}" y="${y}" width="8" height="6" rx="1.5" fill="#fde68a" stroke="#b45309" stroke-width="1.2"/>` +
    `<path d="M ${cx - 14} ${y + 10} q 6 6 12 0 q 6 -6 12 0" fill="none" stroke="#d97706" stroke-width="1.6" stroke-linecap="round" opacity="0.75"/>`;
}

function kiwiSVG(phase: 1 | 2 | 3, p: Palette, shadow: boolean): string {
  const o = `stroke="${p.outline}" stroke-width="3.5"`;
  const cx = 50;
  if (phase === 1) {
    const cy = 60, rx = 28, ry = 23;
    const earY = cy - ry + 8;
    return wrap(
      earPancake(p, cx - rx * 0.72, earY, -1, 8, 12) +
      earPancake(p, cx + rx * 0.72, earY, 1, 8, 12) +
      `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${p.body}" ${o}/>` +
      `<ellipse cx="${cx}" cy="${cy + 8}" rx="13" ry="8" fill="${p.belly}"/>` +
      feet(p, cx, cy + ry - 1, 12, 1) +
      face(p, cx, cy - 2, 0.85, shadow) +
      (shadow ? '' : noseDot(p, cx, cy + 6, 0.85)),
    );
  }
  if (phase === 2) {
    const cy = 57, rx = 33, ry = 19;
    const earY = cy - ry + 5;
    return wrap(
      earPancake(p, cx - rx * 0.76, earY, -1, 9, 14) +
      earPancake(p, cx + rx * 0.76, earY, 1, 9, 14) +
      `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${p.body}" ${o}/>` +
      `<ellipse cx="${cx}" cy="${cy + 6}" rx="16" ry="8" fill="${p.belly}"/>` +
      feet(p, cx, cy + ry - 1, 18, 0.9) +
      `<ellipse cx="${cx - 6}" cy="${cy + ry + 1}" rx="4.5" ry="3" fill="${p.body2}" ${o}/>` +
      `<ellipse cx="${cx + 6}" cy="${cy + ry + 1}" rx="4.5" ry="3" fill="${p.body2}" ${o}/>` +
      face(p, cx, cy - 4, 0.95, shadow) +
      (shadow ? '' : noseDot(p, cx, cy + 3, 0.95)),
    );
  }
  const cy = 54, rx = 40, ry = 15;
  const earY = cy - 4;
  return wrap(
    earPancake(p, cx - rx * 0.8, earY, -1, 10, 16) +
    earPancake(p, cx + rx * 0.8, earY, 1, 10, 16) +
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${p.body}" ${o}/>` +
    `<ellipse cx="${cx}" cy="${cy + 4}" rx="19" ry="7" fill="${p.belly}"/>` +
    feet(p, cx, cy + ry - 1, 22, 0.85) +
    `<ellipse cx="${cx - 12}" cy="${cy + ry + 2}" rx="4" ry="3" fill="${p.body2}" ${o}/>` +
    `<ellipse cx="${cx + 12}" cy="${cy + ry + 2}" rx="4" ry="3" fill="${p.body2}" ${o}/>` +
    face(p, cx, cy - 3, 1, shadow) +
    (shadow ? '' : noseDot(p, cx, cy + 3, 1)) +
    (shadow ? '' : pancakeTopping(cx, cy - ry - 8)),
  );
}

/** Uma forma do pet. phase: 1 (pequeno) · 2 (médio) · 3 (grande). */
function petSVG(pet: PetType, phase: 1 | 2 | 3, shadow = false): string {
  const p = shadow ? SHADOW_PALETTE : PALETTES[pet];
  if (pet === 'vix') return vixSVG(phase, p, shadow);
  if (pet === 'momo') return momoSVG(phase, p, shadow);
  return kiwiSVG(phase, p, shadow);
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
    STAGE_SPRITES[formId] = PNG_SPRITES[formId] ?? uri(petSVG(pet, phase));
    STAGE_SPRITES[`shadow-${formId}`] =
      PNG_SPRITES[`shadow-${formId}`] ?? uri(petSVG(pet, phase, true));
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
