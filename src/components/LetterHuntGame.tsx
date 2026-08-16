import { useState } from 'react';
import { getSpriteForStage } from '../utils/sprites';
import { playTaskComplete, playFeed, playDegenerate } from '../utils/sounds';
import { PETS, type PetType } from '../types/progression';
import type { Language } from '../utils/i18n';

/**
 * 🔤 Caça-Letras — minijogo EDUCATIVO de alfabetização, com narração por voz.
 *  - 🐣 Pequenos: a voz fala uma letra ("Onde está a letra A?") e a criança
 *    toca a letra certa numa grade de 6 (pré-leitores: ouvir → reconhecer).
 *  - 🦸 Grandes: uma palavra aparece com uma letra faltando (G_TO) e a voz
 *    fala a palavra inteira; escolher a letra que completa.
 * O pet do jogador comemora a cada acerto. +2 Bits por acerto.
 *
 * Idioma do JOGO é escolhido dentro dele (seletor PT-BR/EN na tela inicial),
 * independente do idioma geral do app — o app abre em inglês por padrão até
 * alguém trocar em Config, e a família pode querer praticar em português
 * mesmo assim. `language` só define o valor inicial do seletor.
 */
const ROUNDS = 8;
const HIT_BITS = 2;
const ALPHABET = 'ABCDEFGHIJLMNOPRSTUV';

const WORDS_PT = ['GATO', 'BOLA', 'CASA', 'PATO', 'LUA', 'SAPO', 'MALA', 'PIPA', 'FADA', 'REI', 'SOL', 'UVA'];
const WORDS_EN = ['CAT', 'BALL', 'HOME', 'DUCK', 'MOON', 'FROG', 'BAG', 'KITE', 'STAR', 'KING', 'SUN', 'FISH'];

function speakLine(text: string, gameLang: Language) {
  try {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = gameLang === 'pt-BR' ? 'pt-BR' : 'en-US';
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
  } catch { /* noop */ }
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function LetterHuntGame({ eggType, language, onEarnPoints, onExit }: {
  eggType?: string;
  language: Language;
  onEarnPoints: (pts: number) => void;
  onExit: () => void;
}) {
  const mono = { fontFamily: 'monospace' as const };
  const myPet = (PETS[eggType as PetType] ? eggType : 'vix') as PetType;

  // Idioma do jogo — começa igual ao do app, mas trocável na tela inicial.
  const [gameLang, setGameLang] = useState<Language>(language);
  const isPt = gameLang === 'pt-BR';

  const [mode, setMode] = useState<'letter' | 'word' | null>(null);
  const [round, setRound] = useState(0);
  const [hits, setHits] = useState(0);
  const [target, setTarget] = useState('A');       // letra certa da rodada
  const [options, setOptions] = useState<string[]>([]);
  const [word, setWord] = useState('');            // palavra do modo 🦸
  const [gapIndex, setGapIndex] = useState(0);
  const [feedback, setFeedback] = useState<'ok' | 'no' | null>(null);
  const [done, setDone] = useState(false);

  const newRound = (m: 'letter' | 'word') => {
    setFeedback(null);
    if (m === 'letter') {
      const t = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
      const others = shuffle(ALPHABET.split('').filter(l => l !== t)).slice(0, 5);
      setTarget(t);
      setOptions(shuffle([t, ...others]));
      speakLine(isPt ? `Onde está a letra ${t}?` : `Where is the letter ${t}?`, gameLang);
    } else {
      const list = isPt ? WORDS_PT : WORDS_EN;
      const w = list[Math.floor(Math.random() * list.length)];
      const gi = Math.floor(Math.random() * w.length);
      const t = w[gi];
      const others = shuffle(ALPHABET.split('').filter(l => l !== t)).slice(0, 3);
      setWord(w);
      setGapIndex(gi);
      setTarget(t);
      setOptions(shuffle([t, ...others]));
      speakLine(w, gameLang);
    }
  };

  const start = (m: 'letter' | 'word') => { setMode(m); setRound(0); setHits(0); setDone(false); newRound(m); };

  const pick = (letter: string) => {
    if (feedback) return;
    const correct = letter === target;
    setFeedback(correct ? 'ok' : 'no');
    if (correct) {
      playTaskComplete();
      onEarnPoints(HIT_BITS);
      setHits(h => h + 1);
      speakLine(isPt ? 'Isso!' : 'Yes!', gameLang);
    } else {
      playDegenerate();
      speakLine(isPt ? `Era a letra ${target}` : `It was the letter ${target}`, gameLang);
    }
    setTimeout(() => {
      const next = round + 1;
      if (next >= ROUNDS) { setDone(true); playFeed(); }
      else { setRound(next); newRound(mode!); }
    }, 1200);
  };

  const panel = (children: React.ReactNode) => (
    <div style={{ position: 'fixed', inset: 0, zIndex: 120, background: '#1e1b4b', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16, gap: 16 }} className="tk-keep-mono">
      <button onClick={onExit} aria-label={isPt ? 'Sair' : 'Exit'} style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 38, height: 38, color: '#fff', fontSize: '1.1rem', fontWeight: 800, cursor: 'pointer' }}>✕</button>
      {children}
    </div>
  );

  // Seletor de idioma do jogo — dois botões grandes tipo bandeira.
  const langSwitcher = (
    <div style={{ display: 'flex', gap: 10 }}>
      <button
        onClick={() => setGameLang('pt-BR')}
        aria-label="Português"
        style={{
          ...mono, padding: '8px 16px', borderRadius: 999, fontSize: '1rem', fontWeight: 800, cursor: 'pointer',
          border: gameLang === 'pt-BR' ? '3px solid #facc15' : '2px solid rgba(255,255,255,0.3)',
          background: gameLang === 'pt-BR' ? '#4c1d95' : 'rgba(255,255,255,0.08)',
          color: '#fff',
        }}
      >
        🇧🇷 PT-BR
      </button>
      <button
        onClick={() => setGameLang('en-US')}
        aria-label="English"
        style={{
          ...mono, padding: '8px 16px', borderRadius: 999, fontSize: '1rem', fontWeight: 800, cursor: 'pointer',
          border: gameLang === 'en-US' ? '3px solid #facc15' : '2px solid rgba(255,255,255,0.3)',
          background: gameLang === 'en-US' ? '#4c1d95' : 'rgba(255,255,255,0.08)',
          color: '#fff',
        }}
      >
        🇺🇸 EN
      </button>
    </div>
  );

  if (!mode) {
    return panel(<>
      <span style={{ fontSize: '3.2rem' }}>🔤</span>
      <h2 style={{ ...mono, color: '#c4b5fd', fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>{isPt ? 'Caça-Letras' : 'Letter Hunt'}</h2>
      {langSwitcher}
      <p style={{ ...mono, color: '#ddd6fe', fontSize: '0.92rem', textAlign: 'center', maxWidth: 300, margin: 0 }}>
        {isPt ? 'Ouça e ache a letra! Seu pet comemora cada acerto.' : 'Listen and find the letter! Your pet celebrates every hit.'}
      </p>
      <button onClick={() => start('letter')} style={{ ...mono, minWidth: 260, minHeight: 76, borderRadius: 18, border: 'none', background: '#7c3aed', color: '#fff', fontSize: '1.15rem', fontWeight: 800, cursor: 'pointer' }}>
        🐣 {isPt ? 'Achar a letra' : 'Find the letter'}
      </button>
      <button onClick={() => start('word')} style={{ ...mono, minWidth: 260, minHeight: 76, borderRadius: 18, border: 'none', background: '#5b21b6', color: '#fff', fontSize: '1.15rem', fontWeight: 800, cursor: 'pointer' }}>
        🦸 {isPt ? 'Completar a palavra' : 'Complete the word'}
      </button>
    </>);
  }

  if (done) {
    return panel(<>
      <span style={{ fontSize: '3.2rem' }}>🎉</span>
      <h2 style={{ ...mono, color: '#c4b5fd', fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>{isPt ? 'Caça encerrada!' : 'Hunt over!'}</h2>
      <p style={{ ...mono, color: '#ddd6fe', fontSize: '1.1rem', margin: 0 }}>
        {isPt ? `${hits}/${ROUNDS} letras certas · +${hits * HIT_BITS} Bits` : `${hits}/${ROUNDS} letters right · +${hits * HIT_BITS} Bits`}
      </p>
      <button onClick={() => setMode(null)} style={{ ...mono, minWidth: 220, minHeight: 60, borderRadius: 16, border: 'none', background: '#7c3aed', color: '#fff', fontSize: '1.05rem', fontWeight: 800, cursor: 'pointer' }}>
        {isPt ? 'Jogar de novo' : 'Play again'}
      </button>
    </>);
  }

  return panel(<>
    <p style={{ ...mono, color: '#ddd6fe', fontSize: '0.85rem', margin: 0 }}>{isPt ? 'Rodada' : 'Round'} {round + 1}/{ROUNDS} · ⭐ {hits}</p>

    <img src={getSpriteForStage(`${myPet}-1`)} alt="" style={{ width: 112, height: 112, imageRendering: 'pixelated', transform: feedback === 'ok' ? 'scale(1.15)' : 'none', transition: 'transform 0.2s' }} />

    {mode === 'letter' ? (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <p style={{ ...mono, color: '#fff', fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
          {isPt ? 'Onde está a letra' : 'Where is the letter'} <span style={{ fontSize: '2.2rem', color: '#facc15' }}>{target}</span>?
        </p>
        <button onClick={() => speakLine(isPt ? `Onde está a letra ${target}?` : `Where is the letter ${target}?`, gameLang)}
          aria-label={isPt ? 'Ouvir de novo' : 'Hear again'}
          style={{ border: 'none', background: 'transparent', fontSize: '1.7rem', cursor: 'pointer' }}>🔊</button>
      </div>
    ) : (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <p style={{ ...mono, color: '#fff', fontSize: '2.5rem', fontWeight: 800, letterSpacing: '0.15em', margin: 0 }}>
          {word.split('').map((l, i) => (i === gapIndex ? (feedback === 'ok' ? l : '_') : l)).join('')}
        </p>
        <button onClick={() => speakLine(word, gameLang)} aria-label={isPt ? 'Ouvir a palavra' : 'Hear the word'}
          style={{ border: 'none', background: 'transparent', fontSize: '1.7rem', cursor: 'pointer' }}>🔊</button>
      </div>
    )}

    {feedback && (
      <p style={{ ...mono, fontSize: '1.7rem', fontWeight: 800, color: feedback === 'ok' ? '#a3e635' : '#f87171', margin: 0 }}>
        {feedback === 'ok' ? (isPt ? 'Isso! 🎉' : 'Yes! 🎉') : (isPt ? `Era ${target}! 💜` : `It was ${target}! 💜`)}
      </p>
    )}

    {/* Alvos grandes (≥75px) e com folga — NN/g pré-leitores */}
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${mode === 'letter' ? 3 : 2}, 1fr)`, gap: 14 }}>
      {options.map(l => (
        <button key={l} onClick={() => pick(l)} disabled={!!feedback}
          style={{ ...mono, width: 96, height: 96, borderRadius: 22, border: 'none', background: '#4c1d95', color: '#fff', fontSize: '2.4rem', fontWeight: 800, cursor: 'pointer' }}>
          {l}
        </button>
      ))}
    </div>
  </>);
}
