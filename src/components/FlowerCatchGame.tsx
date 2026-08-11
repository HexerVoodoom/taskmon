import { useState, useRef, useEffect, useCallback } from 'react';
import { getSpriteForStage } from '../utils/sprites';
import { playBubblePop, playTaskComplete } from '../utils/sounds';
import { startFlowerMusic, stopMusic } from '../utils/music';
import { STORAGE_KEYS } from '../utils/storageKeys';
import type { Language } from '../utils/i18n';

/**
 * Flower Catch — flowers fall from the sky; drag the pet left/right along
 * the ground to catch them right before they land, filling the basket.
 * Chill, no-penalty minigame (like Bubble Pop): a missed flower just wilts
 * away, no cost. Scoring: 🪙 +1 Bit per flower caught, over a timed round.
 */
const ROUND_SECONDS = 40;
const CATCH_POINTS = 1;
const MIN_SPAWN_MS = 500;
const MAX_SPAWN_MS = 1000;
const MIN_FALL_S = 3.4;
const MAX_FALL_S = 5.4;
const TICK_MS = 50;
const CATCH_Y_MIN = 70; // % of box height — flower must be near the ground
const CATCH_Y_MAX = 96;
const CATCH_RADIUS_PCT = 11; // how close petX must be to the flower's x
const PET_MIN_X = 8;
const PET_MAX_X = 92;
const BASKET_CAPACITY = 12;
const FLOWER_EMOJIS = ['🌸', '🌷', '🌺', '🌼', '🌻'];

interface Flower {
  id: number;
  x: number;
  y: number;
  speedPerTick: number;
  emoji: string;
}

interface CatchFx {
  id: number;
  x: number;
  y: number;
}

let nextFlowerId = 0;
let nextFxId = 0;

export function FlowerCatchGame({ evolutionStage, eggType, language, onEarnPoints, onExit }: {
  evolutionStage: string;
  eggType?: string;
  language: Language;
  onEarnPoints: (pts: number) => void;
  onExit: () => void;
}) {
  const isPt = language === 'pt-BR';
  const mono = { fontFamily: 'monospace' as const };
  const [phase, setPhase] = useState<'ready' | 'playing' | 'over'>('ready');
  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [catchFx, setCatchFx] = useState<CatchFx[]>([]);
  const [caught, setCaught] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [petX, setPetX] = useState(50);
  const [facing, setFacing] = useState<'left' | 'right'>('right');
  const [best, setBest] = useState(() => Number(localStorage.getItem(STORAGE_KEYS.FLOWER_BEST)) || 0);

  const boxRef = useRef<HTMLDivElement>(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const petXRef = useRef(petX);
  petXRef.current = petX;
  const caughtRef = useRef(0);
  const draggingRef = useRef(false);

  const spawnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = () => {
    if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (tickRef.current) clearInterval(tickRef.current);
  };
  useEffect(() => clearTimers, []);

  const scheduleSpawn = useCallback(() => {
    const delay = MIN_SPAWN_MS + Math.random() * (MAX_SPAWN_MS - MIN_SPAWN_MS);
    spawnTimerRef.current = setTimeout(() => {
      const fallSeconds = MIN_FALL_S + Math.random() * (MAX_FALL_S - MIN_FALL_S);
      const ticks = (fallSeconds * 1000) / TICK_MS;
      setFlowers(prev => [...prev, {
        id: nextFlowerId++,
        x: PET_MIN_X + Math.random() * (PET_MAX_X - PET_MIN_X),
        y: -4,
        speedPerTick: 100 / ticks,
        emoji: FLOWER_EMOJIS[Math.floor(Math.random() * FLOWER_EMOJIS.length)],
      }]);
      scheduleSpawn();
    }, delay);
  }, []);

  const start = () => {
    setFlowers([]);
    setCatchFx([]);
    setCaught(0);
    caughtRef.current = 0;
    setTimeLeft(ROUND_SECONDS);
    setPetX(50);
    setPhase('playing');
  };

  const catchFlower = (f: Flower) => {
    const next = caughtRef.current + 1;
    caughtRef.current = next;
    setCaught(next);
    onEarnPoints(CATCH_POINTS);
    playBubblePop();
    try { navigator.vibrate?.(15); } catch { /* noop */ }
    const fx: CatchFx = { id: nextFxId++, x: f.x, y: f.y };
    setCatchFx(prev => [...prev, fx]);
    setTimeout(() => setCatchFx(prev => prev.filter(c => c.id !== fx.id)), 500);
  };

  // Trilha sonora só toca durante a rodada — para sozinha ao pausar/sair.
  useEffect(() => {
    if (phase !== 'playing') return;
    startFlowerMusic();
    return stopMusic;
  }, [phase]);

  // Game loop: falls every flower, checks the catch zone, drops missed ones.
  useEffect(() => {
    if (phase !== 'playing') return;
    scheduleSpawn();
    tickRef.current = setInterval(() => {
      setFlowers(prev => {
        const kept: Flower[] = [];
        for (const f of prev) {
          const ny = f.y + f.speedPerTick;
          if (ny >= CATCH_Y_MIN && ny <= CATCH_Y_MAX && Math.abs(f.x - petXRef.current) <= CATCH_RADIUS_PCT) {
            catchFlower({ ...f, y: ny });
            continue; // caught — removed from play
          }
          if (ny > 100) continue; // missed — wilted off-screen, no penalty
          kept.push({ ...f, y: ny });
        }
        return kept;
      });
    }, TICK_MS);

    countdownRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearTimers();
          setPhase('over');
          setFlowers([]);
          setBest(prevBest => {
            const nb = Math.max(prevBest, caughtRef.current);
            localStorage.setItem(STORAGE_KEYS.FLOWER_BEST, String(nb));
            return nb;
          });
          if (caughtRef.current > 0) playTaskComplete();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, scheduleSpawn]);

  // Drag anywhere over the box to move the pet along the ground to that x.
  const moveTo = (clientX: number) => {
    const rect = boxRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const pct = ((clientX - rect.left) / rect.width) * 100;
    const clamped = Math.max(PET_MIN_X, Math.min(PET_MAX_X, pct));
    setFacing(clamped > petXRef.current ? 'right' : clamped < petXRef.current ? 'left' : facing);
    setPetX(clamped);
  };
  const onPointerDown = (e: React.PointerEvent) => {
    if (phaseRef.current !== 'playing') return;
    draggingRef.current = true;
    try { (e.currentTarget as Element).setPointerCapture(e.pointerId); } catch { /* noop */ }
    moveTo(e.clientX);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    moveTo(e.clientX);
  };
  const endDrag = () => { draggingRef.current = false; };

  const basketFill = Math.min(1, caught / BASKET_CAPACITY);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'var(--tk-bg)', display: 'flex', flexDirection: 'column', color: 'var(--tk-text)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
        <span style={{ ...mono, fontWeight: 800, fontSize: '0.95rem', letterSpacing: 1 }}>
          🌷 {isPt ? 'CHUVA DE FLORES' : 'FLOWER CATCH'}
        </span>
        <button onClick={onExit} style={{ ...mono, background: 'var(--tk-soft)', border: '1px solid var(--tk-border)', color: 'var(--tk-text)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}>
          {isPt ? 'Sair' : 'Exit'}
        </button>
      </div>

      <div style={{ ...mono, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px 6px', fontSize: '0.8rem', color: 'var(--tk-muted)' }}>
        <span>{isPt ? 'Recorde' : 'Best'}: {best}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          🧺
          <span style={{ position: 'relative', width: 54, height: 8, borderRadius: 4, background: 'var(--tk-border)', overflow: 'hidden', display: 'inline-block' }}>
            <span style={{ position: 'absolute', inset: 0, width: `${basketFill * 100}%`, background: 'linear-gradient(90deg, #f472b6, #fb923c)', borderRadius: 4 }} />
          </span>
          {caught}
        </span>
        <span>{isPt ? 'Tempo' : 'Time'}: {timeLeft}s</span>
      </div>

      <div
        ref={boxRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        style={{
          flex: 1, margin: '0 16px', borderRadius: 12, border: '1px solid var(--tk-border)',
          position: 'relative', overflow: 'hidden', touchAction: 'none', cursor: phase === 'playing' ? 'grab' : 'default',
          background: 'linear-gradient(180deg, #7dd3fc 0%, #bae6fd 55%, #d9f99d 88%, #86efac 100%)',
        }}
      >
        {/* Sun glow, purely decorative */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(90px 90px at 85% 10%, rgba(255,247,200,0.85), transparent 60%)',
        }} />
        {/* Grass strip along the ground */}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '14%', background: 'linear-gradient(180deg, #4ade80, #16a34a)', pointerEvents: 'none' }} />

        {flowers.map(f => (
          <span
            key={f.id}
            style={{
              position: 'absolute',
              left: `${f.x}%`,
              top: `${f.y}%`,
              transform: 'translate(-50%, -50%)',
              fontSize: '1.6rem',
              lineHeight: 1,
              pointerEvents: 'none',
              filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.2))',
            }}
          >
            {f.emoji}
          </span>
        ))}

        {catchFx.map(fx => (
          <span
            key={fx.id}
            style={{
              position: 'absolute', left: `${fx.x}%`, top: `${fx.y}%`, transform: 'translate(-50%, -50%)',
              fontSize: '0.85rem', fontWeight: 800, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.5)',
              pointerEvents: 'none', ...mono,
              animation: 'float-up 0.5s ease-out forwards',
            }}
          >
            +1
          </span>
        ))}

        {/* Pet — drag anywhere in the box to move it along the ground */}
        <img
          src={getSpriteForStage(evolutionStage, eggType)}
          alt="pet"
          draggable={false}
          style={{
            position: 'absolute', left: `${petX}%`, bottom: '6%', width: 64, height: 64,
            transform: `translateX(-50%) scaleX(${facing === 'left' ? -1 : 1})`,
            objectFit: 'contain', imageRendering: 'pixelated', pointerEvents: 'none',
            transition: 'left 0.05s linear',
          }}
        />

        {phase !== 'playing' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'rgba(11,15,23,0.5)' }}>
            {phase === 'over' && (
              <>
                <p style={{ ...mono, fontWeight: 800, fontSize: '1.05rem', color: '#fff' }}>
                  🧺 {isPt ? 'Cesta pronta!' : 'Basket ready!'}
                </p>
                <p style={{ ...mono, fontSize: '0.85rem', color: '#e2e8f0' }}>
                  {isPt ? 'Flores colhidas' : 'Flowers caught'}: {caught} · +{caught * CATCH_POINTS} Bits
                </p>
              </>
            )}
            {phase === 'ready' && (
              <p style={{ ...mono, fontSize: '0.8rem', color: '#e2e8f0', padding: '0 20px', textAlign: 'center' }}>
                {isPt
                  ? 'Arraste o pet pros lados e pegue as flores perto do chão! 40 segundos, sem custo de coração. 1 flor = 1 Bit'
                  : 'Drag the pet side to side and catch the flowers near the ground! 40 seconds, no heart cost. 1 flower = 1 Bit'}
              </p>
            )}
            <button onClick={start}
              style={{ ...mono, padding: '12px 28px', borderRadius: 8, border: 'none', background: 'var(--tk-btn-bg, var(--tk-accent))', color: '#fff', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer' }}>
              {phase === 'over' ? (isPt ? 'JOGAR DE NOVO' : 'PLAY AGAIN') : (isPt ? 'COMEÇAR' : 'START')}
            </button>
          </div>
        )}
      </div>

      <div style={{ padding: 16, textAlign: 'center', ...mono, fontSize: '0.72rem', color: 'var(--tk-muted)' }}>
        {isPt ? 'Arraste pra mover o pet e pegar as flores' : 'Drag to move the pet and catch the flowers'}
      </div>
    </div>
  );
}
