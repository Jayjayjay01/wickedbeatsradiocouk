import { useEffect, useRef } from "react";
import { PALETTE } from "@/config";
import { addFrame, startLoop } from "@/lib/loop";
import { fxState, on } from "@/lib/fx";
import { BINS, signal } from "@/lib/signal";

/**
 * Background star field + music visualiser.
 * Two fixed canvases, driven by the single shared RAF loop.
 * All particles are pooled; nothing is allocated per frame.
 */

const STAR_COLORS = [PALETTE.white, PALETTE.white, PALETTE.white, PALETTE.pink, PALETTE.pink, PALETTE.violet, PALETTE.cyan, PALETTE.blue, PALETTE.yellow];
const SPARK_COLORS = [PALETTE.pink, PALETTE.pink, PALETTE.white, PALETTE.violet, PALETTE.cyan, PALETTE.yellow, PALETTE.orange, PALETTE.green];

function sprite(color: string, size = 32) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gr.addColorStop(0, color);
  gr.addColorStop(0.25, color + "aa");
  gr.addColorStop(1, color + "00");
  g.fillStyle = gr;
  g.fillRect(0, 0, size, size);
  return c;
}

// Hue LUT: hsl strings pre-built so the frame loop never builds strings.
const LUT: string[] = [];
const LUT_A: string[] = [];
for (let h = 0; h < 360; h++) {
  LUT.push(`hsl(${h} 100% 60%)`);
  LUT_A.push(`hsla(${h} 100% 60% / 0.35)`);
}
/** frequency position 0..1 -> hue: bass pink(330) -> magenta -> violet -> blue -> cyan(185) */
const hueFor = (f: number, off: number) => ((330 - f * 145 + off) % 360 + 360) % 360 | 0;

export function Scene() {
  const starsRef = useRef<HTMLCanvasElement>(null);
  const visRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const sc = starsRef.current!;
    const vc = visRef.current!;
    const s = sc.getContext("2d")!;
    const v = vc.getContext("2d")!;
    const mobile = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768;
    const DPR = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
    let W = 0, H = 0;

    const sprites: Record<string, HTMLCanvasElement> = {};
    for (const c of new Set([...STAR_COLORS, ...SPARK_COLORS])) sprites[c] = sprite(c);

    // ---- Stars pool ----
    const MAXS = mobile ? 90 : 220;
    const stars = Array.from({ length: MAXS }, () => ({ x: 0, y: 0, px: 0, py: 0, z: 0, r: 1, c: PALETTE.white, tw: 1, ph: 0, glow: false, ox: 0, oy: 0 }));
    const resetStar = (st: (typeof stars)[number], anywhere = true) => {
      st.x = anywhere ? Math.random() * W : W / 2 + (Math.random() - 0.5) * W * 0.2;
      st.y = anywhere ? Math.random() * H : H / 2 + (Math.random() - 0.5) * H * 0.2;
      st.px = st.x; st.py = st.y;
      st.z = (Math.random() * 3) | 0;
      st.r = 0.4 + Math.random() * (0.6 + st.z * 0.6);
      st.c = STAR_COLORS[(Math.random() * STAR_COLORS.length) | 0];
      st.tw = 0.5 + Math.random() * 3;
      st.ph = Math.random() * 6.28;
      st.glow = Math.random() < 0.18;
      st.ox = st.oy = 0;
    };

    // ---- Sparks pool ----
    const MAXP = mobile ? 120 : 260;
    const sparks = Array.from({ length: MAXP }, () => ({ x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, c: PALETTE.pink, r: 2, g: 0 }));
    let sp = 0;
    const spawnSparks = (x: number, y: number, n: number, confetti = false) => {
      if (fxState.calm) n = Math.min(n, 8);
      for (let i = 0; i < n; i++) {
        const p = sparks[sp];
        sp = (sp + 1) % MAXP;
        const a = Math.random() * 6.283;
        const sp2 = (confetti ? 3 : 1.5) + Math.random() * (confetti ? 6 : 5);
        p.x = x; p.y = y;
        p.vx = Math.cos(a) * sp2 * 60;
        p.vy = Math.sin(a) * sp2 * 60 - (confetti ? 200 : 0);
        p.max = p.life = 0.6 + Math.random() * 0.8;
        p.c = confetti ? (Math.random() < 0.6 ? PALETTE.pink : PALETTE.white) : SPARK_COLORS[(Math.random() * SPARK_COLORS.length) | 0];
        p.r = confetti ? 3 : 1.5 + Math.random() * 2.5;
        p.g = confetti ? 500 : 120;
      }
    };

    // ---- Shooting stars ----
    const shooters = Array.from({ length: 4 }, () => ({ x: 0, y: 0, vx: 0, vy: 0, life: 0 }));
    const spawnShooter = () => {
      const sh = shooters.find((q) => q.life <= 0);
      if (!sh) return;
      sh.x = Math.random() * W * 0.7;
      sh.y = Math.random() * H * 0.3;
      const sp3 = 900 + Math.random() * 600;
      sh.vx = sp3 * 0.85; sh.vy = sp3 * 0.5;
      sh.life = 0.7;
    };

    // ---- Rings (shockwaves / beat rings) ----
    const rings = Array.from({ length: 8 }, () => ({ x: 0, y: 0, r: 0, life: 0, max: 1, w: 2, c: PALETTE.pink }));
    const spawnRing = (x: number, y: number, max = 0.9, w = 3, c = PALETTE.pink) => {
      const rg = rings.find((q) => q.life <= 0) ?? rings[0];
      rg.x = x; rg.y = y; rg.r = 20; rg.life = rg.max = max; rg.w = w; rg.c = c;
    };

    // ---- Cursor trail ----
    const TRAIL = 18;
    const trail = Array.from({ length: TRAIL }, () => ({ x: -99, y: -99 }));
    let ti = 0;
    let mx = -9999, my = -9999, pmx = 0, pmy = 0;

    const resize = () => {
      W = window.innerWidth; H = window.innerHeight;
      for (const c of [sc, vc]) {
        c.width = W * DPR; c.height = H * DPR;
        c.style.width = W + "px"; c.style.height = H + "px";
      }
      s.setTransform(DPR, 0, 0, DPR, 0, 0);
      v.setTransform(DPR, 0, 0, DPR, 0, 0);
      stars.forEach((st) => resetStar(st));
      buildStripe();
    };

    // Skyline gap pattern (cut segments into bars with one fill)
    let stripe: CanvasPattern | null = null;
    function buildStripe() {
      const c = document.createElement("canvas");
      c.width = 4; c.height = 7;
      const g = c.getContext("2d")!;
      g.fillStyle = "#000";
      g.fillRect(0, 5, 4, 2);
      stripe = v.createPattern(c, "repeat");
    }

    resize();
    window.addEventListener("resize", resize);

    const onMove = (e: PointerEvent) => { mx = e.clientX; my = e.clientY; };
    const onDown = (e: PointerEvent) => spawnSparks(e.clientX, e.clientY, 22);
    const onLeave = () => { mx = my = -9999; };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    let warp = 0;
    let flash = 0;
    let lastFlash = 0;
    const offs = [
      on("warp", () => { if (!fxState.calm) warp = 1.2; }),
      on("shockwave", (d) => {
        if (fxState.calm) return;
        spawnRing(d.x, d.y, 1.1, 6);
        spawnRing(d.x, d.y, 0.8, 2, PALETTE.white);
        const now = performance.now();
        if (now - lastFlash > 400) { flash = 0.5; lastFlash = now; }
      }),
      on("sparks", (d) => spawnSparks(d.x, d.y, d.n ?? 30, d.confetti)),
      on("vismode", () => { mode = (mode + 1) % 3; modeAt = performance.now() / 1000; prevMode = (mode + 2) % 3; }),
    ];

    let mode = 0, prevMode = 2, modeAt = -10;
    let lastBeatSeen = 0;
    let lastShake = 0;
    let scrollY = window.scrollY;
    const onScroll = () => { scrollY = window.scrollY; };
    window.addEventListener("scroll", onScroll, { passive: true });

    // ---------------- Draw: stars layer ----------------
    const drawStars = (t: number, dt: number) => {
      s.clearRect(0, 0, W, H);
      const low = fxState.lowTier;
      const count = low ? (MAXS * 0.5) | 0 : MAXS;
      const calm = fxState.calm;
      const cx = W / 2, cy = H / 2;
      const pxm = (mx > -999 ? (mx - cx) / W : 0), pym = (my > -999 ? (my - cy) / H : 0);
      const w = warp > 0 ? Math.min(1, warp) : 0;
      if (warp > 0) warp -= dt;

      for (let i = 0; i < count; i++) {
        const st = stars[i];
        const depth = (st.z + 1) / 3;
        st.px = st.x; st.py = st.y;
        // drift + warp
        st.y += dt * 4 * depth;
        if (w > 0) {
          const k = 1 + w * 5 * depth;
          st.x += (st.x - cx) * dt * k;
          st.y += (st.y - cy) * dt * k;
        }
        // mouse repulsion
        if (!calm && mx > -999) {
          const dx = st.x + st.ox - mx, dy = st.y + st.oy - my;
          const d2 = dx * dx + dy * dy;
          if (d2 < 16000) {
            const f = (1 - d2 / 16000) * 60 * dt * depth;
            st.ox += dx * f * 0.08; st.oy += dy * f * 0.08;
          }
        }
        st.ox *= 0.96; st.oy *= 0.96;
        if (st.x < -20 || st.x > W + 20 || st.y < -20 || st.y > H + 20) {
          resetStar(st, w === 0);
          if (w === 0) st.y = -10;
          continue;
        }
        const par = calm ? 0 : depth * 18;
        const x = st.x + st.ox - pxm * par;
        const y = ((st.y + st.oy - pym * par - scrollY * 0.04 * depth) % H + H) % H;
        let a = 0.55 + 0.45 * Math.sin(t * st.tw + st.ph);
        if (!calm && Math.random() < 0.0008) a = 1.6; // random flash
        const r = st.r * (1 + signal.bass * 0.6 * depth);
        if (w > 0.05) {
          s.strokeStyle = st.c;
          s.globalAlpha = Math.min(1, a);
          s.lineWidth = r;
          s.beginPath();
          s.moveTo(x, st.y + st.oy);
          s.lineTo(x - (st.x - st.px) * 6, st.y + st.oy - (st.y - st.py) * 6);
          s.stroke();
        } else if (st.glow && !low) {
          const g = r * 8;
          s.globalAlpha = Math.min(1, a * 0.8);
          s.drawImage(sprites[st.c], x - g / 2, y - g / 2, g, g);
        } else {
          s.globalAlpha = Math.min(1, a);
          s.fillStyle = st.c;
          s.fillRect(x - r / 2, y - r / 2, r, r);
        }
      }

      // Beat-driven shooting stars & rings
      if (signal.beatCount !== lastBeatSeen) {
        lastBeatSeen = signal.beatCount;
        if (!calm && (signal.strong || Math.random() < 0.15)) spawnShooter();
        if (!calm && signal.strong && !low && t - lastShake > 1.6) {
          lastShake = t;
          const html = document.documentElement;
          html.classList.add("fx-shake", "fx-aberr");
          window.setTimeout(() => html.classList.remove("fx-shake", "fx-aberr"), 240);
        }
      }
      s.lineCap = "round";
      for (const sh of shooters) {
        if (sh.life <= 0) continue;
        sh.life -= dt;
        sh.x += sh.vx * dt; sh.y += sh.vy * dt;
        s.globalAlpha = Math.max(0, sh.life / 0.7);
        s.strokeStyle = PALETTE.white;
        s.lineWidth = 2;
        s.beginPath();
        s.moveTo(sh.x, sh.y);
        s.lineTo(sh.x - sh.vx * 0.08, sh.y - sh.vy * 0.08);
        s.stroke();
        s.drawImage(sprites[PALETTE.pink], sh.x - 10, sh.y - 10, 20, 20);
      }

      // Sparks
      for (const p of sparks) {
        if (p.life <= 0) continue;
        p.life -= dt;
        p.vy += p.g * dt;
        p.vx *= 0.98;
        p.x += p.vx * dt; p.y += p.vy * dt;
        s.globalAlpha = Math.max(0, p.life / p.max);
        s.fillStyle = p.c;
        s.fillRect(p.x - p.r / 2, p.y - p.r / 2, p.r, p.r);
      }

      // Rings
      for (const rg of rings) {
        if (rg.life <= 0) continue;
        rg.life -= dt;
        rg.r += dt * Math.max(W, H) * 0.9;
        s.globalAlpha = Math.max(0, rg.life / rg.max) * 0.8;
        s.strokeStyle = rg.c;
        s.lineWidth = rg.w;
        s.beginPath();
        s.arc(rg.x, rg.y, rg.r, 0, 6.283);
        s.stroke();
      }

      // Cursor trail (desktop only)
      if (!mobile && !calm && mx > -999) {
        if (Math.abs(mx - pmx) + Math.abs(my - pmy) > 2) {
          trail[ti].x = mx; trail[ti].y = my;
          ti = (ti + 1) % TRAIL;
          pmx = mx; pmy = my;
        }
        for (let i = 0; i < TRAIL; i++) {
          const q = trail[(ti + i) % TRAIL];
          const k = i / TRAIL;
          s.globalAlpha = k * 0.5;
          const g = 4 + k * 10;
          s.drawImage(sprites[PALETTE.pink], q.x - g / 2, q.y - g / 2, g, g);
        }
      }

      // Soft flash (max ~2/sec, short)
      if (flash > 0) {
        s.globalAlpha = flash;
        s.fillStyle = PALETTE.pink;
        s.fillRect(0, 0, W, H);
        flash -= dt * 2.5;
      }
      s.globalAlpha = 1;
    };

    // ---------------- Draw: visualiser ----------------
    const freq = signal.freq;
    const wave = signal.wave;

    const radial = (t: number, alpha: number, off: number) => {
      const low = fxState.lowTier;
      const N = low ? 48 : 96;
      const cx = W / 2, cy = H * 0.46;
      const R = Math.min(W, H) * 0.17 * (1 + signal.bass * 0.18);
      v.globalAlpha = alpha;
      v.lineCap = "round";
      v.lineWidth = Math.max(2, (R * 6.28) / N * 0.45);
      for (let i = 0; i < N; i++) {
        const f = i / N;
        const bin = (Math.pow(f, 1.4) * BINS * 0.6) | 0;
        const val = freq[bin] / 255;
        const len = 6 + val * R * 1.1;
        const a = f * 6.283 + t * 0.08;
        const ca = Math.cos(a), sa = Math.sin(a);
        v.strokeStyle = val > 0.9 ? (i % 2 ? PALETTE.yellow : PALETTE.orange) : LUT[hueFor(f, off)];
        v.beginPath();
        v.moveTo(cx + ca * R, cy + sa * R);
        v.lineTo(cx + ca * (R + len), cy + sa * (R + len));
        v.stroke();
      }
      // speaker rings
      v.lineWidth = 2;
      for (let k = 0; k < 3; k++) {
        v.globalAlpha = alpha * (0.5 - k * 0.12 + signal.beat * 0.3);
        v.strokeStyle = k === 0 ? PALETTE.pink : "#9A9AA2";
        v.beginPath();
        v.arc(cx, cy, R * (0.9 - k * 0.14) * (1 + signal.beat * 0.05), 0, 6.283);
        v.stroke();
      }
      v.globalAlpha = alpha * (0.3 + signal.bass * 0.5);
      const g = R * 2.2;
      v.drawImage(sprites[PALETTE.pink], cx - g / 2, cy - g / 2, g, g);
    };

    const ribbons = (t: number, alpha: number, off: number) => {
      const low = fxState.lowTier;
      const n = low ? 2 : 4;
      const P = low ? 48 : 80;
      const cols = [LUT[hueFor(0, off)], LUT[hueFor(0.3, off)], LUT[hueFor(0.55, off)], LUT[hueFor(0.95, off)]];
      if (!low) v.globalCompositeOperation = "lighter";
      for (let r = 0; r < n; r++) {
        v.globalAlpha = alpha * 0.75;
        v.strokeStyle = cols[r];
        v.lineWidth = low ? 2 : 2.5 + (r === 0 ? signal.bass * 4 : 0);
        v.beginPath();
        const base = H * (0.35 + r * 0.1);
        const amp = H * (0.12 + signal.energy * 0.3);
        for (let i = 0; i <= P; i++) {
          const x = (i / P) * W;
          const wv = (wave[((i / P) * (wave.length - 1)) | 0] - 128) / 128;
          const y = base + Math.sin(i * 0.12 + t * (0.6 + r * 0.25) + r) * amp * 0.5 + wv * amp * (0.8 - r * 0.12);
          if (i === 0) v.moveTo(x, y);
          else v.lineTo(x, y);
        }
        v.stroke();
      }
      v.globalCompositeOperation = "source-over";
    };

    const skyline = (_t: number, alpha: number, off: number) => {
      const low = fxState.lowTier;
      const N = low ? 32 : 64;
      const base = H * 0.8;
      const bw = W / N;
      for (let i = 0; i < N; i++) {
        const f = i / N;
        const bin = (Math.pow(f, 1.5) * BINS * 0.65) | 0;
        const val = freq[bin] / 255;
        const h = 4 + val * H * 0.38;
        v.fillStyle = val > 0.92 ? PALETTE.yellow : LUT[hueFor(f, off)];
        v.globalAlpha = alpha;
        v.fillRect(i * bw + 1, base - h, bw - 3, h);
        v.globalAlpha = alpha * 0.22;
        v.fillRect(i * bw + 1, base + 3, bw - 3, h * 0.4);
      }
      if (stripe) {
        v.globalAlpha = 1;
        v.globalCompositeOperation = "destination-out";
        v.fillStyle = stripe;
        v.fillRect(0, H * 0.35, W, H * 0.65);
        v.globalCompositeOperation = "source-over";
      }
    };

    const MODES = [radial, ribbons, skyline];

    const drawVis = (t: number) => {
      v.clearRect(0, 0, W, H);
      const off = Math.sin(t * 0.05) * 18; // slow hue rotation, stays pink-anchored
      if (t - modeAt > 30) { prevMode = mode; mode = (mode + 1) % 3; modeAt = t; }
      const fade = Math.min(1, (t - modeAt) / 1.5);
      const base = fxState.calm ? 0.45 : 0.85;
      if (fade < 1) MODES[prevMode](t, (1 - fade) * base, off);
      MODES[mode](t, fade * base, off);
      v.globalAlpha = 1;
    };

    const tick = (t: number, dt: number) => {
      drawStars(t, dt);
      drawVis(t);
    };
    const remove = addFrame(tick);
    startLoop();

    return () => {
      remove();
      offs.forEach((f) => f());
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
      <canvas ref={starsRef} className="absolute inset-0" />
      <canvas ref={visRef} className="absolute inset-0 opacity-70" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,var(--background)_95%)]" />
    </div>
  );
}
