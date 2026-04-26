import { SONGS, Song } from "./songs";

let aCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let reverbGain: GainNode | null = null;
let noteQueue: OscillatorNode[] = [];
let stopFlag = false;
let loopTimeout: ReturnType<typeof setTimeout> | null = null;

function getCtx() {
  if (!aCtx) {
    aCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    masterGain = aCtx.createGain();
    masterGain.gain.value = 0.6;

    // Reverb-like delay
    const delay = aCtx.createDelay(0.5);
    delay.delayTime.value = 0.2;
    reverbGain = aCtx.createGain();
    reverbGain.gain.value = 0.25;

    // LPF for warmth
    const lpf = aCtx.createBiquadFilter();
    lpf.type = "lowpass";
    lpf.frequency.value = 2000;
    lpf.Q.value = 0.7;

    masterGain.connect(lpf);
    lpf.connect(aCtx.destination);
    masterGain.connect(delay);
    delay.connect(reverbGain);
    reverbGain.connect(aCtx.destination);
  }
  return aCtx;
}

function playNote(ctx: AudioContext, freq: number, startTime: number, duration: number) {
  const vol = 0.15;

  // Main sine
  const osc1 = ctx.createOscillator();
  const g1 = ctx.createGain();
  osc1.type = "sine";
  osc1.frequency.setValueAtTime(freq, startTime);

  // Smooth ADSR envelope
  const attack = Math.min(0.12, duration * 0.15);
  const release = Math.min(0.15, duration * 0.2);
  g1.gain.setValueAtTime(0.001, startTime);
  g1.gain.linearRampToValueAtTime(vol, startTime + attack);
  g1.gain.setValueAtTime(vol * 0.8, startTime + duration * 0.4);
  g1.gain.exponentialRampToValueAtTime(0.001, startTime + duration - 0.01);

  osc1.connect(g1);
  g1.connect(masterGain!);
  osc1.start(startTime);
  osc1.stop(startTime + duration);
  noteQueue.push(osc1);

  // Warm harmonic (triangle 1 octave up, very quiet)
  const osc2 = ctx.createOscillator();
  const g2 = ctx.createGain();
  osc2.type = "triangle";
  osc2.frequency.setValueAtTime(freq * 2, startTime);
  g2.gain.setValueAtTime(0.001, startTime);
  g2.gain.linearRampToValueAtTime(vol * 0.08, startTime + attack);
  g2.gain.exponentialRampToValueAtTime(0.001, startTime + duration - 0.01);
  osc2.connect(g2);
  g2.connect(masterGain!);
  osc2.start(startTime);
  osc2.stop(startTime + duration);
  noteQueue.push(osc2);

  // Sub bass (1 octave down, very subtle)
  const osc3 = ctx.createOscillator();
  const g3 = ctx.createGain();
  osc3.type = "sine";
  osc3.frequency.setValueAtTime(freq / 2, startTime);
  g3.gain.setValueAtTime(0.001, startTime);
  g3.gain.linearRampToValueAtTime(vol * 0.05, startTime + attack);
  g3.gain.exponentialRampToValueAtTime(0.001, startTime + duration - 0.01);
  osc3.connect(g3);
  g3.connect(masterGain!);
  osc3.start(startTime);
  osc3.stop(startTime + duration);
  noteQueue.push(osc3);
}

function scheduleSongLoop(songIdx: number) {
  if (stopFlag || songIdx < 0) return;
  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume();

  const song = SONGS[songIdx];
  const beatSec = 60 / song.bpm;
  const now = ctx.currentTime + 0.05;

  let t = now;
  let totalDur = 0;
  song.notes.forEach(([freq, beats]) => {
    const dur = beats * beatSec;
    if (freq > 0) playNote(ctx, freq, t, dur * 0.95); // slight gap between notes
    t += dur;
    totalDur += dur;
  });

  const loopDelay = (t - ctx.currentTime) * 1000 - 200;
  loopTimeout = setTimeout(() => {
    if (!stopFlag) {
      noteQueue = [];
      scheduleSongLoop(songIdx);
    }
  }, Math.max(100, loopDelay));
}

export function playSong(idx: number) {
  stopSong();
  setTimeout(() => {
    stopFlag = false;
    const ctx = getCtx();
    if (ctx.state === "suspended") {
      ctx.resume().then(() => scheduleSongLoop(idx));
    } else {
      scheduleSongLoop(idx);
    }
  }, 80);
}

export function stopSong() {
  stopFlag = true;
  if (loopTimeout) clearTimeout(loopTimeout);
  noteQueue.forEach(o => { try { o.stop(0); } catch { } });
  noteQueue = [];
}

export function pauseSong() {
  stopFlag = true;
  if (loopTimeout) clearTimeout(loopTimeout);
  noteQueue.forEach(o => { try { o.stop(0); } catch { } });
  noteQueue = [];
  if (aCtx && aCtx.state === "running") aCtx.suspend();
}

export function resumeSong(idx: number) {
  stopFlag = false;
  const ctx = getCtx();
  if (ctx.state === "suspended") {
    ctx.resume().then(() => scheduleSongLoop(idx));
  } else {
    scheduleSongLoop(idx);
  }
}
