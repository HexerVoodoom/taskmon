// Quarta "casinha": todos os 3 pets juntos, só pra visualização + carinho.
// Não é um perfil de verdade — lê os 3 saves (localStorage) sem trocar o
// perfil ativo nem tocar em comida/energia/banho. Único cuidado disponível é
// "carinho" (mesmo gesto de esfregar do CompanionHUD), que grava a cura
// direto no save do perfil dono daquele pet, respeitando o mesmo teto diário
// (STORAGE_KEYS.RUB_HEAL_DAY por perfil) usado na home normal.
import { useEffect, useRef, useState } from 'react';
import { getSpriteForStage, getExpressionSprite } from '../utils/sprites';
import { keyForProfile, PROFILE_COUNT } from '../utils/storageKeys';
import { getStageLevel, PETS, type PetType } from '../types/progression';
import type { GameState } from '../contexts/GameStateContext';
import { PROFILE_COLORS } from './Header';
import type { Language } from '../utils/i18n';
import { HUB_SCENES, type HubSceneId } from '../utils/hubBackground';

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
  background: HubSceneId;
  onChangeBackground: (id: HubSceneId) => void;
}

// Mesma altura de "chão" das homes normais (CompanionHUD: box de 360px,
// pet ancorado a 72% da altura) — os 3 pets dividem esse mesmo palco e
// podem se cruzar livremente (sem faixa própria travando ninguém).
const STAGE_HEIGHT = 360;
const FLOOR_Y_PERCENT = 72;

// Sem background próprio: o App já troca o cenário de tela cheia (fixed
// inset-0 no container raiz) pro cenário escolhido aqui enquanto esta view
// está ativa — a mesma faixa "topo até o bottom" das homes normais, em vez
// de uma imagem presa numa caixinha. Este componente só posiciona os 3 pets
// (andando, na mesma altura das homes) e o seletor de cenário por cima dela.
export function TogetherHome({ language, background, onChangeBackground }: TogetherHomeProps) {
  const [saves, setSaves] = useState<(GameState | null)[]>(() =>
    Array.from({ length: PROFILE_COUNT }, (_, i) => loadProfileGameState(i))
  );

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        // 100% (não uma estimativa em px) do espaço que sobrou na área de
        // conteúdo depois de esconder o rodapé/banner — uma estimativa fixa
        // ficava menor que o espaço real, sobrando vão embaixo e empurrando
        // os pets pra cima.
        height: '100%',
        minHeight: '100%',
      }}
    >
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
          zIndex: 2,
        }}
      >
        {HUB_SCENES.map(s => (
          <button
            key={s.id}
            onClick={() => onChangeBackground(s.id)}
            title={language === 'pt-BR' ? s.namePt : s.nameEn}
            aria-label={language === 'pt-BR' ? s.namePt : s.nameEn}
            style={{
              width: 26,
              height: 26,
              flexShrink: 0,
              borderRadius: 999,
              border: background === s.id ? '2px solid #fff' : '2px solid rgba(255,255,255,0.5)',
              backgroundImage: `url(${s.img})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              cursor: 'pointer',
            }}
          />
        ))}
      </div>

      {/* Altura fixa igual à caixa do pet nas homes normais (CompanionHUD:
          360px, chão a 72%) — grudada embaixo (marginTop: auto), no lugar
          onde o rodapé normalmente fica, em vez de esticar/flutuar no meio
          da tela. */}
      <div style={{ position: 'relative', height: STAGE_HEIGHT, marginTop: 'auto' }}>
        {saves.map((gs, i) => (
          <TogetherPet
            key={i}
            laneIndex={i}
            profileIndex={i}
            gameState={gs}
            language={language}
            onHealed={(next) => setSaves(prev => prev.map((p, idx) => (idx === i ? next : p)))}
          />
        ))}
      </div>

      <p
        style={{
          textAlign: 'center',
          color: 'rgba(255,255,255,0.85)',
          fontSize: '0.75rem',
          padding: '0 8px 8px',
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
  laneIndex,
  profileIndex,
  gameState,
  language,
  onHealed,
}: {
  laneIndex: number;
  profileIndex: number;
  gameState: GameState | null;
  language: Language;
  onHealed: (next: GameState) => void;
}) {
  // Passeiam livres pelo palco inteiro (mesmo raio 10–90% de uma home
  // normal) — podem se cruzar e passar um pelo outro, sem faixa própria
  // travando ninguém. Só o ponto de partida e a velocidade variam por pet,
  // pra não ficarem todos grudados andando em sincronia.
  const WALK_MIN = 10;
  const WALK_MAX = 90;
  const startPosition = 20 + laneIndex * 30;
  const speed = 0.22 + laneIndex * 0.06;

  const [position, setPosition] = useState(startPosition);
  const [direction, setDirection] = useState<'right' | 'left'>(laneIndex % 2 === 0 ? 'right' : 'left');
  const [squashFrame, setSquashFrame] = useState(0);
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

  // Anda de um lado pro outro do palco — pausa durante o carinho.
  useEffect(() => {
    if (!gameState) return;
    const walk = setInterval(() => {
      if (isRubbing) return;
      setPosition(prev => {
        const next = direction === 'right' ? prev + speed : prev - speed;
        if (next >= WALK_MAX) { setDirection('left'); return WALK_MAX; }
        if (next <= WALK_MIN) { setDirection('right'); return WALK_MIN; }
        return next;
      });
    }, 50);
    return () => clearInterval(walk);
  }, [direction, isRubbing, gameState, speed]);

  // Respiração (squash/stretch), independente por pet.
  useEffect(() => {
    const breathe = setInterval(() => setSquashFrame(p => (p + 1) % 2), 1200 + laneIndex * 130);
    return () => clearInterval(breathe);
  }, [laneIndex]);

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

  if (!gameState) {
    return (
      <div
        style={{
          position: 'absolute',
          left: `${startPosition}%`,
          top: `calc(${FLOOR_Y_PERCENT}% - 96px)`,
          // width fixo: sem isso, um wrapper `position:absolute` com só
          // `left` (sem `right`) tem largura "auto" calculada por
          // shrink-to-fit, que o navegador limita ao espaço até a borda —
          // perto da direita isso amassava até a imagem lá dentro.
          width: 130,
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          opacity: 0.6,
        }}
      >
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 96, height: 96, borderRadius: 999,
            border: '2px dashed rgba(255,255,255,0.5)',
          }}
        >
          <span style={{ fontSize: '2rem' }}>🥚</span>
        </div>
        <span
          style={{
            color: 'rgba(255,255,255,0.8)', fontSize: '0.625rem', textAlign: 'center', whiteSpace: 'nowrap',
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
  const isEgg = getStageLevel(stage) === 'egg';
  const sprite = isRubbing ? getExpressionSprite(stage, 'happy') : getSpriteForStage(stage, gameState.eggType);
  const petName = PETS[pet]?.name ?? pet;
  const color = PROFILE_COLORS[profileIndex] ?? '#fff';
  const canHeal = gameState.healthPoints < gameState.maxHealthPoints;
  const flip = !isEgg && direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)';
  const squashScale = squashFrame === 0 ? 0.94 : 1;

  return (
    <div
      style={{
        position: 'absolute',
        left: `${position}%`,
        // O pé do sprite (não a etiqueta com o nome, que fica abaixo dele)
        // encosta na linha do chão — por isso o deslocamento fixo em px
        // (altura do sprite) em vez de um translateY(-100%) no wrapper
        // inteiro, que empurrava o pet pra cima da linha certa.
        top: `calc(${FLOOR_Y_PERCENT}% - 132px)`,
        // width fixo pelo mesmo motivo do placeholder de ovo acima: um
        // wrapper absoluto com só `left` shrink-to-fit e amassa o sprite
        // quando `position` chega perto da borda direita do palco.
        width: 132,
        transform: 'translateX(-50%)',
        transition: 'left 0.1s linear',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {hearts.map(h => (
        <span
          key={h.id}
          style={{
            position: 'absolute',
            pointerEvents: 'none',
            left: '50%',
            top: '30%',
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
      <div
        onPointerDown={startRub}
        onPointerMove={moveRub}
        onPointerUp={endRub}
        onPointerCancel={endRub}
        style={{ touchAction: 'none', userSelect: 'none', cursor: canHeal ? 'pointer' : 'default' }}
      >
        <img
          src={sprite}
          alt={petName}
          draggable={false}
          style={{
            width: 132,
            height: 132,
            objectFit: 'contain',
            imageRendering: 'pixelated',
            filter: `drop-shadow(0 0 8px ${color}aa)`,
            transform: `${flip} scaleY(${squashScale})`,
            transformOrigin: 'bottom',
            animation: isRubbing ? 'pet-rub 0.35s ease-in-out infinite' : undefined,
          }}
        />
      </div>
      <span
        style={{
          color: 'rgba(255,255,255,0.9)', fontSize: '0.6875rem', fontWeight: 'bold',
          textAlign: 'center', whiteSpace: 'nowrap',
          fontFamily: 'monospace', textShadow: '0 1px 3px rgba(0,0,0,0.8)',
        }}
      >
        {petName}
      </span>
    </div>
  );
}
