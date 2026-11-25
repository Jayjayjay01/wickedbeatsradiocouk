import { useEffect, useRef } from "react";
import { CONFIG, PALETTE } from "@/config";
import { addFrame, startLoop } from "@/lib/loop";
import { fxState } from "@/lib/fx";

/**
 * Festive snowfall on every page.
 * Fixed canvas above the content (never clickable), pooled flakes,
 * driven by the single shared RAF loop. Calm mode freezes the flakes.
 */
export function Snow() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!CONFIG.CHRISTMAS.ENABLED) return;
    const c = ref.current!;
    const g = c.getContext("2d")!;
    const mobile = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768;
    const DPR = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
    let W = 0, H = 0;

    const MAX = mobile ? 70 : 150;
    const flakes = Array.from({ length: MAX }, () => ({ x: 0, y: 0, z: 0, r: 1, speed: 0, drift: 0, ph: 0, a: 1 }));
    const reset = (f: (typeof flakes)[number], anywhere = true) => {
      f.x = Math.random() * W;
      f.y = anywhere ? Math.random() * H : -8;
      f.z = Math.random();
      f.r = 1 + f.z * 2.4;
      f.speed = 22 + f.z * 46;
      f.drift = 12 + f.z * 26;
      f.ph = Math.random() * 6.283;
      f.a = 0.3 + f.z * 0.55;
    };

    // Soft flake sprite, drawn once.
    const sprite = document.createElement("canvas");
    sprite.width = sprite.height = 32;
    const sg = sprite.getContext("2d")!;
    const grad = sg.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, PALETTE.white);
    grad.addColorStop(0.4, PALETTE.white + "cc");
    grad.addColorStop(1, PALETTE.white + "00");
    sg.fillStyle = grad;
    sg.fillRect(0, 0, 32, 32);

    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      c.width = W * DPR;
      c.height = H * DPR;
      c.style.width = W + "px";
      c.style.height = H + "px";
      g.setTransform(DPR, 0, 0, DPR, 0, 0);
      flakes.forEach((f) => reset(f));
    };
    resize();
    window.addEventListener("resize", resize);

    const tick = (t: number, dt: number) => {
      g.clearRect(0, 0, W, H);
      const calm = fxState.calm;
      const count = fxState.lowTier ? (MAX * 0.6) | 0 : MAX;
      for (let i = 0; i < count; i++) {
        const f = flakes[i]!;
        if (!calm) {
          f.y += f.speed * dt;
          f.x += Math.sin(t * 0.6 + f.ph) * f.drift * dt;
          if (f.y > H + 10) reset(f, false);
          if (f.x < -12) f.x = W + 10;
          else if (f.x > W + 12) f.x = -10;
        }
        const size = f.r * 4;
        g.globalAlpha = f.a;
        g.drawImage(sprite, f.x - size / 2, f.y - size / 2, size, size);
      }
      g.globalAlpha = 1;
    };
    const remove = addFrame(tick);
    startLoop();

    return () => {
      remove();
      window.removeEventListener("resize", resize);
    };
  }, []);

  if (!CONFIG.CHRISTMAS.ENABLED) return null;
  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-30" />;
}
