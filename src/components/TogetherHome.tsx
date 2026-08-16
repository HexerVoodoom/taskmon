// Quarta "casinha": todos os 3 pets juntos, só pra visualização + carinho.
// Não é um perfil de verdade — lê os 3 saves (localStorage) sem trocar o
// perfil ativo nem tocar em comida/energia/banho. Único cuidado disponível é
// "carinho" (mesmo gesto de esfregar do CompanionHUD), que grava a cura
// direto no save do perfil dono daquele pet, respeitando o mesmo teto diário
// (STORAGE_KEYS.RUB_HEAL_DAY por perfil) usado na home normal.
import { useEffect, useRef, useState } from 'react';
import { getSpriteForStage, getExpressionSprite } from '../utils/sprites';
import { keyForProfile, getActiveProfile, PROFILE_COUNT } from '../utils/storageKeys';
import { getStageLevel, PETS, PET_TYPES, type PetType } from '../types/progression';
import type { GameState } from '../contexts/GameStateContext';
import { PROFILE_COLORS } from './Header';
import type { Language } from '../utils/i18n';
import { HUB_SCENES, type HubSceneId } from '../utils/hubBackground';
import { PET_BOX_HEIGHT, FLOOR_BOTTOM_PX } from '../utils/petBoxHeight';
import { weekKey } from '../utils/economy';

// 🧺 Piquenique da Família — meta COOPERATIVA semanal (dossiê R09/R29: nunca
// ranking entre as irmãs; o vetor social certo é a soma). As tarefas reais
// concluídas pelos 3 perfis na semana somam num contador; ao bater a meta, os
// 3 pets fazem piquenique juntos aqui na casinha coletiva. Leitura pura dos 3
// saves — nenhuma escrita cruzada.
const FAMILY_WEEK_GOAL = 15;

// Tarefas da semana POR PERFIL — cada uma é exibida como contribuição pra
// meta somada (equipe), nunca como ranking. Tarefas de HOJE ainda na lista
// (migram pro histórico ~3s após concluir) não são contadas pra evitar dupla
// contagem — entram no histórico em seguida.
function countWeekTasksByProfile(saves: (GameState | null)[]): number[] {
  const thisWeek = weekKey(new Date());
  return saves.map(gs => {
    if (!gs) return 0;
    return (gs.completedTasks ?? []).filter(ct => {
      const d = new Date(ct.completedAt);
      return !isNaN(d.getTime()) && weekKey(d) === thisWeek;
    }).length;
  });
}

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
  /** Inventário de comida do perfil ATIVO — fonte dos presentes 🎀. */
  activeFoodInventory: Record<string, number>;
  /** Transfere 1 comida do perfil ativo pro inventário do perfil alvo. */
  onGiftFood: (targetProfile: number, emoji: string) => boolean;
}

// Mesma altura (responsiva, PET_BOX_HEIGHT) e "chão" (FLOOR_BOTTOM_PX,
// distância fixa da base — não % da altura, senão cortaria o sprite em
// caixas mais baixas) das homes normais — os 3 pets dividem esse mesmo
// palco e podem se cruzar livremente (sem faixa própria travando ninguém).

// Sem background próprio: o App já troca o cenário de tela cheia (fixed
// inset-0 no container raiz) pro cenário escolhido aqui enquanto esta view
// está ativa — a mesma faixa "topo até o bottom" das homes normais, em vez
// de uma imagem presa numa caixinha. Este componente só posiciona os 3 pets
// (andando, na mesma altura das homes) e o seletor de cenário por cima dela.
export function TogetherHome({ language, background, onChangeBackground, activeFoodInventory, onGiftFood }: TogetherHomeProps) {
  const [saves, setSaves] = useState<(GameState | null)[]>(() =>
    Array.from({ length: PROFILE_COUNT }, (_, i) => loadProfileGameState(i))
  );

  // 🧺 Meta cooperativa da semana (soma dos 3 perfis, leitura pura).
  const weekByProfile = countWeekTasksByProfile(saves);
  const familyTasks = weekByProfile.reduce((a, b) => a + b, 0);
  const picnicUnlocked = familyTasks >= FAMILY_WEEK_GOAL;

  // 🎀 Presente: perfil alvo com o seletor de comida aberto (null = fechado).
  const activeProfile = getActiveProfile();
  const [giftTarget, setGiftTarget] = useState<number | null>(null);
  const [giftFlash, setGiftFlash] = useState<number | null>(null);
  const giftableFoods = Object.entries(activeFoodInventory)
    .filter(([emoji, n]) => n > 0 && emoji !== '💗' && emoji !== '🌀')
    .slice(0, 6);

  const sendGift = (target: number, emoji: string) => {
    if (onGiftFood(target, emoji)) {
      setGiftTarget(null);
      setGiftFlash(target);
      // Recarrega o save do alvo pro pet "receber" na hora.
      setSaves(prev => prev.map((p, idx) => (idx === target ? loadProfileGameState(target) : p)));
      setTimeout(() => setGiftFlash(null), 1600);
    }
  };

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
        // Reserva o espaço da dica no rodapé (que agora flutua por cima,
        // absoluta) pra ela não ficar em cima dos pés/nome dos pets.
        paddingBottom: 22,
        boxSizing: 'border-box',
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

      {/* 🧺 Medidor do Piquenique da Família — meta semanal cooperativa */}
      <div
        style={{
          position: 'absolute',
          top: 8,
          left: 8,
          zIndex: 2,
          background: 'rgba(0,0,0,0.45)',
          borderRadius: 12,
          padding: '6px 10px',
          maxWidth: 180,
        }}
      >
        <p style={{ margin: 0, color: '#fff', fontSize: '0.7rem', fontFamily: 'monospace', fontWeight: 700 }}>
          🧺 {language === 'pt-BR' ? 'Piquenique da família' : 'Family picnic'}
        </p>
        <div style={{ height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.25)', marginTop: 4, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${Math.min(100, (familyTasks / FAMILY_WEEK_GOAL) * 100)}%`,
            background: picnicUnlocked ? '#facc15' : '#4ade80',
            borderRadius: 999,
            transition: 'width 0.4s',
          }} />
        </div>
        <p style={{ margin: '3px 0 0', color: 'rgba(255,255,255,0.85)', fontSize: '0.62rem', fontFamily: 'monospace' }}>
          {picnicUnlocked
            ? (language === 'pt-BR' ? 'Conseguimos! 🎉' : 'We did it! 🎉')
            : (language === 'pt-BR'
              ? `${familyTasks}/${FAMILY_WEEK_GOAL} tarefas da família na semana`
              : `${familyTasks}/${FAMILY_WEEK_GOAL} family tasks this week`)}
        </p>
        {/* Contribuição dos TRÊS pets — sempre os 3 aparecem, mesmo que uma
            casinha ainda não tenha save (conta 0 em vez de sumir): a meta é
            da família inteira. Ordem fixa dos perfis, pesos visuais iguais:
            soma de equipe, nunca ranking (dossiê R29). */}
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          {Array.from({ length: PROFILE_COUNT }, (_, i) => {
            // Identidade do pet vem da casinha (PET_TYPES[i]); o save só
            // sobrescreve se o perfil escolheu outro bichinho no ovo.
            const pet = PETS[(saves[i]?.eggType ?? PET_TYPES[i] ?? 'vix') as PetType];
            return (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontFamily: 'monospace', fontSize: '0.62rem', color: '#fff' }}>
                <span style={{ width: 7, height: 7, borderRadius: 999, background: PROFILE_COLORS[i], display: 'inline-block' }} />
                {pet.name} {weekByProfile[i]}
              </span>
            );
          })}
        </div>
      </div>

      {/* Altura fixa igual à caixa do pet nas homes normais (CompanionHUD:
          360px, chão bem mais embaixo) — grudada no fundo de verdade
          (marginTop: auto + dica flutuando por cima, não mais empurrando
          a caixa pra cima no fluxo normal). */}
      <div style={{ position: 'relative', height: PET_BOX_HEIGHT, marginTop: 'auto' }}>
        {/* 🧺 Piquenique desbloqueado: toalha e comidinhas no chão entre os
            pets — a celebração coletiva da meta da semana. */}
        {picnicUnlocked && (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              left: '50%',
              bottom: FLOOR_BOTTOM_PX - 6,
              transform: 'translateX(-50%)',
              textAlign: 'center',
              zIndex: 0,
              pointerEvents: 'none',
            }}
          >
            <div className="animate-pulse" style={{ fontSize: '1.1rem', letterSpacing: 2 }}>🎈 🎵 🎈</div>
            <div style={{ fontSize: '1.5rem', letterSpacing: 4 }}>🧺🍰🍎🥪🧃</div>
            <div style={{ width: 150, height: 14, margin: '2px auto 0', borderRadius: 4, background: 'repeating-linear-gradient(45deg, #dc2626 0 8px, #fff 8px 16px)', opacity: 0.9 }} />
          </div>
        )}
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

      {/* 🎀 Barra de presente: manda uma comidinha do SEU estoque pro pet de
          outra irmã. Botões fixos (os pets andam — botão flutuante seria
          impossível de acertar com dedo pequeno). Só perfis COM save podem
          receber: escrever num save inexistente criaria um perfil fantasma. */}
      <div
        style={{
          position: 'absolute',
          bottom: 22,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(0,0,0,0.45)',
          borderRadius: 999,
          padding: '5px 10px',
          zIndex: 2,
        }}
      >
        {giftTarget === null ? (
          <>
            <span style={{ color: '#fff', fontFamily: 'monospace', fontSize: '0.68rem', fontWeight: 700 }}>🎀</span>
            {saves.map((gs, i) => {
              if (i === activeProfile || !gs) return null;
              const pet = PETS[(gs.eggType ?? PET_TYPES[i] ?? 'vix') as PetType];
              return (
                <button
                  key={i}
                  onClick={() => setGiftTarget(i)}
                  disabled={giftableFoods.length === 0}
                  title={language === 'pt-BR' ? `Mandar presente pro ${pet.name}` : `Send a gift to ${pet.name}`}
                  style={{
                    fontFamily: 'monospace', fontSize: '0.7rem', fontWeight: 800, cursor: giftableFoods.length ? 'pointer' : 'default',
                    border: `1.5px solid ${PROFILE_COLORS[i]}`, borderRadius: 999, padding: '3px 10px',
                    background: 'rgba(255,255,255,0.12)', color: '#fff', opacity: giftableFoods.length ? 1 : 0.5,
                  }}
                >
                  {pet.name}
                </button>
              );
            })}
            {giftableFoods.length === 0 && (
              <span style={{ color: 'rgba(255,255,255,0.75)', fontFamily: 'monospace', fontSize: '0.6rem' }}>
                {language === 'pt-BR' ? 'sem comida pra dar' : 'no food to give'}
              </span>
            )}
          </>
        ) : (
          <>
            {giftableFoods.map(([emoji, n]) => (
              <button
                key={emoji}
                onClick={() => sendGift(giftTarget, emoji)}
                title={`×${n}`}
                style={{ border: 'none', background: 'rgba(255,255,255,0.15)', borderRadius: 999, width: 34, height: 34, fontSize: '1.05rem', cursor: 'pointer' }}
              >
                {emoji}
              </button>
            ))}
            <button
              onClick={() => setGiftTarget(null)}
              aria-label={language === 'pt-BR' ? 'Cancelar' : 'Cancel'}
              style={{ border: 'none', background: 'transparent', color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: '0.8rem' }}
            >
              ✕
            </button>
          </>
        )}
      </div>

      {/* 💝 Confirmação do presente enviado */}
      {giftFlash !== null && (
        <p
          className="animate-pulse"
          style={{
            position: 'absolute', bottom: 62, left: '50%', transform: 'translateX(-50%)',
            color: '#fff', fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 800,
            textShadow: '0 1px 3px rgba(0,0,0,0.8)', margin: 0, zIndex: 2, whiteSpace: 'nowrap',
          }}
        >
          {language === 'pt-BR' ? 'Presente enviado! 💝' : 'Gift sent! 💝'}
        </p>
      )}

      <p
        style={{
          position: 'absolute',
          bottom: 4,
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          color: 'rgba(255,255,255,0.85)',
          fontSize: '0.75rem',
          padding: '0 8px',
          whiteSpace: 'nowrap',
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
          // bottom fixo (não % da altura, que muda com PET_BOX_HEIGHT): o
          // círculo de 96px fica a FLOOR_BOTTOM_PX do chão; o valor negativo
          // compensa a etiqueta+gap abaixo dele (que sobra, sem cortar nada
          // — este palco não tem overflow:hidden).
          bottom: -13,
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
        // bottom fixo (não % da altura): o sprite não encolhe junto com a
        // caixa (PET_BOX_HEIGHT é responsiva), então ancorar por % cortava
        // o pet em caixas mais baixas. O pé fica a FLOOR_BOTTOM_PX do chão;
        // o valor negativo compensa a etiqueta com o nome, que sobra abaixo
        // dele sem cortar nada (este palco não tem overflow:hidden).
        bottom: FLOOR_BOTTOM_PX - 14,
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
