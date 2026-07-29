import { useState, useRef, useEffect, useCallback } from 'react';
import { getSpriteForStage } from '../utils/sprites';
import { playBubblePop, playTaskComplete } from '../utils/sounds';
import { STORAGE_KEYS } from '../utils/storageKeys';
import type { Language } from '../utils/i18n';

/**
 * Bubble Pop — the pet blows bubbles from the corner of the box; tap them
 * before they float off the top. Chill, no-penalty minigame: a missed
 * bubble just disappears, no cost. Scoring: 🪙 +1 Bit per bubble popped,
 * over a 30s round.
 */
const ROUND_SECONDS = 30;
const POP_POINTS = 1;
const MIN_SPAWN_MS = 420;
const MAX_SPAWN_MS = 900;

interface Bubble {
  id: number;
  leftPct: number;
  size: number;
  duration: number;
  variant: 'a' | 'b';
}

interface PopFx {
  id: number;
  left: number;
  top: number;
  size: number;
}

let nextBubbleId = 0;
let nextFxId = 0;

export function BubbleGame({ evolutionStage, eggType, language, onEarnPoints, onExit }: {
  evolutionStage: string;
  eggType?: string;
  language: Language;
  onEarnPoints: (pts: number) => void;
  onExit: () => void;
}) {
  const isPt = language === 'pt-BR';
  const mono = { fontFamily: 'monospace' as const };
  const [phase, setPhase] = useState<'ready' | 'playing' | 'over'>('ready');
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [popFx, setPopFx] = useState<PopFx[]>([]);
  const [popped, setPopped] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [best, setBest] = useState(() => Number(localStorage.getItem(STORAGE_KEYS.BUBBLE_BEST)) || 0);

  const boxRef = useRef<HTMLDivElement>(null);
  const poppedRef = useRef(0);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const spawnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = () => {
    if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  };
  useEffect(() => clearTimers, []);

  const scheduleSpawn = useCallback(() => {
    const delay = MIN_SPAWN_MS + Math.random() * (MAX_SPAWN_MS - MIN_SPAWN_MS);
    spawnTimerRef.current = setTimeout(() => {
      setBubbles(prev => [...prev, {
        id: nextBubbleId++,
        leftPct: 6 + Math.random() * 24,
        size: 30 + Math.random() * 26,
        duration: 3.4 + Math.random() * 1.8,
        variant: Math.random() < 0.5 ? 'a' : 'b',
      }]);
      scheduleSpawn();
    }, delay);
  }, []);

  const start = () => {
    setBubbles([]);
    setPopFx([]);
    setPopped(0);
    poppedRef.current = 0;
    setTimeLeft(ROUND_SECONDS);
    setPhase('playing');
  };

  useEffect(() => {
    if (phase !== 'playing') return;
    scheduleSpawn();
    countdownRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearTimers();
          setPhase('over');
          setBubbles([]);
          setBest(prevBest => {
            const nb = Math.max(prevBest, poppedRef.current);
            localStorage.setItem(STORAGE_KEYS.BUBBLE_BEST, String(nb));
            return nb;
          });
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return clearTimers;
  }, [phase, scheduleSpawn]);

  const missBubble = (id: number) => {
    setBubbles(prev => prev.filter(b => b.id !== id));
  };

  const pop = (b: Bubble, e: React.PointerEvent<HTMLButtonElement>) => {
    if (phaseRef.current !== 'playing') return;
    setBubbles(prev => prev.filter(x => x.id !== b.id));
    const next = poppedRef.current + 1;
    poppedRef.current = next;
    setPopped(next);
    onEarnPoints(POP_POINTS);
    playBubblePop();
    try { navigator.vibrate?.(12); } catch { /* noop */ }

    const rect = e.currentTarget.getBoundingClientRect();
    const boxRect = boxRef.current?.getBoundingClientRect();
    const fx: PopFx = {
      id: nextFxId++,
      left: boxRect ? rect.left - boxRect.left + rect.width / 2 : rect.width / 2,
      top: boxRect ? rect.top - boxRect.top + rect.height / 2 : rect.height / 2,
      size: b.size,
    };
    setPopFx(prev => [...prev, fx]);
    setTimeout(() => setPopFx(prev => prev.filter(x => x.id !== fx.id)), 350);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'var(--tk-bg)', display: 'flex', flexDirection: 'column', color: 'var(--tk-text)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
        <span style={{ ...mono, fontWeight: 800, fontSize: '0.95rem', letterSpacing: 1 }}>
          🫧 {isPt ? 'ESTOURA BOLHAS' : 'BUBBLE POP'}
        </span>
        <button onClick={onExit} style={{ ...mono, background: 'var(--tk-soft)', border: '1px solid var(--tk-border)', color: 'var(--tk-text)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}>
          {isPt ? 'Sair' : 'Exit'}
        </button>
      </div>

      <div style={{ ...mono, display: 'flex', justifyContent: 'space-between', padding: '0 20px 6px', fontSize: '0.8rem', color: 'var(--tk-muted)' }}>
        <span>{isPt ? 'Recorde' : 'Best'}: {best}</span>
        <span>{isPt ? 'Bolhas' : 'Popped'}: {popped}</span>
        <span>{isPt ? 'Tempo' : 'Time'}: {timeLeft}s</span>
      </div>

      <div
        ref={boxRef}
        style={{
          flex: 1, margin: '0 16px', borderRadius: 12, border: '1px solid var(--tk-border)',
          position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(180deg, var(--tk-soft) 0%, var(--tk-card) 100%)',
        }}
      >
        {/* Pet blowing bubbles, bottom-left corner */}
        <img
          src={getSpriteForStage(evolutionStage, eggType)}
          alt="pet"
          style={{
            position: 'absolute', left: 6, bottom: 6, width: 64, height: 64,
            objectFit: 'contain', imageRendering: 'pixelated',
            animation: phase === 'playing' ? 'dungeon-idle 1.4s ease-in-out infinite' : undefined,
          }}
        />

        {bubbles.map(b => (
          <button
            key={b.id}
            onPointerDown={e => pop(b, e)}
            onAnimationEnd={() => missBubble(b.id)}
            aria-label={isPt ? 'Bolha' : 'Bubble'}
            style={{
              position: 'absolute',
              left: `${b.leftPct}%`,
              bottom: '-10%',
              width: b.size, height: b.size,
              borderRadius: '50%',
              border: '1.5px solid rgba(255,255,255,0.8)',
              background: 'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.95), rgba(190,230,255,0.55) 40%, rgba(140,200,255,0.4) 70%, rgba(140,200,255,0.22) 100%)',
              boxShadow: '0 0 8px rgba(150,210,255,0.5), inset 0 0 10px rgba(255,255,255,0.3), 0 1px 3px rgba(0,0,0,0.2)',
              cursor: 'pointer',
              padding: 0,
              animation: `bubble-rise-${b.variant} ${b.duration}s linear forwards`,
            }}
          />
        ))}

        {popFx.map(fx => (
          <span
            key={fx.id}
            style={{
              position: 'absolute', left: fx.left, top: fx.top,
              fontSize: fx.size * 0.7, lineHeight: 1, pointerEvents: 'none',
              animation: 'bubble-pop-fx 0.35s ease-out forwards',
            }}
          >
            ✨
          </span>
        ))}

        {phase !== 'playing' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'rgba(11,15,23,0.5)' }}>
            {phase === 'over' && (
              <>
                <p style={{ ...mono, fontWeight: 800, fontSize: '1.05rem', color: '#fff' }}>🎉 {isPt ? 'Tempo esgotado!' : 'Time\'s up!'}</p>
                <p style={{ ...mono, fontSize: '0.85rem', color: '#e2e8f0' }}>
                  {isPt ? 'Bolhas estouradas' : 'Bubbles popped'}: {popped} · +{popped * POP_POINTS} Bits
                </p>
              </>
            )}
            {phase === 'ready' && (
              <p style={{ ...mono, fontSize: '0.8rem', color: '#e2e8f0', padding: '0 20px', textAlign: 'center' }}>
                {isPt
                  ? 'Toque nas bolhas antes que elas escapem! 30 segundos, sem custo de coração. 1 bolha = 1 Bit'
                  : 'Tap the bubbles before they float away! 30 seconds, no heart cost. 1 bubble = 1 Bit'}
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
        {isPt ? 'Toque nas bolhas pra estourar' : 'Tap the bubbles to pop them'}
      </div>
    </div>
  );
}
