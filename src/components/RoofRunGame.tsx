import { useState, useEffect, useRef, useCallback } from 'react';
import { getExpressionSprite, LEFT_FACING_STAGES } from '../utils/sprites';
import { playDegenerate, playTaskComplete } from '../utils/sounds';
import { STORAGE_KEYS } from '../utils/storageKeys';
import type { Language } from '../utils/i18n';
import skylineBg from '../assets/roofrun/skyline.png';
import rooftopImg from '../assets/roofrun/rooftop.png';

/**
 * Roof Run — endless runner starring the pet, Dino Runner's cousin: instead
 * of jumping OVER obstacles on flat ground, the pet jumps ACROSS gaps
 * between rooftops at varying heights. Missing a jump = falling through the
 * gap. Same jump physics/economy as Dino Runner: 🪙 Bits = floor(score/100).
 */

const GRAVITY = 1900;
const JUMP_VY = 660;
const PLAYER_X = 30, PLAYER_S = 44;
// House-wall body colors (picked once per platform) — fills the rest of the
// house down past the bottom of the canvas so platforms read as whole
// houses instead of roofs floating in mid-air.
const WALL_COLORS = ['#e6c78a', '#d9b26a', '#e0bd7e'];
const pickWallColor = () => WALL_COLORS[Math.floor(Math.random() * WALL_COLORS.length)];

interface Platform { x: number; width: number; topY: number; wallColor: string }

export function RoofRunGame({ evolutionStage, eggType, language, onEarnPoints, onExit }: {
  evolutionStage: string;
  eggType?: string;
  language: Language;
  onEarnPoints: (pts: number) => void;
  onExit: () => void;
}) {
  const isPt = language === 'pt-BR';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scoreElRef = useRef<HTMLSpanElement>(null);
  const petImgRef = useRef<HTMLImageElement | null>(null);
  const roofImgRef = useRef<HTMLImageElement | null>(null);
  const bgImgRef = useRef<HTMLImageElement | null>(null);
  const [phase, setPhase] = useState<'ready' | 'playing' | 'over'>('ready');
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const [finalScore, setFinalScore] = useState(0);
  const [earned, setEarned] = useState(0);
  const [best, setBest] = useState(() => Number(localStorage.getItem(STORAGE_KEYS.ROOF_BEST)) || 0);

  const petNeedsFlip = LEFT_FACING_STAGES.includes(evolutionStage.toLowerCase());

  // Physics/game state lives in a ref — the loop never re-renders React.
  const g = useRef({
    y: 0, vy: 0, grounded: true,
    platforms: [] as Platform[], speed: 0, t: 0, score: 0, bgX: 0,
  });

  useEffect(() => {
    const pet = new Image();
    pet.src = getExpressionSprite(evolutionStage, 'walk');
    petImgRef.current = pet;
    const roof = new Image();
    roof.src = rooftopImg;
    roofImgRef.current = roof;
    const bg = new Image();
    bg.src = skylineBg;
    bgImgRef.current = bg;
  }, [evolutionStage]);

  const jump = useCallback(() => {
    if (phaseRef.current !== 'playing') return;
    const s = g.current;
    if (s.grounded) {
      s.vy = -JUMP_VY;
      s.grounded = false;
      try { navigator.vibrate?.(8); } catch { /* noop */ }
    }
  }, []);

  const start = () => {
    const s = g.current;
    const baseY = 150;
    s.platforms = [
      { x: 0, width: 160, topY: baseY, wallColor: pickWallColor() },
      { x: 220, width: 120, topY: baseY - 10, wallColor: pickWallColor() },
    ];
    s.y = baseY;
    s.vy = 0;
    s.grounded = true;
    s.speed = 240;
    s.t = 0;
    s.score = 0;
    s.bgX = 0;
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
    const s = g.current;
    let raf = 0;
    let last = performance.now();
    let dead = false;

    const drawFlipped = (img: HTMLImageElement, x: number, y: number, w: number, h: number) => {
      ctx.save();
      ctx.translate(x + w, y);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0, w, h);
      ctx.restore();
    };

    // Roof thickness (visual band the sprite is drawn over) and how tall the
    // rooftop art is drawn relative to a platform's width. A house-wall body
    // fills the rest down past the bottom of the canvas so platforms read as
    // whole houses instead of roofs floating in mid-air.
    const ROOF_H = 60;

    const spawnPlatform = () => {
      const last = s.platforms[s.platforms.length - 1];
      const maxJump = s.speed * (2 * JUMP_VY / GRAVITY) * 0.72; // a bit under max range — keeps it fair
      const gap = 70 + Math.random() * Math.max(20, maxJump - 70);
      const width = 70 + Math.random() * 90;
      const heightDelta = (Math.random() - 0.5) * 70;
      const topY = Math.min(190, Math.max(70, last.topY + heightDelta));
      s.platforms.push({ x: last.x + last.width + gap, width, topY, wallColor: pickWallColor() });
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      s.t += dt;
      s.speed = Math.min(560, 240 + s.t * 8);
      s.score += dt * 10;
      s.bgX -= s.speed * 0.25 * dt;

      // Gravity
      s.vy += GRAVITY * dt;
      s.y += s.vy * dt;

      // Scroll platforms; spawn more as needed
      for (const p of s.platforms) p.x -= s.speed * dt;
      s.platforms = s.platforms.filter(p => p.x + p.width > -20);
      while (s.platforms.length < 2 || s.platforms[s.platforms.length - 1].x < canvas.width + 40) spawnPlatform();

      // Landing check: falling (vy>=0), feet crossing a platform's topY,
      // horizontally over that platform.
      s.grounded = false;
      for (const p of s.platforms) {
        const pL = p.x, pR = p.x + p.width;
        const overlaps = PLAYER_X + PLAYER_S - 8 > pL && PLAYER_X + 8 < pR;
        if (overlaps && s.vy >= 0 && s.y >= p.topY && s.y - s.vy * dt <= p.topY + 4) {
          s.y = p.topY;
          s.vy = 0;
          s.grounded = true;
          break;
        }
      }
      // Fallen through every gap → game over.
      if (s.y > canvas.height + 30) dead = true;

      // Draw
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const bg = bgImgRef.current;
      if (bg?.complete) {
        const bw = canvas.height * (bg.width / bg.height);
        let x = s.bgX % bw;
        if (x > 0) x -= bw;
        for (; x < canvas.width; x += bw) ctx.drawImage(bg, x, 0, bw, canvas.height);
      }
      const roof = roofImgRef.current;
      for (const p of s.platforms) {
        // House wall: fills from the underside of the roof down PAST the
        // canvas bottom, so each platform reads as a whole house standing
        // below (not a roof slice floating in mid-air).
        const wallTop = p.topY + ROOF_H * 0.38 - 6;
        ctx.fillStyle = p.wallColor;
        ctx.fillRect(p.x, wallTop, p.width, canvas.height - wallTop + 20);
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.fillRect(p.x, wallTop, 4, canvas.height - wallTop + 20);
        ctx.fillRect(p.x + p.width - 4, wallTop, 4, canvas.height - wallTop + 20);
        if (roof?.complete) ctx.drawImage(roof, p.x, p.topY - ROOF_H * 0.62, p.width, ROOF_H);
      }
      const pet = petImgRef.current;
      if (pet?.complete) {
        if (petNeedsFlip) drawFlipped(pet, PLAYER_X, s.y - PLAYER_S, PLAYER_S, PLAYER_S);
        else ctx.drawImage(pet, PLAYER_X, s.y - PLAYER_S, PLAYER_S, PLAYER_S);
      }
      if (scoreElRef.current) scoreElRef.current.textContent = String(Math.floor(s.score));

      if (!dead) { raf = requestAnimationFrame(tick); return; }

      // Game over
      const score = Math.floor(s.score);
      const pts = Math.floor(score / 100);
      setFinalScore(score);
      setEarned(pts);
      if (pts > 0) { onEarnPoints(pts); playTaskComplete(); } else { playDegenerate(); }
      setBest(prev => {
        const nb = Math.max(prev, score);
        localStorage.setItem(STORAGE_KEYS.ROOF_BEST, String(nb));
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
  }, [phase, jump, onEarnPoints, petNeedsFlip]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'var(--tk-bg)', display: 'flex', flexDirection: 'column', color: 'var(--tk-text)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
        <span style={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: 1 }}>
          🏠 {isPt ? 'CORRIDA NOS TELHADOS' : 'ROOF RUN'}
        </span>
        <button onClick={onExit} style={{ background: 'var(--tk-soft)', border: '1px solid var(--tk-border)', color: 'var(--tk-text)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}>
          {isPt ? 'Sair' : 'Exit'}
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 20px 6px', fontSize: '0.8rem', color: 'var(--tk-muted)' }}>
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
                <p style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff' }}>💥 {isPt ? 'Fim de jogo!' : 'Game over!'}</p>
                <p style={{ fontSize: '0.85rem', color: '#c8d0dd' }}>
                  Score: {finalScore} · +{earned} Bits
                </p>
              </>
            )}
            {phase === 'ready' && (
              <p style={{ fontSize: '0.8rem', color: '#c8d0dd', padding: '0 20px', textAlign: 'center' }}>
                {isPt
                  ? 'Pule de telhado em telhado! Perder o pulo é queda. 100 de score = 1 Bit'
                  : 'Jump from rooftop to rooftop! Miss a jump and you fall. 100 score = 1 Bit'}
              </p>
            )}
            <button onClick={start}
              style={{ padding: '12px 28px', borderRadius: 8, border: 'none', background: 'var(--tk-btn-bg, var(--tk-accent))', color: '#fff', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer' }}>
              {phase === 'over' ? (isPt ? 'JOGAR DE NOVO' : 'PLAY AGAIN') : (isPt ? 'COMEÇAR' : 'START')}
            </button>
          </div>
        )}
      </div>

      <div style={{ padding: 16 }}>
        <button
          onPointerDown={jump}
          disabled={phase !== 'playing'}
          style={{
            width: '100%', padding: '22px 0', borderRadius: 12, border: 'none',
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
