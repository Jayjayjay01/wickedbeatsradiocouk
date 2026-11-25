import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useInView, animate, useMotionValue, useSpring } from "framer-motion";
import logo from "@/assets/logo.jpg.asset.json";
import { addFrame } from "@/lib/loop";
import { signal } from "@/lib/signal";
import { useFx } from "@/lib/fx";
import { cn } from "@/lib/utils";

export const LOGO_SRC = logo.url;

export function Logo({ size = 48, className, eager }: { size?: number; className?: string; eager?: boolean }) {
  return (
    <span className={cn("logo-badge inline-block shrink-0 bg-void", className)} style={{ width: size, height: size }}>
      <img src={logo.url} alt="Wicked Beats Radio logo" width={size} height={size} loading={eager ? "eager" : "lazy"} decoding="async" />
    </span>
  );
}

/** Seeded pseudo-random so SVG shapes are identical on server & client */
function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
}

/** Rough brush-stroke divider at the logo's slant */
export function BrushDivider({ seed = 3, flip = false, className }: { seed?: number; flip?: boolean; className?: string }) {
  const r = rng(seed);
  const pts: string[] = [];
  const N = 60;
  for (let i = 0; i <= N; i++) pts.push(`${(i / N) * 1200},${18 + r() * 10 - (i / N) * 14}`);
  for (let i = N; i >= 0; i--) pts.push(`${(i / N) * 1200},${42 + r() * 12 - (i / N) * 14}`);
  const scratches = Array.from({ length: 14 }, () => {
    const x = r() * 1200;
    return `M${x},${20 + r() * 20} l${40 + r() * 120},${-3 - r() * 4}`;
  }).join(" ");
  return (
    <div aria-hidden className={cn("relative h-16 w-full overflow-hidden", className)} style={{ transform: flip ? "scaleX(-1)" : undefined }}>
      <svg viewBox="0 0 1200 64" preserveAspectRatio="none" className="h-full w-full">
        <polygon points={pts.join(" ")} fill="var(--pink)" opacity="0.9" />
        <path d={scratches} stroke="var(--background)" strokeWidth="2" fill="none" />
        <path d={`M0,52 L1200,40`} stroke="var(--foreground)" strokeWidth="1.5" opacity="0.6" />
      </svg>
    </div>
  );
}

/** Live pink waveform line driven by the audio signal */
export function WaveLine({ className, height = 24 }: { className?: string; height?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!;
    const g = c.getContext("2d")!;
    let w = 0;
    const size = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = c.clientWidth;
      c.width = w * dpr;
      c.height = height * dpr;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(c);
    const off = addFrame(() => {
      g.clearRect(0, 0, w, height);
      g.strokeStyle = "#FF1F8E";
      g.lineWidth = 1.5;
      g.beginPath();
      const P = 90;
      for (let i = 0; i <= P; i++) {
        const x = (i / P) * w;
        const env = Math.sin((i / P) * Math.PI);
        const wv = (signal.wave[(i * 11) % signal.wave.length] - 128) / 128;
        const y = height / 2 + wv * env * height * 0.9;
        if (i) g.lineTo(x, y);
        else g.moveTo(x, y);
      }
      g.stroke();
    });
    return () => {
      off();
      ro.disconnect();
    };
  }, [height]);
  return <canvas ref={ref} aria-hidden className={cn("block w-full", className)} style={{ height }} />;
}

/** Animated WICKED BEATS RADIO wordmark */
export function Wordmark({ size = "hero" }: { size?: "hero" | "sm" }) {
  const ref = useRef<HTMLDivElement>(null);
  const { calm } = useFx();
  useEffect(() => {
    const el = ref.current!;
    return addFrame(() => {
      el.style.setProperty("--bass", signal.playing && !calm ? signal.bass.toFixed(3) : "0");
    });
  }, [calm]);

  const big = size === "hero";
  const letter = (ch: string, i: number, offset: number) => (
    <motion.span
      key={i}
      className="inline-block"
      initial={{ clipPath: "inset(0 100% 0 0)", y: 30, opacity: 0 }}
      whileInView={{ clipPath: "inset(0 0% 0 0)", y: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay: (offset + i) * 0.06, type: "spring", stiffness: 380, damping: 16 }}
    >
      <span className="inline-block" style={{ transform: `translateY(calc(var(--bass) * ${-4 - ((i * 7) % 5) * 2}px))` }}>
        {ch}
      </span>
    </motion.span>
  );
  return (
    <div ref={ref} className="inline-flex select-none flex-col items-center" style={{ ["--bass" as string]: 0 }}>
      <h1 className={cn("font-slant scratched flex flex-wrap justify-center gap-x-[0.25em]", big ? "text-[clamp(3.5rem,13vw,10rem)] max-md:!text-[12.5vw]" : "text-5xl")}>
        <span className="glitch text-foreground" data-text="WICKED">
          {"WICKED".split("").map((c, i) => letter(c, i, 0))}
        </span>
        <span className="glitch neon text-pink" data-text="BEATS">
          {"BEATS".split("").map((c, i) => letter(c, i, 6))}
        </span>
      </h1>
      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        whileInView={{ opacity: 1, scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.75, duration: 0.4 }}
        className={cn("bg-chrome -skew-x-12 border border-graphite px-6 py-1", big ? "mt-2" : "mt-1")}
      >
        <span className={cn("block skew-x-12 font-sans font-bold tracking-[0.6em] text-foreground", big ? "text-lg md:text-2xl" : "text-xs")}>RADIO</span>
      </motion.div>
      <WaveLine className={big ? "mt-3 max-w-md" : "mt-2 max-w-[180px]"} height={big ? 28 : 16} />
    </div>
  );
}

/** "// The Sound" typed mono label */
export function SectionLabel({ children, className }: { children: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let i = 0;
    const id = window.setInterval(() => {
      i++;
      setN(i);
      if (i >= children.length) window.clearInterval(id);
    }, 45);
    return () => window.clearInterval(id);
  }, [inView, children]);
  return (
    <span ref={ref} className={cn("label-mono inline-block", className)} aria-label={children}>
      <span aria-hidden>{children.slice(0, n)}</span>
      <span aria-hidden className="animate-pulse">▌</span>
    </span>
  );
}

/** Heading with a slanted brush-wipe entrance */
export function SlashHeading({ children, className, as = "h2" }: { children: ReactNode; className?: string; as?: "h1" | "h2" | "h3" }) {
  const Tag = motion[as];
  return (
    <Tag
      initial={{ clipPath: "polygon(0 0, 0 0, -10% 100%, -10% 100%)", opacity: 0 }}
      {...(as === "h1" ? { animate: { clipPath: "polygon(0 0, 110% 0, 100% 100%, -10% 100%)", opacity: 1 } } : { whileInView: { clipPath: "polygon(0 0, 110% 0, 100% 100%, -10% 100%)", opacity: 1 } })}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, ease: [0.7, 0, 0.2, 1] }}
      className={cn("font-slant text-[clamp(1.625rem,8vw,2rem)] md:text-7xl", className)}
    >
      {children}
    </Tag>
  );
}

export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, delay, ease: [0.2, 0.7, 0.2, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Magnetic hover (desktop only) */
export function Magnetic({ children, className, strength = 0.3 }: { children: ReactNode; className?: string; strength?: number }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 15 });
  const sy = useSpring(y, { stiffness: 220, damping: 15 });
  return (
    <motion.div
      className={cn("inline-block", className)}
      style={{ x: sx, y: sy }}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - r.left - r.width / 2) * strength);
        y.set((e.clientY - r.top - r.height / 2) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

/** 3D tilt on hover (desktop only) */
export function Tilt({ children, className, max = 10 }: { children: ReactNode; className?: string; max?: number }) {
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 200, damping: 18 });
  const sry = useSpring(ry, { stiffness: 200, damping: 18 });
  return (
    <motion.div
      className={className}
      style={{ rotateX: srx, rotateY: sry, transformPerspective: 900 }}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        ry.set(((e.clientX - r.left) / r.width - 0.5) * max * 2);
        rx.set(-((e.clientY - r.top) / r.height - 0.5) * max * 2);
      }}
      onPointerLeave={() => {
        rx.set(0);
        ry.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

export function EqLoader({ bars = 12, className }: { bars?: number; className?: string }) {
  return (
    <div className={cn("flex h-10 items-end gap-1", className)} role="status" aria-label="Loading">
      {Array.from({ length: bars }, (_, i) => (
        <span key={i} className="eq-bar w-1.5 rounded-sm bg-pink" style={{ height: "100%", animationDelay: `${(i * 0.09) % 0.9}s` }} />
      ))}
    </div>
  );
}

export function CountUp({ to, suffix = "", className }: { to: number; suffix?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const c = animate(0, to, { duration: 1.6, ease: "easeOut", onUpdate: (x) => setV(Math.round(x)) });
    return () => c.stop();
  }, [inView, to]);
  return (
    <span ref={ref} className={className}>
      {v}
      {suffix}
    </span>
  );
}

/** Speaker rings that thump with bass */
export function SpeakerRings({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { calm } = useFx();
  useEffect(() => {
    const el = ref.current!;
    const rings = Array.from(el.children) as HTMLElement[];
    return addFrame(() => {
      const b = calm ? 0 : signal.bass;
      const beat = calm ? 0 : signal.beat;
      rings.forEach((r, i) => {
        r.style.transform = `scale(${1 + b * (0.06 + i * 0.04) + beat * 0.03})`;
        r.style.opacity = String(0.25 + b * 0.5 - i * 0.05);
      });
    });
  }, [calm]);
  return (
    <div ref={ref} aria-hidden className={cn("pointer-events-none absolute inset-0 flex items-center justify-center", className)}>
      {[1, 1.22, 1.46, 1.72].map((s, i) => (
        <div
          key={i}
          className={cn("absolute aspect-square rounded-full border", i === 0 ? "border-pink glow-pink border-2" : "border-chrome")}
          style={{ width: `${s * 100}%` }}
        />
      ))}
    </div>
  );
}
