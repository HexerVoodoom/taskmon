import { useState, useEffect, useRef, useCallback } from 'react';
import { playImpact, playTaskComplete } from '../utils/sounds';
import { STORAGE_KEYS } from '../utils/storageKeys';
import type { Language } from '../utils/i18n';
import carPetsImg from '../assets/werewolf/car-pets.png';
import werewolfImg from '../assets/werewolf/werewolf.png';
import moonImg from '../assets/werewolf/moon.png';
import treeRoundImg from '../assets/werewolf/tree-round.png';
import treePineImg from '../assets/werewolf/tree-pine.png';
import treeLayeredImg from '../assets/werewolf/tree-layered.png';
import bushFlowerImg from '../assets/werewolf/bush-flower.png';
import bushPlainImg from '../assets/werewolf/bush-plain.png';
import cloudBigImg from '../assets/werewolf/cloud-big.png';
import cloudMedImg from '../assets/werewolf/cloud-med.png';
import cloudSmallImg from '../assets/werewolf/cloud-small.png';

const SCENERY_SRCS = [treeRoundImg, treePineImg, treeLayeredImg, bushFlowerImg, bushPlainImg];
const CLOUD_SRCS = [cloudBigImg, cloudMedImg, cloudSmallImg];

/**
 * Werewolf Run — night drive starring all 3 pets together in the car (the
 * "todos os 3 aparecem sempre" ask: it's not a per-profile pet, the trio
 * rides together always). Werewolves lunge out of 1 of 3 lanes on a
 * pseudo-3D road; steer the car left/right to line up and run them over.
 * Chill, no-penalty minigame (same spirit as Bubble Pop/Flower Catch): a
 * missed werewolf just vanishes past the car, no cost. Timed round.
 * Scoring: 🪙 +1 Bit per werewolf hit.
 */
const ROUND_SECONDS = 40;
const HIT_POINTS = 1;
const APPROACH_S = 2.3; // seconds for a werewolf to go from the horizon to the car
const MIN_SPAWN_S = 0.55;
const MAX_SPAWN_S = 1.15;
const HIT_T_MIN = 0.85; // must be this close before it counts as a hit
const LANES = [-1, 0, 1] as const;

interface Wolf { id: number; lane: number; t: number; speed: number; hit: boolean; hitT: number }
interface Tree { id: number; side: -1 | 1; t: number; jitter: number; kind: number; speed: number }
interface ImpactFx { id: number; x: number; y: number; t: number }

let nextWolfId = 0;
let nextTreeId = 0;
let nextFxId = 0;

export function WerewolfRunGame({ language, onEarnPoints, onExit }: {
  language: Language;
  onEarnPoints: (pts: number) => void;
  onExit: () => void;
}) {
  const isPt = language === 'pt-BR';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scoreElRef = useRef<HTMLSpanElement>(null);
  const timeElRef = useRef<HTMLSpanElement>(null);
  const carImgRef = useRef<HTMLImageElement | null>(null);
  const wolfImgRef = useRef<HTMLImageElement | null>(null);
  const moonImgRef = useRef<HTMLImageElement | null>(null);
  const sceneryImgsRef = useRef<HTMLImageElement[]>([]);
  const cloudImgsRef = useRef<HTMLImageElement[]>([]);

  const [phase, setPhase] = useState<'ready' | 'playing' | 'over'>('ready');
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const [finalScore, setFinalScore] = useState(0);
  const [best, setBest] = useState(() => Number(localStorage.getItem(STORAGE_KEYS.WEREWOLF_BEST)) || 0);

  // Physics/game state lives in a ref — the loop never re-renders React.
  const g = useRef({
    t: 0,
    timeLeft: ROUND_SECONDS,
    carLane: 0, // -1, 0, 1
    carX: 0,    // smoothed screen-space x, set once we know canvas width
    wolves: [] as Wolf[],
    trees: [] as Tree[],
    fx: [] as ImpactFx[],
    spawnIn: 0.6,
    treeSpawnIn: 0,
    score: 0,
    shake: 0,
    cloudPhase: 0,
  });

  useEffect(() => {
    const car = new Image(); car.src = carPetsImg; carImgRef.current = car;
    const wolf = new Image(); wolf.src = werewolfImg; wolfImgRef.current = wolf;
    const moon = new Image(); moon.src = moonImg; moonImgRef.current = moon;
    sceneryImgsRef.current = SCENERY_SRCS.map(src => { const img = new Image(); img.src = src; return img; });
    cloudImgsRef.current = CLOUD_SRCS.map(src => { const img = new Image(); img.src = src; return img; });
  }, []);

  const setLane = useCallback((dir: -1 | 1) => {
    if (phaseRef.current !== 'playing') return;
    const s = g.current;
    s.carLane = Math.max(-1, Math.min(1, s.carLane + dir));
    try { navigator.vibrate?.(10); } catch { /* noop */ }
  }, []);

  const start = () => {
    g.current = {
      t: 0, timeLeft: ROUND_SECONDS, carLane: 0, carX: g.current.carX,
      wolves: [], trees: [], fx: [], spawnIn: 0.5, treeSpawnIn: 0, score: 0, shake: 0, cloudPhase: 0,
    };
    setPhase('playing');
  };

  useEffect(() => {
    if (phase !== 'playing') return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    canvas.width = canvas.clientWidth;
    canvas.height = 260;
    ctx.imageSmoothingEnabled = false;
    const W = canvas.width, H = canvas.height;
    const HORIZON_Y = H * 0.34;
    const ROAD_HALF_MAX = W * 0.46;
    const CENTER_X = W / 2;
    const s = g.current;
    if (!s.carX) s.carX = CENTER_X;
    let raf = 0;
    let last = performance.now();

    const roadHalfAt = (z: number) => ROAD_HALF_MAX * z;
    const laneX = (lane: number, z: number) => CENTER_X + lane * roadHalfAt(z) * 0.6;
    const depthY = (z: number) => HORIZON_Y + (H - HORIZON_Y) * z;

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      s.t += dt;
      s.cloudPhase += dt;
      s.shake = Math.max(0, s.shake - dt * 3.2);

      // Countdown
      s.timeLeft = Math.max(0, s.timeLeft - dt);
      if (timeElRef.current) timeElRef.current.textContent = String(Math.ceil(s.timeLeft));

      // Difficulty: spawn a bit faster as the round goes on
      const progress = 1 - s.timeLeft / ROUND_SECONDS;
      const spawnScale = 1 - progress * 0.35;

      // Spawn werewolves
      s.spawnIn -= dt;
      if (s.spawnIn <= 0 && s.timeLeft > 0.5) {
        const lane = LANES[Math.floor(Math.random() * LANES.length)];
        s.wolves.push({ id: nextWolfId++, lane, t: 0, speed: 1 / (APPROACH_S * (0.85 + Math.random() * 0.3)), hit: false, hitT: 0 });
        s.spawnIn = (MIN_SPAWN_S + Math.random() * (MAX_SPAWN_S - MIN_SPAWN_S)) * spawnScale;
      }

      // Spawn roadside trees (purely decorative parallax)
      s.treeSpawnIn -= dt;
      if (s.treeSpawnIn <= 0) {
        s.trees.push({ id: nextTreeId++, side: Math.random() < 0.5 ? -1 : 1, t: 0, jitter: Math.random() * 0.35, kind: Math.floor(Math.random() * SCENERY_SRCS.length), speed: 1 / 2.6 });
        s.treeSpawnIn = 0.35 + Math.random() * 0.35;
      }
      for (const tr of s.trees) tr.t += dt * tr.speed;
      s.trees = s.trees.filter(tr => tr.t < 1.08);

      // Advance werewolves + hit test
      for (const w of s.wolves) {
        if (w.hit) { w.hitT += dt; continue; }
        w.t += dt * w.speed;
        if (w.t >= HIT_T_MIN && w.lane === s.carLane) {
          w.hit = true; w.hitT = 0;
          s.score += HIT_POINTS;
          onEarnPoints(HIT_POINTS);
          playImpact();
          try { navigator.vibrate?.(25); } catch { /* noop */ }
          s.shake = 1;
          const z = w.t * w.t;
          s.fx.push({ id: nextFxId++, x: laneX(w.lane, z), y: depthY(z), t: 0 });
        }
      }
      s.wolves = s.wolves.filter(w => w.hit ? w.hitT < 0.35 : w.t < 1.05);
      for (const f of s.fx) f.t += dt;
      s.fx = s.fx.filter(f => f.t < 0.4);

      // Smooth car lane transition
      const targetX = laneX(s.carLane, 1);
      s.carX += (targetX - s.carX) * Math.min(1, dt * 10);

      // ── Draw ──────────────────────────────────────────────────────────
      ctx.save();
      if (s.shake > 0) {
        const m = s.shake * 5;
        ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
      }
      ctx.clearRect(-10, -10, W + 20, H + 20);

      // Sky
      const sky = ctx.createLinearGradient(0, 0, 0, HORIZON_Y);
      sky.addColorStop(0, '#0b0f2e');
      sky.addColorStop(1, '#241b4d');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, HORIZON_Y);

      // Moon
      const moon = moonImgRef.current;
      if (moon?.complete) {
        const ms = W * 0.22;
        ctx.drawImage(moon, W * 0.68, H * 0.04, ms, ms);
      }

      // Clouds — real sprites drifting slowly across the sky (parallax)
      const clouds = cloudImgsRef.current;
      if (clouds.length) {
        ctx.globalAlpha = 0.8;
        for (let i = 0; i < 3; i++) {
          const img = clouds[i % clouds.length];
          if (!img.complete || !img.naturalWidth) continue;
          const cw = W * (0.32 - i * 0.06);
          const ch = cw * (img.naturalHeight / img.naturalWidth);
          const cx = ((s.cloudPhase * (7 + i * 3) + i * 160) % (W + cw * 2)) - cw;
          const cy = H * (0.05 + i * 0.07);
          ctx.drawImage(img, cx, cy, cw, ch);
        }
        ctx.globalAlpha = 1;
      }

      // Distant hills / grass beyond the road
      ctx.fillStyle = '#0e1a12';
      ctx.fillRect(0, HORIZON_Y, W, H - HORIZON_Y);

      // Road (trapezoid)
      ctx.beginPath();
      ctx.moveTo(CENTER_X - 3, HORIZON_Y);
      ctx.lineTo(CENTER_X + 3, HORIZON_Y);
      ctx.lineTo(CENTER_X + ROAD_HALF_MAX, H);
      ctx.lineTo(CENTER_X - ROAD_HALF_MAX, H);
      ctx.closePath();
      const road = ctx.createLinearGradient(0, HORIZON_Y, 0, H);
      road.addColorStop(0, '#2c2f3d');
      road.addColorStop(1, '#14151c');
      ctx.fillStyle = road;
      ctx.fill();

      // Road edges (light shoulder lines)
      ctx.strokeStyle = 'rgba(230,230,235,0.55)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(CENTER_X - 3, HORIZON_Y); ctx.lineTo(CENTER_X - ROAD_HALF_MAX, H);
      ctx.moveTo(CENTER_X + 3, HORIZON_Y); ctx.lineTo(CENTER_X + ROAD_HALF_MAX, H);
      ctx.stroke();

      // Dashed lane dividers (between the 3 lanes), scrolling toward viewer
      ctx.strokeStyle = 'rgba(250,210,60,0.85)';
      const dashCount = 10;
      const scroll = (s.t * 0.55) % (1 / dashCount);
      for (const laneEdge of [-0.5, 0.5]) {
        for (let i = 0; i < dashCount; i++) {
          const z0 = i / dashCount + scroll;
          const z1 = z0 + 0.045;
          if (z0 > 1) continue;
          const zc0 = Math.min(1, z0), zc1 = Math.min(1, z1);
          ctx.lineWidth = 1 + zc0 * 3;
          ctx.beginPath();
          ctx.moveTo(laneX(laneEdge * 2, zc0), depthY(zc0));
          ctx.lineTo(laneX(laneEdge * 2, zc1), depthY(zc1));
          ctx.stroke();
        }
      }

      // Roadside trees/bushes (parallax scenery) — real sprites
      const scenery = sceneryImgsRef.current;
      const sortedTrees = [...s.trees].sort((a, b) => a.t - b.t);
      for (const tr of sortedTrees) {
        const img = scenery[tr.kind % Math.max(1, scenery.length)];
        if (!img?.complete || !img.naturalWidth) continue;
        const z = tr.t * tr.t;
        const x = laneX(tr.side * (1.85 + tr.jitter), z);
        const y = depthY(z);
        const h = 12 + z * 130;
        const w = h * (img.naturalWidth / img.naturalHeight);
        ctx.drawImage(img, x - w / 2, y - h, w, h);
      }

      // Werewolves — farthest first so nearer ones draw on top
      const wolfImg = wolfImgRef.current;
      const sortedWolves = [...s.wolves].sort((a, b) => a.t - b.t);
      for (const w of sortedWolves) {
        const z = Math.min(1, w.t) * Math.min(1, w.t);
        const x = laneX(w.lane, z);
        const y = depthY(z) + Math.sin(w.t * 22) * 2 * z;
        const size = 16 + z * 150;
        const alpha = w.hit ? Math.max(0, 1 - w.hitT / 0.35) : 1;
        if (wolfImg?.complete) {
          ctx.save();
          ctx.globalAlpha = alpha;
          if (w.hit) ctx.translate(0, w.hitT * 40);
          ctx.drawImage(wolfImg, x - size / 2, y - size, size, size);
          ctx.restore();
        }
      }

      // Impact fx
      for (const f of s.fx) {
        const p = f.t / 0.4;
        ctx.save();
        ctx.globalAlpha = 1 - p;
        ctx.font = `${18 + p * 20}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('💥', f.x, f.y - p * 18);
        ctx.restore();
      }

      // Car (all 3 pets, always)
      const car = carImgRef.current;
      if (car?.complete && car.naturalWidth) {
        const carW = W * 0.5;
        const carH = carW * (car.naturalHeight / car.naturalWidth);
        ctx.drawImage(car, s.carX - carW / 2, H - carH * 0.94, carW, carH);
      }

      ctx.restore();

      if (scoreElRef.current) scoreElRef.current.textContent = String(s.score);

      if (s.timeLeft > 0) { raf = requestAnimationFrame(tick); return; }

      // Round over
      const score = s.score;
      setFinalScore(score);
      setBest(prev => {
        const nb = Math.max(prev, score);
        localStorage.setItem(STORAGE_KEYS.WEREWOLF_BEST, String(nb));
        return nb;
      });
      if (score > 0) playTaskComplete();
      setPhase('over');
    };
    raf = requestAnimationFrame(tick);

    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft') { e.preventDefault(); setLane(-1); }
      if (e.code === 'ArrowRight') { e.preventDefault(); setLane(1); }
    };
    window.addEventListener('keydown', onKey);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey); };
  }, [phase, onEarnPoints, setLane]);

  const mono = { fontFamily: 'monospace' as const };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'var(--tk-bg)', display: 'flex', flexDirection: 'column', color: 'var(--tk-text)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
        <span style={{ ...mono, fontWeight: 800, fontSize: '0.95rem', letterSpacing: 1 }}>
          🐺 {isPt ? 'ATROPELA LOBISOMEM' : 'WEREWOLF RUN'}
        </span>
        <button onClick={onExit} style={{ ...mono, background: 'var(--tk-soft)', border: '1px solid var(--tk-border)', color: 'var(--tk-text)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}>
          {isPt ? 'Sair' : 'Exit'}
        </button>
      </div>

      <div style={{ ...mono, display: 'flex', justifyContent: 'space-between', padding: '0 20px 6px', fontSize: '0.8rem', color: 'var(--tk-muted)' }}>
        <span>{isPt ? 'Recorde' : 'Best'}: {best}</span>
        <span>{isPt ? 'Atropelados' : 'Squashed'}: <span ref={scoreElRef}>0</span></span>
        <span>{isPt ? 'Tempo' : 'Time'}: <span ref={timeElRef}>{ROUND_SECONDS}</span>s</span>
      </div>

      <div style={{ margin: '0 16px', borderRadius: 12, border: '1px solid var(--tk-border)', overflow: 'hidden', position: 'relative' }}>
        <canvas
          ref={canvasRef}
          style={{ display: 'block', width: '100%', height: 260, touchAction: 'manipulation' }}
        />
        {phase !== 'playing' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'rgba(11,15,23,0.82)' }}>
            {phase === 'over' && (
              <>
                <p style={{ ...mono, fontWeight: 800, fontSize: '1.05rem', color: '#fff' }}>🐺 {isPt ? 'Alcateia dispersada!' : 'Pack scattered!'}</p>
                <p style={{ ...mono, fontSize: '0.85rem', color: '#e2e8f0' }}>
                  {isPt ? 'Lobisomens atropelados' : 'Werewolves squashed'}: {finalScore} · +{finalScore * HIT_POINTS} Bits
                </p>
              </>
            )}
            {phase === 'ready' && (
              <p style={{ ...mono, fontSize: '0.8rem', color: '#e2e8f0', padding: '0 20px', textAlign: 'center' }}>
                {isPt
                  ? 'Os 3 pets saem pra um passeio noturno! Mude de faixa pra atropelar os lobisomens perto do carro. 40 segundos, sem custo de coração.'
                  : 'All 3 pets go for a night drive! Switch lanes to run over the werewolves near the car. 40 seconds, no heart cost.'}
              </p>
            )}
            <button onClick={start}
              style={{ ...mono, padding: '12px 28px', borderRadius: 8, border: 'none', background: 'var(--tk-btn-bg, var(--tk-accent))', color: '#fff', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer' }}>
              {phase === 'over' ? (isPt ? 'JOGAR DE NOVO' : 'PLAY AGAIN') : (isPt ? 'COMEÇAR' : 'START')}
            </button>
          </div>
        )}
      </div>

      {/* Lane buttons OUTSIDE the game box — thumbs never cover the action */}
      <div style={{ padding: 16, display: 'flex', gap: 12 }}>
        <button
          onPointerDown={() => setLane(-1)}
          disabled={phase !== 'playing'}
          style={{
            ...mono, flex: 1, padding: '20px 0', borderRadius: 12, border: 'none',
            background: phase === 'playing' ? 'var(--tk-btn-bg, var(--tk-accent))' : 'var(--tk-soft)',
            color: phase === 'playing' ? '#fff' : 'var(--tk-muted)',
            fontWeight: 800, fontSize: '1.3rem',
            cursor: phase === 'playing' ? 'pointer' : 'default',
            touchAction: 'manipulation', userSelect: 'none',
          }}
        >
          ◀
        </button>
        <button
          onPointerDown={() => setLane(1)}
          disabled={phase !== 'playing'}
          style={{
            ...mono, flex: 1, padding: '20px 0', borderRadius: 12, border: 'none',
            background: phase === 'playing' ? 'var(--tk-btn-bg, var(--tk-accent))' : 'var(--tk-soft)',
            color: phase === 'playing' ? '#fff' : 'var(--tk-muted)',
            fontWeight: 800, fontSize: '1.3rem',
            cursor: phase === 'playing' ? 'pointer' : 'default',
            touchAction: 'manipulation', userSelect: 'none',
          }}
        >
          ▶
        </button>
      </div>
    </div>
  );
}
