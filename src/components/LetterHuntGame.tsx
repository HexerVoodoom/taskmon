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
 */
const ROUNDS = 8;
const HIT_BITS = 2;
const ALPHABET = 'ABCDEFGHIJLMNOPRSTUV';

const WORDS_PT = ['GATO', 'BOLA', 'CASA', 'PATO', 'LUA', 'SAPO', 'MALA', 'PIPA', 'FADA', 'REI', 'SOL', 'UVA'];
const WORDS_EN = ['CAT', 'BALL', 'HOME', 'DUCK', 'MOON', 'FROG', 'BAG', 'KITE', 'STAR', 'KING', 'SUN', 'FISH'];

function speakLine(text: string, language: Language) {
  try {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = language === 'pt-BR' ? 'pt-BR' : 'en-US';
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
  const isPt = language === 'pt-BR';
  const mono = { fontFamily: 'monospace' as const };
  const myPet = (PETS[eggType as PetType] ? eggType : 'vix') as PetType;

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
      speakLine(isPt ? `Onde está a letra ${t}?` : `Where is the letter ${t}?`, language);
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
      speakLine(w, language);
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
      speakLine(isPt ? 'Isso!' : 'Yes!', language);
    } else {
      playDegenerate();
      speakLine(isPt ? `Era a letra ${target}` : `It was the letter ${target}`, language);
    }
    setTimeout(() => {
      const next = round + 1;
      if (next >= ROUNDS) { setDone(true); playFeed(); }
      else { setRound(next); newRound(mode!); }
    }, 1200);
  };

  const panel = (children: React.ReactNode) => (
    <div style={{ position: 'fixed', inset: 0, zIndex: 120, background: '#1e1b4b', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16, gap: 14 }} className="tk-keep-mono">
      <button onClick={onExit} aria-label={isPt ? 'Sair' : 'Exit'} style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 32, height: 32, color: '#fff', fontWeight: 800, cursor: 'pointer' }}>✕</button>
      {children}
    </div>
  );

  if (!mode) {
    return panel(<>
      <span style={{ fontSize: '2.4rem' }}>🔤</span>
      <h2 style={{ ...mono, color: '#c4b5fd', fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>{isPt ? 'Caça-Letras' : 'Letter Hunt'}</h2>
      <p style={{ ...mono, color: '#ddd6fe', fontSize: '0.8rem', textAlign: 'center', maxWidth: 300, margin: 0 }}>
        {isPt ? 'Ouça e ache a letra! Seu pet comemora cada acerto.' : 'Listen and find the letter! Your pet celebrates every hit.'}
      </p>
      <button onClick={() => start('letter')} style={{ ...mono, minWidth: 240, minHeight: 64, borderRadius: 16, border: 'none', background: '#7c3aed', color: '#fff', fontSize: '1rem', fontWeight: 800, cursor: 'pointer' }}>
        🐣 {isPt ? 'Achar a letra' : 'Find the letter'}
      </button>
      <button onClick={() => start('word')} style={{ ...mono, minWidth: 240, minHeight: 64, borderRadius: 16, border: 'none', background: '#5b21b6', color: '#fff', fontSize: '1rem', fontWeight: 800, cursor: 'pointer' }}>
        🦸 {isPt ? 'Completar a palavra' : 'Complete the word'}
      </button>
    </>);
  }

  if (done) {
    return panel(<>
      <span style={{ fontSize: '2.4rem' }}>🎉</span>
      <h2 style={{ ...mono, color: '#c4b5fd', fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>{isPt ? 'Caça encerrada!' : 'Hunt over!'}</h2>
      <p style={{ ...mono, color: '#ddd6fe', fontSize: '0.95rem', margin: 0 }}>
        {isPt ? `${hits}/${ROUNDS} letras certas · +${hits * HIT_BITS} Bits` : `${hits}/${ROUNDS} letters right · +${hits * HIT_BITS} Bits`}
      </p>
      <button onClick={() => setMode(null)} style={{ ...mono, minWidth: 200, minHeight: 52, borderRadius: 14, border: 'none', background: '#7c3aed', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>
        {isPt ? 'Jogar de novo' : 'Play again'}
      </button>
    </>);
  }

  return panel(<>
    <p style={{ ...mono, color: '#ddd6fe', fontSize: '0.75rem', margin: 0 }}>{isPt ? 'Rodada' : 'Round'} {round + 1}/{ROUNDS} · ⭐ {hits}</p>

    <img src={getSpriteForStage(`${myPet}-1`)} alt="" style={{ width: 84, height: 84, imageRendering: 'pixelated', transform: feedback === 'ok' ? 'scale(1.15)' : 'none', transition: 'transform 0.2s' }} />

    {mode === 'letter' ? (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <p style={{ ...mono, color: '#fff', fontSize: '1rem', fontWeight: 800, margin: 0 }}>
          {isPt ? 'Onde está a letra' : 'Where is the letter'} <span style={{ fontSize: '1.8rem', color: '#facc15' }}>{target}</span>?
        </p>
        <button onClick={() => speakLine(isPt ? `Onde está a letra ${target}?` : `Where is the letter ${target}?`, language)}
          aria-label={isPt ? 'Ouvir de novo' : 'Hear again'}
          style={{ border: 'none', background: 'transparent', fontSize: '1.2rem', cursor: 'pointer' }}>🔊</button>
      </div>
    ) : (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <p style={{ ...mono, color: '#fff', fontSize: '2rem', fontWeight: 800, letterSpacing: '0.15em', margin: 0 }}>
          {word.split('').map((l, i) => (i === gapIndex ? (feedback === 'ok' ? l : '_') : l)).join('')}
        </p>
        <button onClick={() => speakLine(word, language)} aria-label={isPt ? 'Ouvir a palavra' : 'Hear the word'}
          style={{ border: 'none', background: 'transparent', fontSize: '1.2rem', cursor: 'pointer' }}>🔊</button>
      </div>
    )}

    {feedback && (
      <p style={{ ...mono, fontSize: '1.3rem', fontWeight: 800, color: feedback === 'ok' ? '#a3e635' : '#f87171', margin: 0 }}>
        {feedback === 'ok' ? (isPt ? 'Isso! 🎉' : 'Yes! 🎉') : (isPt ? `Era ${target}! 💜` : `It was ${target}! 💜`)}
      </p>
    )}

    {/* Alvos grandes (≥75px) e com folga — NN/g pré-leitores */}
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${mode === 'letter' ? 3 : 2}, 1fr)`, gap: 12 }}>
      {options.map(l => (
        <button key={l} onClick={() => pick(l)} disabled={!!feedback}
          style={{ ...mono, width: 84, height: 84, borderRadius: 20, border: 'none', background: '#4c1d95', color: '#fff', fontSize: '2rem', fontWeight: 800, cursor: 'pointer' }}>
          {l}
        </button>
      ))}
    </div>
  </>);
}
