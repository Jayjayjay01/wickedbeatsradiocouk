/**
 * Shared audio signal, updated once per frame by the main loop.
 * Reads from a real AnalyserNode when available, otherwise a procedural
 * signal (layered sines + 128 BPM kick) so visuals always look alive.
 */
export const BINS = 512;
export const signal = {
  freq: new Uint8Array(BINS),
  wave: new Uint8Array(BINS * 2),
  bass: 0,
  mid: 0,
  high: 0,
  energy: 0,
  beat: 0,
  beatCount: 0,
  strong: false,
  lastBeat: 0,
  playing: false,
  real: false,
  zeroFrames: 0,
};

let analyser: AnalyserNode | null = null;
export function setAnalyser(a: AnalyserNode | null) {
  analyser = a;
  signal.real = !!a;
}

const HIST = 60;
const hist = new Float32Array(HIST);
let hi = 0;

function fake(t: number, amp: number) {
  const beatLen = 60 / 128;
  const ph = (t % beatLen) / beatLen;
  const kick = Math.exp(-ph * 9) * amp;
  const hat = Math.exp(-(((t + beatLen / 2) % beatLen) / beatLen) * 14) * amp;
  for (let i = 0; i < BINS; i++) {
    const f = i / BINS;
    const fall = Math.pow(1 - f, 1.6);
    let v =
      (0.35 + 0.25 * Math.sin(t * 1.7 + i * 0.09) + 0.15 * Math.sin(t * 0.6 - i * 0.031)) * fall * amp;
    if (i < 14) v += kick * (1 - i / 14) * 0.95;
    if (i > 180 && i < 320) v += hat * 0.35 * (0.6 + 0.4 * Math.sin(i * 0.4 + t * 3));
    signal.freq[i] = Math.max(0, Math.min(255, v * 255));
  }
  const W = BINS * 2;
  for (let i = 0; i < W; i++) {
    const x = i / W;
    const v =
      Math.sin(x * 22 + t * 4) * 0.35 + Math.sin(x * 57 - t * 7) * 0.15 + Math.sin(x * 9 + t) * 0.2;
    signal.wave[i] = 128 + v * (30 + kick * 70) * amp;
  }
}

export function updateSignal(t: number) {
  if (signal.playing && analyser) {
    analyser.getByteFrequencyData(signal.freq);
    analyser.getByteTimeDomainData(signal.wave);
    let s = 0;
    for (let i = 0; i < 64; i++) s += signal.freq[i];
    signal.zeroFrames = s === 0 ? signal.zeroFrames + 1 : 0;
  } else if (signal.playing) {
    fake(t, 1);
  } else {
    fake(t * 0.35, 0.18 + 0.1 * Math.sin(t * 0.8));
  }

  let b = 0, m = 0, h = 0;
  for (let i = 0; i < 8; i++) b += signal.freq[i];
  for (let i = 8; i < 90; i++) m += signal.freq[i];
  for (let i = 90; i < 300; i++) h += signal.freq[i];
  b /= 8 * 255;
  m /= 82 * 255;
  h /= 210 * 255;
  signal.bass += (b - signal.bass) * 0.5;
  signal.mid += (m - signal.mid) * 0.3;
  signal.high += (h - signal.high) * 0.3;
  signal.energy = signal.bass * 0.5 + signal.mid * 0.35 + signal.high * 0.15;

  let avg = 0;
  for (let i = 0; i < HIST; i++) avg += hist[i];
  avg /= HIST;
  hist[hi] = b;
  hi = (hi + 1) % HIST;

  signal.beat *= 0.9;
  signal.strong = false;
  if (signal.playing && b > avg * 1.3 && b > 0.35 && t - signal.lastBeat > 0.28) {
    signal.beat = 1;
    signal.beatCount++;
    signal.lastBeat = t;
    signal.strong = b > 0.78 && b > avg * 1.55;
  }
}
