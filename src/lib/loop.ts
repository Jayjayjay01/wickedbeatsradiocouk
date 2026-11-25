import { signal, updateSignal } from "./signal";
import { fxState } from "./fx";

/** One shared requestAnimationFrame loop for every canvas/visual. */
type Fn = (t: number, dt: number) => void;
const listeners = new Set<Fn>();
let raf = 0;
let last = 0;
let running = false;
let skip = false;
let slowTime = 0;

export function addFrame(fn: Fn) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

function frame(now: number) {
  raf = requestAnimationFrame(frame);
  const dt = last ? Math.min(0.1, (now - last) / 1000) : 0.016;
  // Throttle to ~30fps when nothing is playing
  if (!signal.playing) {
    skip = !skip;
    if (skip) return;
  }
  last = now;
  // Adaptive quality: drop tier once if frames stay slow for 2s; never go back up.
  if (!fxState.lowTier && signal.playing) {
    if (dt > 0.024) {
      slowTime += dt;
      if (slowTime > 2) fxState.lowTier = true;
    } else slowTime = Math.max(0, slowTime - dt * 0.5);
  }
  const t = now / 1000;
  updateSignal(t);
  listeners.forEach((fn) => fn(t, dt));
}

export function startLoop() {
  if (running) return;
  running = true;
  last = 0;
  raf = requestAnimationFrame(frame);
}
export function stopLoop() {
  running = false;
  cancelAnimationFrame(raf);
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopLoop();
    else if (listeners.size) startLoop();
  });
}
