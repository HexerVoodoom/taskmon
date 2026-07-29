import { useState } from 'react';
import { DungeonGame } from './DungeonGame';
import { DinoGame } from './DinoGame';
import { RoofRunGame } from './RoofRunGame';
import { RPSGame } from './RPSGame';
import { BubbleGame } from './BubbleGame';
import { ShopModal } from './ShopModal';
import { bitsStyle } from '../utils/currency';
import { getSpriteForStage } from '../utils/sprites';
import rooftopIcon from '../assets/roofrun/rooftop.png';
import type { Language } from '../utils/i18n';

/**
 * "Atividades" page — interactive minigames hub.
 * All games award 🪙 Bits (GameState.gamePoints), spent in the shop on food.
 * Balance: Dungeon points/enemy + wave clear · Dino/Roof Run floor(score/50) · RPS +10/match · Bubble Pop +1/bolha.
 */
export function ActivitiesPage({ evolutionStage, eggType, language, theme = 'default', totalPoints, onDungeonEnter, onDungeonLose, onDungeonHeartDrop, onGlitchtama, onDungeonEnemyDefeated, onDinoScore, onEarnPoints, onShopBuy }: {
  evolutionStage: string;
  eggType?: string;
  language: Language;
  theme?: 'default' | 'win98' | 'glitch';
  totalPoints: number;
  onDungeonEnter: () => { ok: true; level: number; best: number };
  onDungeonLose: () => void;
  onDungeonHeartDrop: () => boolean;
  onGlitchtama: () => void;
  onDungeonEnemyDefeated: () => void;
  onDinoScore: (score: number) => void;
  onEarnPoints: (pts: number) => void;
  onShopBuy: (itemId: string) => boolean;
}) {
  const isPt = language === 'pt-BR';
  const isWin98 = theme === 'win98';
  const isGlitch = theme === 'glitch';
  const [openGame, setOpenGame] = useState<'dungeon' | 'dino' | 'roofrun' | 'rps' | 'bubble' | null>(null);
  const [shopOpen, setShopOpen] = useState(false);

  const cards: { key: 'dungeon' | 'dino' | 'roofrun' | 'rps' | 'bubble'; icon: string; sprite?: string; badgeBg: string; title: string; desc: string; pts: string }[] = [
    {
      key: 'dungeon', icon: '⚔️', sprite: getSpriteForStage('enemy-wraith'),
      badgeBg: 'linear-gradient(160deg, #4c1d95, #1e1b4b)',
      title: isPt ? 'Masmorra' : 'Dungeon',
      desc: isPt
        ? '5 andares com os monstros da masmorra, cada vez mais fortes. Minijogo livre, sem custo de coração!'
        : '5 floors of dungeon monsters, each tougher than the last. Free to play, no heart cost!',
      pts: isPt ? 'Bits por inimigo + ranking' : 'Bits per enemy + ranking',
    },
    {
      key: 'dino', icon: '🦖', sprite: getSpriteForStage('enemy-golem'),
      badgeBg: 'linear-gradient(160deg, #ea580c, #7c2d12)',
      title: isPt ? 'Corrida do Dino' : 'Dino Runner',
      desc: isPt ? 'Pule os monstros e corra o máximo que conseguir.' : 'Jump the monsters and run as far as you can.',
      pts: isPt ? '1 Bit a cada 50 de score' : '1 Bit per 50 score',
    },
    {
      key: 'roofrun', icon: '🏠', sprite: rooftopIcon,
      badgeBg: 'linear-gradient(160deg, #db7a3f, #7c3a12)',
      title: isPt ? 'Corrida nos Telhados' : 'Roof Run',
      desc: isPt ? 'Pule de telhado em telhado sem cair no vão.' : 'Jump from rooftop to rooftop without falling.',
      pts: isPt ? '1 Bit a cada 50 de score' : '1 Bit per 50 score',
    },
    {
      key: 'rps', icon: '✊',
      badgeBg: 'linear-gradient(160deg, #0369a1, #0c4a6e)',
      title: isPt ? 'Pedra, Papel e Tesoura' : 'Rock, Paper, Scissors',
      desc: isPt ? 'Clássico duelo contra o seu pet. Melhor de 5.' : 'The classic duel against your pet. First to 3.',
      pts: isPt ? '10 Bits por vitória' : '10 Bits per match win',
    },
    {
      key: 'bubble', icon: '🫧',
      badgeBg: 'linear-gradient(160deg, #38bdf8, #0e7490)',
      title: isPt ? 'Estoura Bolhas' : 'Bubble Pop',
      desc: isPt ? 'Seu pet cospe bolhas — estoure todas antes que fujam! 30 segundos.' : 'Your pet blows bubbles — pop them all before they float away! 30 seconds.',
      pts: isPt ? '1 Bit por bolha' : '1 Bit per bubble',
    },
  ];

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2
          className={`tk-display ${isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-black' : 'text-gray-900'}`}
          style={{ fontSize: '1.05rem', fontWeight: 700 }}
        >
          🎮 {isPt ? 'Atividades' : 'Activities'}
        </h2>
        <div className="flex items-center gap-2">
          <span
            className="px-3 py-1 rounded-full tk-keep-mono"
            style={{ ...bitsStyle, fontSize: '0.85rem', color: '#fff', background: '#0a1408', border: '1px solid rgba(57,255,20,0.4)' }}
            title={isPt ? 'Bits — moeda dos minijogos (gaste na loja!)' : 'Bits — minigame currency (spend in the shop!)'}
          >
            {totalPoints} Bits
          </span>
          <button
            onClick={() => setShopOpen(true)}
            aria-label={isPt ? 'Loja' : 'Shop'}
            title={isPt ? 'Loja — comidas para o seu pet!' : 'Shop — food for your pet!'}
            className="cursor-pointer active:scale-[0.97] transition-all"
            style={{
              background: 'var(--tk-btn-bg, var(--tk-accent, #4ade80))',
              border: 'none',
              borderRadius: 'var(--tk-radius-sm, 10px)',
              boxShadow: '0 2px 0 rgba(0,0,0,0.15)',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.15rem',
              lineHeight: 1,
            }}
          >
            🍽️
          </button>
        </div>
      </div>
      <p className={isGlitch ? 'text-[#5fbcbc]' : isWin98 ? 'text-gray-700' : 'text-gray-500'}
         style={{ fontSize: '0.78rem' }}>
        {isPt ? 'Minijogos para se divertir e acumular Bits com seu pet.' : 'Minigames to have fun and earn Bits with your pet.'}
      </p>

      {cards.map(c => (
        <button
          key={c.key}
          onClick={() => setOpenGame(c.key)}
          className={`w-full text-left rounded-2xl p-4 transition-all cursor-pointer active:scale-[0.97] hover:shadow-xl ${
            isGlitch
              ? 'bg-[#0a0a0a] border-2 border-[#00ffff]/30'
              : isWin98
                ? 'win98-button bg-white'
                : 'bg-white ring-1 ring-gray-200/50'
          }`}
          style={isGlitch || isWin98 ? undefined : {
            boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 2px 8px rgba(16,24,40,0.06)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="hover:scale-105 transition-transform"
              style={{
                width: 54, height: 54, borderRadius: 'var(--tk-radius-sm, 14px)', flexShrink: 0,
                background: c.badgeBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', position: 'relative',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25), 0 2px 6px rgba(0,0,0,0.18)',
              }}
            >
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, rgba(255,255,255,0.18), transparent 55%)' }} />
              {c.sprite
                ? <img src={c.sprite} alt="" style={{ width: 44, height: 44, objectFit: 'contain', imageRendering: 'pixelated', position: 'relative' }} />
                : <span style={{ fontSize: '1.75rem', lineHeight: 1, position: 'relative' }}>{c.icon}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-black' : 'text-gray-900'}
                      style={{ fontSize: '0.92rem', fontWeight: 700 }}>
                  {c.title}
                </span>
                <span className={`px-2 py-[2px] rounded-full font-semibold ${isGlitch ? 'bg-[#00ffff]/10 text-[#5fbcbc]' : 'bg-gray-100 text-gray-500'}`}
                      style={{ fontSize: '0.6rem' }}>
                  {c.pts}
                </span>
              </div>
              <p className={isGlitch ? 'text-[#5fbcbc]' : isWin98 ? 'text-gray-700' : 'text-gray-500'}
                 style={{ fontSize: '0.72rem', marginTop: 2 }}>
                {c.desc}
              </p>
            </div>
            <span
              className={isGlitch ? 'text-[#00ffff]' : 'text-gray-400'}
              style={{
                fontSize: '1rem', flexShrink: 0, width: 26, height: 26, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isGlitch ? 'transparent' : 'var(--tk-soft, #f3f4f6)',
              }}
            >
              ›
            </span>
          </div>
        </button>
      ))}

      {shopOpen && (
        <ShopModal
          language={language}
          points={totalPoints}
          onBuy={onShopBuy}
          onClose={() => setShopOpen(false)}
        />
      )}

      {openGame === 'dungeon' && (
        <DungeonGame
          evolutionStage={evolutionStage}
          eggType={eggType}
          language={language}
          onEnter={onDungeonEnter}
          onLose={onDungeonLose}
          onHeartDrop={onDungeonHeartDrop}
          onGlitchtama={onGlitchtama}
          onEnemyDefeated={onDungeonEnemyDefeated}
          onEarnPoints={onEarnPoints}
          onExit={() => setOpenGame(null)}
        />
      )}
      {openGame === 'dino' && (
        <DinoGame
          evolutionStage={evolutionStage}
          eggType={eggType}
          language={language}
          onEarnPoints={onEarnPoints}
          onScore={onDinoScore}
          onExit={() => setOpenGame(null)}
        />
      )}
      {openGame === 'roofrun' && (
        <RoofRunGame
          evolutionStage={evolutionStage}
          eggType={eggType}
          language={language}
          onEarnPoints={onEarnPoints}
          onExit={() => setOpenGame(null)}
        />
      )}
      {openGame === 'rps' && (
        <RPSGame
          evolutionStage={evolutionStage}
          eggType={eggType}
          language={language}
          onEarnPoints={onEarnPoints}
          onExit={() => setOpenGame(null)}
        />
      )}
      {openGame === 'bubble' && (
        <BubbleGame
          evolutionStage={evolutionStage}
          eggType={eggType}
          language={language}
          onEarnPoints={onEarnPoints}
          onExit={() => setOpenGame(null)}
        />
      )}
    </div>
  );
}
