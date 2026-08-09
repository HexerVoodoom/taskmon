import { useState, useEffect, useRef, useCallback } from 'react';
import { getSpriteForStage, getExpressionSprite } from '../utils/sprites';
import { playDegenerate, playTaskComplete } from '../utils/sounds';
import { STORAGE_KEYS } from '../utils/storageKeys';
import type { Language } from '../utils/i18n';

/**
 * Dino Runner — endless runner starring the pet.
 * Obstacles are the dungeon's dedicated monsters and get scarier as
 * difficulty ramps: Slime → Mummy → Golem → Wraith (tier by elapsed time;
 * speed and spawn rate also scale continuously). Jump via the big button
 * BELOW the game box (thumb never covers the action), the box itself, or
 * SPACE. Scoring: 🪙 Bits earned = floor(distance score / 50) per run.
 */

// Obstacle tiers: unlocked as the run progresses (start time in seconds).
const OBSTACLE_TIERS = [
  { stage: 'enemy-slime',  from: 0,  size: 38 },
  { stage: 'enemy-mummy',  from: 20, size: 44 },
  { stage: 'enemy-golem',  from: 45, size: 50 },
  { stage: 'enemy-wraith', from: 75, size: 56 },
];

export function DinoGame({ evolutionStage, eggType, language, onEarnPoints, onScore, onExit }: {
  evolutionStage: string;
  eggType?: string;
  language: Language;
  onEarnPoints: (pts: number) => void;
  /** Adds a rookie evolution item to the Items folder; returns its display name. */
  /** Mission counter: reports the final score of each run. */
  onScore: (score: number) => void;
  onExit: () => void;
}) {
  const isPt = language === 'pt-BR';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scoreElRef = useRef<HTMLSpanElement>(null);
  const petImgRef = useRef<HTMLImageElement | null>(null);
  const petImg2Ref = useRef<HTMLImageElement | null>(null);
  const tierImgsRef = useRef<HTMLImageElement[]>([]);
  const [phase, setPhase] = useState<'ready' | 'playing' | 'over'>('ready');
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const [finalScore, setFinalScore] = useState(0);
  const [earned, setEarned] = useState(0);
  const [best, setBest] = useState(() => Number(localStorage.getItem(STORAGE_KEYS.DINO_BEST)) || 0);
  const mono = {}; // theme font applies (was forced monospace)

  // Physics/game state lives in a ref — the loop never re-renders React.
  const g = useRef({ h: 0, vy: 0, obstacles: [] as { x: number; size: number; tier: number }[], speed: 0, t: 0, spawnIn: 0, score: 0 });

  useEffect(() => {
    const pet = new Image();
    pet.src = getExpressionSprite(evolutionStage, 'walk');
    petImgRef.current = pet;
    const pet2 = new Image();
    pet2.src = getExpressionSprite(evolutionStage, 'walk2');
    petImg2Ref.current = pet2;
    tierImgsRef.current = OBSTACLE_TIERS.map(t => {
      const img = new Image();
      img.src = getSpriteForStage(t.stage);
      return img;
    });
  }, [evolutionStage]);

  const jump = useCallback(() => {
    if (phaseRef.current !== 'playing') return;
    const s = g.current;
    if (s.h <= 0) {
      s.vy = 660;
      try { navigator.vibrate?.(8); } catch { /* noop */ }
    }
  }, []);

  const start = () => {
    g.current = { h: 0, vy: 0, obstacles: [], speed: 260, t: 0, spawnIn: 1.1, score: 0 };
    setEarned(0);
    setPhase('playing');
  };

  useEffect(() => {
    if (phase !== 'playing') return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    canvas.width = canvas.clientWidth;
    canvas.height = 240;
    ctx.imageSmoothingEnabled = false;
    const GROUND = canvas.height - 28;
    const DINO_X = 26, DINO_S = 46;
    const s = g.current;
    let raf = 0;
    let last = performance.now();
    let dead = false;

    // Draw an image horizontally mirrored (obstacle art faces right; mirror
    // so they face the player, i.e. left, since they approach from the right)
    const drawFlipped = (img: HTMLImageElement, x: number, y: number, w: number, h: number) => {
      ctx.save();
      ctx.translate(x + w, y);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0, w, h);
      ctx.restore();
    };

    const currentTier = () => {
      let tier = 0;
      for (let i = 0; i < OBSTACLE_TIERS.length; i++) if (s.t >= OBSTACLE_TIERS[i].from) tier = i;
      return tier;
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      s.t += dt;
      s.speed = Math.min(620, 260 + s.t * 9);
      s.score += dt * 10;

      // Jump physics
      if (s.h > 0 || s.vy > 0) {
        s.vy -= 1900 * dt;
        s.h = Math.max(0, s.h + s.vy * dt);
        if (s.h === 0) s.vy = 0;
      }

      // Obstacles — tier can also roll one level below for variety
      s.spawnIn -= dt;
      if (s.spawnIn <= 0) {
        const maxTier = currentTier();
        const tier = maxTier > 0 && Math.random() < 0.35 ? maxTier - 1 : maxTier;
        s.obstacles.push({ x: canvas.width + 20, size: OBSTACLE_TIERS[tier].size, tier });
        s.spawnIn = (0.95 + Math.random() * 0.85) * (340 / s.speed) + 0.34;
      }
      for (const o of s.obstacles) o.x -= s.speed * dt;
      s.obstacles = s.obstacles.filter(o => o.x + o.size > -10);

      // Collision (AABB with generous padding — sprites have transparent margins)
      const dTop = GROUND - DINO_S - s.h + 10;
      const dBot = GROUND - s.h - 2;
      const dL = DINO_X + 8, dR = DINO_X + DINO_S - 10;
      for (const o of s.obstacles) {
        const oL = o.x + 7, oR = o.x + o.size - 7, oT = GROUND - o.size + 9;
        if (dR > oL && dL < oR && dBot > oT && dTop < GROUND) { dead = true; break; }
      }

      // Draw
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#3a4b68';
      ctx.beginPath(); ctx.moveTo(0, GROUND + 1); ctx.lineTo(canvas.width, GROUND + 1); ctx.stroke();
      for (const o of s.obstacles) {
        const img = tierImgsRef.current[o.tier];
        if (img?.complete) drawFlipped(img, o.x, GROUND - o.size, o.size, o.size);
      }
      // Alternate between the two walk-cycle frames while grounded (frozen
      // mid-air, like a classic runner). The walk-pose art faces left; flip
      // it so the pet faces right (the direction it's running) — verified
      // directly on the sprite files, not just from a code comment.
      const useFrame2 = s.h === 0 && Math.floor(s.t * 8) % 2 === 1;
      const pet = (useFrame2 ? petImg2Ref.current : petImgRef.current) ?? petImgRef.current;
      if (pet?.complete) drawFlipped(pet, DINO_X, GROUND - DINO_S - s.h, DINO_S, DINO_S);
      if (scoreElRef.current) scoreElRef.current.textContent = String(Math.floor(s.score));

      if (!dead) { raf = requestAnimationFrame(tick); return; }

      // Game over
      const score = Math.floor(s.score);
      const pts = Math.floor(score / 50);
      setFinalScore(score);
      setEarned(pts);
      if (pts > 0) { onEarnPoints(pts); playTaskComplete(); } else { playDegenerate(); }
      onScore(score);
      setBest(prev => {
        const nb = Math.max(prev, score);
        localStorage.setItem(STORAGE_KEYS.DINO_BEST, String(nb));
        return nb;
      });
      try { navigator.vibrate?.(60); } catch { /* noop */ }
      setPhase('over');
    };
    raf = requestAnimationFrame(tick);

    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); jump(); }
    };
    window.addEventListener('keydown', onKey);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey); };
  }, [phase, jump, onEarnPoints, onScore]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'var(--tk-bg)', display: 'flex', flexDirection: 'column', color: 'var(--tk-text)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
        <span style={{ ...mono, fontWeight: 800, fontSize: '0.95rem', letterSpacing: 1 }}>
          🦖 {isPt ? 'CORRIDA DO DINO' : 'DINO RUNNER'}
        </span>
        <button onClick={onExit} style={{ ...mono, background: 'var(--tk-soft)', border: '1px solid var(--tk-border)', color: 'var(--tk-text)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}>
          {isPt ? 'Sair' : 'Exit'}
        </button>
      </div>

      <div style={{ ...mono, display: 'flex', justifyContent: 'space-between', padding: '0 20px 6px', fontSize: '0.8rem', color: 'var(--tk-muted)' }}>
        <span>{isPt ? 'Recorde' : 'Best'}: {best}</span>
        <span>Score: <span ref={scoreElRef}>0</span></span>
      </div>

      <div style={{ margin: '0 16px', borderRadius: 12, border: '1px solid var(--tk-border)', overflow: 'hidden', position: 'relative' }}>
        <canvas
          ref={canvasRef}
          onPointerDown={jump}
          style={{ display: 'block', width: '100%', height: 240, touchAction: 'manipulation' }}
        />
        {phase !== 'playing' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'rgba(11,15,23,0.82)' }}>
            {phase === 'over' && (
              <>
                <p style={{ ...mono, fontWeight: 800, fontSize: '1.05rem' }}>💥 {isPt ? 'Fim de jogo!' : 'Game over!'}</p>
                <p style={{ ...mono, fontSize: '0.85rem', color: 'var(--tk-muted)' }}>
                  Score: {finalScore} · +{earned} Bits
                </p>
              </>
            )}
            {phase === 'ready' && (
              <p style={{ ...mono, fontSize: '0.8rem', color: 'var(--tk-muted)', padding: '0 20px', textAlign: 'center' }}>
                {isPt
                  ? 'Pule os monstros! Eles ficam mais fortes com o tempo. 100 de score = 1 Bit'
                  : 'Jump the monsters! They get scarier over time. 100 score = 1 Bit'}
              </p>
            )}
            <button onClick={start}
              style={{ ...mono, padding: '12px 28px', borderRadius: 8, border: 'none', background: 'var(--tk-btn-bg, var(--tk-accent))', color: '#fff', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer' }}>
              {phase === 'over' ? (isPt ? 'JOGAR DE NOVO' : 'PLAY AGAIN') : (isPt ? 'COMEÇAR' : 'START')}
            </button>
          </div>
        )}
      </div>

      {/* Big jump button OUTSIDE the game box — thumb never covers the action */}
      <div style={{ padding: 16 }}>
        <button
          onPointerDown={jump}
          disabled={phase !== 'playing'}
          style={{
            ...mono, width: '100%', padding: '22px 0', borderRadius: 12, border: 'none',
            background: phase === 'playing' ? 'var(--tk-btn-bg, var(--tk-accent))' : 'var(--tk-soft)',
            color: phase === 'playing' ? '#fff' : 'var(--tk-muted)',
            fontWeight: 800, fontSize: '1.1rem', letterSpacing: 2,
            cursor: phase === 'playing' ? 'pointer' : 'default',
            touchAction: 'manipulation', userSelect: 'none',
          }}
        >
          ⬆ {isPt ? 'PULAR' : 'JUMP'}
        </button>
      </div>
    </div>
  );
}
