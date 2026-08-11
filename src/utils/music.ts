// Looping background music for minigames — separate from utils/sounds.ts
// (whose `play()` helper spins up a throwaway AudioContext per one-shot
// effect and closes it 2s later, which doesn't fit a track that has to
// keep looping for the whole round). Procedural Web Audio, no audio files:
// a little 4-bar loop rescheduled via setInterval every time it ends.
import { isMuted } from './sounds';

type AnyWindow = typeof window & { webkitAudioContext?: typeof AudioContext };

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let loopTimer: ReturnType<typeof setInterval> | null = null;
let activeTrack: 'flower' | 'werewolf' | null = null;

function ensureCtx(): AudioContext {
  if (!ctx || ctx.state === 'closed') {
    const w = window as AnyWindow;
    ctx = new (window.AudioContext || w.webkitAudioContext!)();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.16;
    masterGain.connect(ctx.destination);
  }
  return ctx;
}

function tone(c: AudioContext, dest: AudioNode, freq: number, time: number, dur: number, type: OscillatorType, vol: number): void {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, time);
  osc.connect(g);
  g.connect(dest);
  g.gain.setValueAtTime(0, time);
  g.gain.linearRampToValueAtTime(vol, time + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  osc.start(time);
  osc.stop(time + dur + 0.03);
}

function noiseHit(c: AudioContext, dest: AudioNode, time: number, dur: number, vol: number, filterFreq: number): void {
  const bufferSize = Math.ceil(c.sampleRate * dur);
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filt = c.createBiquadFilter();
  filt.type = 'highpass';
  filt.frequency.value = filterFreq;
  const g = c.createGain();
  g.gain.setValueAtTime(vol, time);
  g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  src.connect(filt);
  filt.connect(g);
  g.connect(dest);
  src.start(time);
  src.stop(time + dur + 0.02);
}

function kick(c: AudioContext, dest: AudioNode, time: number, vol: number): void {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(140, time);
  osc.frequency.exponentialRampToValueAtTime(45, time + 0.14);
  g.gain.setValueAtTime(vol, time);
  g.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);
  osc.connect(g);
  g.connect(dest);
  osc.start(time);
  osc.stop(time + 0.2);
}

// ── 🌸 Flower Catch — cute music-box loop (C major pentatonic, bright bells) ──
const FLOWER_STEP = 0.22; // seconds/8th note (~136bpm)
const FLOWER_MELODY = [523.25, 659.25, 783.99, 659.25, 880.00, 783.99, 659.25, 587.33,
                        523.25, 587.33, 659.25, 783.99, 659.25, 523.25, 587.33, 523.25];
const FLOWER_BASS = [261.63, 261.63, 392.00, 392.00, 329.63, 329.63, 392.00, 392.00];

function scheduleFlowerLoop(c: AudioContext, dest: AudioNode, startTime: number): void {
  FLOWER_MELODY.forEach((freq, i) => {
    tone(c, dest, freq, startTime + i * FLOWER_STEP, FLOWER_STEP * 0.85, 'triangle', 0.5);
  });
  FLOWER_BASS.forEach((freq, i) => {
    tone(c, dest, freq, startTime + i * FLOWER_STEP * 2, FLOWER_STEP * 1.8, 'sine', 0.28);
  });
}

// ── 🐺 Werewolf Run — driving E-minor power-chord riff + drums ──────────────
const ROCK_STEP = 0.155; // seconds/8th note (~193bpm, galloping feel)
const E2 = 82.41, G2 = 98.00, A2 = 110.00, B2 = 123.47, E3 = 164.81;
const ROCK_RIFF = [E2, E3, E2, E3, G2, E3, E2, E3, A2, E3, E2, E3, B2, A2, G2, E2];

function distortionCurve(amount: number): Float32Array {
  const n = 256;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = ((3 + amount) * x * 20 * (Math.PI / 180)) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

function scheduleWerewolfLoop(c: AudioContext, dest: AudioNode, startTime: number): void {
  const shaper = c.createWaveShaper();
  shaper.curve = distortionCurve(55) as Float32Array<ArrayBuffer>;
  shaper.oversample = '2x';
  shaper.connect(dest);

  ROCK_RIFF.forEach((freq, i) => {
    const t = startTime + i * ROCK_STEP;
    tone(c, shaper, freq, t, ROCK_STEP * 0.92, 'sawtooth', 0.34);
    tone(c, shaper, freq * 1.5, t, ROCK_STEP * 0.92, 'square', 0.14); // fifth on top, power-chord grit
  });

  // Drums: kick on 1 & 9, snare (noise) on 5 & 13, hats every step
  for (let i = 0; i < 16; i++) {
    const t = startTime + i * ROCK_STEP;
    noiseHit(c, dest, t, 0.05, 0.06, 6000);
    if (i === 0 || i === 8) kick(c, dest, t, 0.55);
    if (i === 4 || i === 12) noiseHit(c, dest, t, 0.14, 0.32, 1200);
  }
}

function loopDuration(track: 'flower' | 'werewolf'): number {
  return track === 'flower' ? FLOWER_MELODY.length * FLOWER_STEP : ROCK_RIFF.length * ROCK_STEP;
}

function startTrack(track: 'flower' | 'werewolf'): void {
  if (isMuted()) return;
  stopMusic();
  activeTrack = track;
  try {
    const c = ensureCtx();
    const dest = masterGain!;
    const schedule = track === 'flower' ? scheduleFlowerLoop : scheduleWerewolfLoop;
    const dur = loopDuration(track);
    schedule(c, dest, c.currentTime + 0.05);
    loopTimer = setInterval(() => {
      if (!ctx || activeTrack !== track) return;
      schedule(c, dest, c.currentTime + 0.05);
    }, dur * 1000);
  } catch {
    // AudioContext blocked (no user gesture yet) — silently skip music
  }
}

export function startFlowerMusic(): void { startTrack('flower'); }
export function startWerewolfMusic(): void { startTrack('werewolf'); }

export function stopMusic(): void {
  activeTrack = null;
  if (loopTimer) { clearInterval(loopTimer); loopTimer = null; }
  if (masterGain && ctx) {
    const c = ctx;
    const g = masterGain;
    const now = c.currentTime;
    g.gain.cancelScheduledValues(now);
    g.gain.setValueAtTime(g.gain.value, now);
    g.gain.linearRampToValueAtTime(0, now + 0.15);
    setTimeout(() => { c.close().catch(() => {}); if (ctx === c) ctx = null; masterGain = null; }, 200);
  }
}
