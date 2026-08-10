// Quarta "casinha": todos os 3 pets juntos, só pra visualização + carinho.
// Não é um perfil de verdade — lê os 3 saves (localStorage) sem trocar o
// perfil ativo nem tocar em comida/energia/banho. Único cuidado disponível é
// "carinho" (mesmo gesto de esfregar do CompanionHUD), que grava a cura
// direto no save do perfil dono daquele pet, respeitando o mesmo teto diário
// (STORAGE_KEYS.RUB_HEAL_DAY por perfil) usado na home normal.
import { useEffect, useRef, useState } from 'react';
import { getSpriteForStage, getExpressionSprite } from '../utils/sprites';
import { keyForProfile, PROFILE_COUNT } from '../utils/storageKeys';
import type { GameState } from '../contexts/GameStateContext';
import { PETS, type PetType } from '../types/progression';
import { PROFILE_COLORS } from './Header';
import type { Language } from '../utils/i18n';
import gothicScene from '../assets/scenes/gothic.png';
import greekScene from '../assets/scenes/greek.png';
import madmaxScene from '../assets/scenes/madmax.png';

const HUB_BACKGROUND_KEY = 'digiapp-hub-background';

type SceneId = 'gothic' | 'greek' | 'madmax';

const SCENES: { id: SceneId; namePt: string; nameEn: string; img: string; color: string }[] = [
  { id: 'gothic', namePt: 'Gótico', nameEn: 'Gothic', img: gothicScene, color: PROFILE_COLORS[0] },
  { id: 'greek', namePt: 'Grécia Antiga', nameEn: 'Ancient Greece', img: greekScene, color: PROFILE_COLORS[1] },
  { id: 'madmax', namePt: 'Mad Max', nameEn: 'Mad Max', img: madmaxScene, color: PROFILE_COLORS[2] },
];

function loadProfileGameState(index: number): GameState | null {
  try {
    const raw = localStorage.getItem(keyForProfile('GAME_STATE', index));
    if (!raw) return null;
    return JSON.parse(raw) as GameState;
  } catch {
    return null;
  }
}

interface TogetherHomeProps {
  language: Language;
}

export function TogetherHome({ language }: TogetherHomeProps) {
  const [background, setBackground] = useState<SceneId>(() => {
    const saved = localStorage.getItem(HUB_BACKGROUND_KEY);
    return saved === 'greek' || saved === 'madmax' ? saved : 'gothic';
  });
  const [saves, setSaves] = useState<(GameState | null)[]>(() =>
    Array.from({ length: PROFILE_COUNT }, (_, i) => loadProfileGameState(i))
  );

  const chooseBackground = (id: SceneId) => {
    setBackground(id);
    localStorage.setItem(HUB_BACKGROUND_KEY, id);
  };

  const scene = SCENES.find(s => s.id === background) ?? SCENES[0];

  return (
    <div
      style={{
        position: 'relative',
        minHeight: 420,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundImage: `linear-gradient(rgba(0,0,0,0.28), rgba(0,0,0,0.28)), url(${scene.img})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: 8,
          padding: '56px 8px 40px',
          minHeight: 420,
        }}
      >
        {saves.map((gs, i) => (
          <TogetherPet
            key={i}
            profileIndex={i}
            gameState={gs}
            language={language}
            onHealed={(next) => setSaves(prev => prev.map((p, idx) => (idx === i ? next : p)))}
          />
        ))}
      </div>

      {/* Seletor de cenário — os 3 backgrounds das homes */}
      <div
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          display: 'flex',
          gap: 6,
          background: 'rgba(0,0,0,0.35)',
          borderRadius: 999,
          padding: 6,
        }}
      >
        {SCENES.map(s => (
          <button
            key={s.id}
            onClick={() => chooseBackground(s.id)}
            title={language === 'pt-BR' ? s.namePt : s.nameEn}
            aria-label={language === 'pt-BR' ? s.namePt : s.nameEn}
            style={{
              width: 26,
              height: 26,
              flexShrink: 0,
              borderRadius: 999,
              border: background === s.id ? `2px solid ${s.color}` : '2px solid rgba(255,255,255,0.6)',
              backgroundImage: `url(${s.img})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              cursor: 'pointer',
            }}
          />
        ))}
      </div>

      <p
        style={{
          position: 'absolute',
          bottom: 8,
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'rgba(255,255,255,0.85)',
          fontSize: '0.75rem',
          padding: '0 8px',
          textAlign: 'center',
          fontFamily: 'monospace',
          textShadow: '0 1px 3px rgba(0,0,0,0.8)',
          margin: 0,
        }}
      >
        {language === 'pt-BR' ? 'Pressione e esfregue pra fazer carinho 💕' : 'Press and rub to pet them 💕'}
      </p>
    </div>
  );
}

// ── Um pet individual dentro da home coletiva ────────────────────────────────
function TogetherPet({
  profileIndex,
  gameState,
  language,
  onHealed,
}: {
  profileIndex: number;
  gameState: GameState | null;
  language: Language;
  onHealed: (next: GameState) => void;
}) {
  const [isRubbing, setIsRubbing] = useState(false);
  const [hearts, setHearts] = useState<{ id: number; dx: number; dy: number; size: number; emoji: string }[]>([]);

  const pressedRef = useRef(false);
  const lastMoveRef = useRef(0);
  const accumRef = useRef(0);
  const heartTickRef = useRef(0);
  const heartIdRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  const rubHealRef = useRef<{ date: string; healed: number }>(
    (() => {
      try {
        const saved = JSON.parse(localStorage.getItem(keyForProfile('RUB_HEAL_DAY', profileIndex)) || 'null');
        if (saved && saved.date === new Date().toDateString()) return saved;
      } catch {
        /* fall through */
      }
      return { date: new Date().toDateString(), healed: 0 };
    })()
  );

  const healOnce = () => {
    const gs = gameStateRef.current;
    if (!gs || gs.healthPoints >= gs.maxHealthPoints) return;
    const today = new Date().toDateString();
    if (rubHealRef.current.date !== today) rubHealRef.current = { date: today, healed: 0 };
    if (rubHealRef.current.healed >= 1) return; // teto diário (1 coração), igual à home normal
    rubHealRef.current = { date: today, healed: rubHealRef.current.healed + 0.5 };
    localStorage.setItem(keyForProfile('RUB_HEAL_DAY', profileIndex), JSON.stringify(rubHealRef.current));

    const nextHP = Math.min(gs.maxHealthPoints, gs.healthPoints + 0.5);
    const next: GameState = { ...gs, healthPoints: nextHP };
    localStorage.setItem(keyForProfile('GAME_STATE', profileIndex), JSON.stringify(next));
    onHealed(next);
  };

  const tick = () => {
    const now = Date.now();
    const active = pressedRef.current && now - lastMoveRef.current < 180;
    setIsRubbing(active);
    if (!active) return;
    heartTickRef.current += 1;
    if (heartTickRef.current % 5 === 0) {
      try { navigator.vibrate?.(20); } catch { /* noop */ }
      const EMOJIS = ['❤️', '💕', '💖', '💗'];
      const burst = 2 + Math.floor(Math.random() * 2);
      const spawned: typeof hearts = [];
      for (let k = 0; k < burst; k++) {
        const id = ++heartIdRef.current;
        const angle = Math.random() * Math.PI * 2;
        const dist = 24 + Math.random() * 34;
        spawned.push({
          id,
          dx: Math.round(Math.cos(angle) * dist),
          dy: Math.round(Math.sin(angle) * dist),
          size: 0.55 + Math.random() * 0.45,
          emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
        });
        setTimeout(() => setHearts(prev => prev.filter(h => h.id !== id)), 1500);
      }
      setHearts(prev => [...prev, ...spawned]);
    }
    const gs = gameStateRef.current;
    if (gs && gs.healthPoints < gs.maxHealthPoints) {
      accumRef.current += 100;
      if (accumRef.current >= 2000) {
        accumRef.current -= 2000;
        healOnce();
      }
    } else {
      accumRef.current = 0;
    }
  };

  const startRub = (e: React.PointerEvent) => {
    if (!gameState) return;
    pressedRef.current = true;
    lastMoveRef.current = Date.now();
    accumRef.current = 0;
    try { (e.currentTarget as Element).setPointerCapture(e.pointerId); } catch { /* noop */ }
    if (!intervalRef.current) intervalRef.current = setInterval(tick, 100);
  };
  const moveRub = () => {
    if (pressedRef.current) lastMoveRef.current = Date.now();
  };
  const endRub = () => {
    pressedRef.current = false;
    accumRef.current = 0;
    setIsRubbing(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };
  useEffect(() => () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const wrapStyle: React.CSSProperties = {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    minWidth: 0,
    maxWidth: '33%',
  };

  if (!gameState) {
    return (
      <div style={{ ...wrapStyle, opacity: 0.6 }}>
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 72, height: 72, borderRadius: 999,
            border: '2px dashed rgba(255,255,255,0.5)',
          }}
        >
          <span style={{ fontSize: '1.5rem' }}>🥚</span>
        </div>
        <span
          style={{
            color: 'rgba(255,255,255,0.8)', fontSize: '0.625rem', textAlign: 'center',
            fontFamily: 'monospace', textShadow: '0 1px 3px rgba(0,0,0,0.8)',
          }}
        >
          {language === 'pt-BR' ? `Perfil ${profileIndex + 1} sem pet` : `Profile ${profileIndex + 1} empty`}
        </span>
      </div>
    );
  }

  const pet = (gameState.eggType ?? 'vix') as PetType;
  const stage = gameState.evolutionStage || 'egg';
  const sprite = isRubbing ? getExpressionSprite(stage, 'happy') : getSpriteForStage(stage, gameState.eggType);
  const petName = PETS[pet]?.name ?? pet;
  const color = PROFILE_COLORS[profileIndex] ?? '#fff';
  const canHeal = gameState.healthPoints < gameState.maxHealthPoints;

  return (
    <div style={wrapStyle}>
      <div
        style={{ position: 'relative', width: 96, height: 96, touchAction: 'none', userSelect: 'none', cursor: canHeal ? 'pointer' : 'default' }}
        onPointerDown={startRub}
        onPointerMove={moveRub}
        onPointerUp={endRub}
        onPointerCancel={endRub}
      >
        {hearts.map(h => (
          <span
            key={h.id}
            style={{
              position: 'absolute',
              pointerEvents: 'none',
              left: '50%',
              top: '40%',
              fontSize: `${h.size * 1.2}rem`,
              // @ts-expect-error custom props consumed by the rub-heart keyframe
              '--tx': `${h.dx}px`,
              '--ty': `${h.dy}px`,
              animation: 'rub-heart 1.5s ease-out forwards',
            }}
          >
            {h.emoji}
          </span>
        ))}
        <img
          src={sprite}
          alt={petName}
          draggable={false}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            imageRendering: 'pixelated',
            filter: `drop-shadow(0 0 8px ${color}aa)`,
            animation: isRubbing ? 'pet-rub 0.35s ease-in-out infinite' : undefined,
          }}
        />
      </div>
      <span
        style={{
          color: 'rgba(255,255,255,0.9)', fontSize: '0.6875rem', fontWeight: 'bold',
          textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          maxWidth: '100%', fontFamily: 'monospace', textShadow: '0 1px 3px rgba(0,0,0,0.8)',
        }}
      >
        {petName}
      </span>
    </div>
  );
}
