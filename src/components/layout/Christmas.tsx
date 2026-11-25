import { useEffect, useState, type ReactNode, type CSSProperties } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouterState } from "@tanstack/react-router";
import { Gift, X } from "lucide-react";
import { CONFIG, PALETTE } from "@/config";

const BULB_COLORS = [PALETTE.pink, PALETTE.yellow, PALETTE.cyan, PALETTE.green, PALETTE.violet, PALETTE.orange];
const BULBS = 26;
const WIRE_W = 1440;
const WIRE_H = 56;
const SAG = 16;
const STORAGE_KEY = "wb-xmas-2026-dismissed";

/** Two drooping swags: parabola per half, 0 at each fixing point. */
function wireY(t: number) {
  const seg = t < 0.5 ? t * 2 : (t - 0.5) * 2;
  return 4 * seg * (1 - seg) * SAG;
}

function FairyLights() {
  const points = Array.from({ length: 49 }, (_, i) => {
    const t = i / 48;
    return `${(t * WIRE_W).toFixed(1)},${wireY(t).toFixed(1)}`;
  }).join(" ");

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-14 z-50 h-10 md:top-16">
      <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${WIRE_W} ${WIRE_H}`} preserveAspectRatio="none">
        <polyline points={points} fill="none" stroke="var(--graphite)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      {Array.from({ length: BULBS }, (_, i) => {
        const t = (i + 0.5) / BULBS;
        const color = BULB_COLORS[i % BULB_COLORS.length]!;
        return (
          <span
            key={i}
            className="fairy-bulb absolute block h-[11px] w-[7px] -translate-x-1/2 rounded-[50%_50%_45%_45%]"
            style={{
              left: `${t * 100}%`,
              top: `${(wireY(t) / WIRE_H) * 100}%`,
              background: color,
              boxShadow: `0 0 8px ${color}, 0 0 18px ${color}66`,
              animationDelay: `${(i % 7) * 0.35}s`,
            }}
          />
        );
      })}
    </div>
  );
}

/* ---------- Lights that frame a card ---------- */
const TOP_T = 3; // wire fixing height, % of the frame
const TOP_S = 4; // droop at the middle of the swag, %
const BOT_T = 91;
const BOT_S = 4;
const topY = (t: number) => TOP_T + 4 * TOP_S * t * (1 - t);
const botY = (t: number) => BOT_T + 4 * BOT_S * t * (1 - t);
const sideY = (t: number) => TOP_T + (BOT_T - TOP_T) * t;

function bulbStyle(left: string, top: string, color: string, i: number): CSSProperties {
  return {
    left,
    top,
    background: color,
    boxShadow: `0 0 8px ${color}, 0 0 18px ${color}66`,
    animationDelay: `${(i % 7) * 0.35}s`,
  };
}

/** A card strung with fairy lights: drooping wire top and bottom, straight runs down the sides. */
function LightsAround({ children, className = "" }: { children: ReactNode; className?: string }) {
  const top = Array.from({ length: 13 }, (_, i) => (i + 0.5) / 13);
  const bottom = Array.from({ length: 13 }, (_, i) => (i + 0.5) / 13);
  const side = Array.from({ length: 5 }, (_, i) => (i + 0.5) / 5);

  return (
    <div className={`relative p-5 ${className}`}>
      <div
        aria-hidden
        className="fairy-glow pointer-events-none absolute -inset-4 -z-10 rounded-[36px] blur-2xl"
        style={{ background: `radial-gradient(55% 60% at 50% 50%, ${PALETTE.pink}55, ${PALETTE.violet}22 55%, transparent 78%)` }}
      />
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <path
          d={`M 0 ${TOP_T} Q 50 ${TOP_T + 2 * TOP_S} 100 ${TOP_T} L 100 ${BOT_T} Q 50 ${BOT_T + 2 * BOT_S} 0 ${BOT_T} Z`}
          fill="none"
          stroke="var(--graphite)"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {top.map((t, i) => (
        <span
          key={`t${i}`}
          aria-hidden
          className="fairy-bulb absolute block h-[11px] w-[7px] -translate-x-1/2 rounded-[50%_50%_45%_45%]"
          style={bulbStyle(`${t * 100}%`, `calc(${topY(t)}% + 2px)`, BULB_COLORS[i % BULB_COLORS.length]!, i)}
        />
      ))}
      {bottom.map((t, i) => (
        <span
          key={`b${i}`}
          aria-hidden
          className="fairy-bulb absolute block h-[11px] w-[7px] -translate-x-1/2 rounded-[50%_50%_45%_45%]"
          style={bulbStyle(`${t * 100}%`, `calc(${botY(t)}% + 2px)`, BULB_COLORS[(i + 3) % BULB_COLORS.length]!, i + 2)}
        />
      ))}
      {side.map((t, i) => (
        <span
          key={`l${i}`}
          aria-hidden
          className="fairy-bulb absolute block h-[11px] w-[7px] -translate-x-1/2 -translate-y-1/2 rounded-[50%_50%_45%_45%]"
          style={bulbStyle("0%", `${sideY(t)}%`, BULB_COLORS[(i + 1) % BULB_COLORS.length]!, i + 4)}
        />
      ))}
      {side.map((t, i) => (
        <span
          key={`r${i}`}
          aria-hidden
          className="fairy-bulb absolute block h-[11px] w-[7px] -translate-x-1/2 -translate-y-1/2 rounded-[50%_50%_45%_45%]"
          style={bulbStyle("100%", `${sideY(t)}%`, BULB_COLORS[(i + 4) % BULB_COLORS.length]!, i + 6)}
        />
      ))}
      <div className="relative">{children}</div>
    </div>
  );
}

/** The DJs' Christmas message, strung with lights, for the station homepage. */
export function ChristmasHero() {
  if (!CONFIG.CHRISTMAS.ENABLED) return null;
  return (
    <motion.aside
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
      role="region"
      aria-label="Christmas message from the DJs"
      className="mt-8 w-full max-w-2xl"
    >
      <LightsAround>
        <div className="panel-solid pink-line rounded-2xl px-5 py-6 text-center md:px-8">
          <Gift className="mx-auto h-6 w-6 text-pink" aria-hidden />
          <p className="font-slant mt-2 text-2xl text-glow md:text-3xl">{CONFIG.CHRISTMAS.TITLE}</p>
          <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground md:text-base">{CONFIG.CHRISTMAS.MESSAGE}</p>
          <p className="label-mono mt-3">{CONFIG.CHRISTMAS.SIGN_OFF}</p>
        </div>
      </LightsAround>
    </motion.aside>
  );
}

export function Christmas() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!CONFIG.CHRISTMAS.ENABLED) return;
    try {
      if (localStorage.getItem(STORAGE_KEY) !== "1") setShow(true);
    } catch {
      setShow(true);
    }
  }, []);

  if (!CONFIG.CHRISTMAS.ENABLED) return null;

  const dismiss = () => {
    setShow(false);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* private browsing: just hide for this visit */
    }
  };

  return (
    <>
      <FairyLights />
      <AnimatePresence>
        {/* On the homepage the message sits inside the hero, framed with lights. */}
        {show && path !== "/" && (
          <motion.aside
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24, transition: { duration: 0.25, delay: 0 } }}
            transition={{ duration: 0.4, delay: 0.6 }}
            role="region"
            aria-label="Christmas message from the DJs"
            className="fixed inset-x-3 bottom-[calc(76px+env(safe-area-inset-bottom))] z-40 mx-auto max-w-2xl md:bottom-24"
          >
            <LightsAround>
              <div className="panel-solid pink-line relative rounded-2xl px-5 py-5 text-center shadow-2xl">
                <button
                  onClick={dismiss}
                  aria-label="Dismiss Christmas message"
                  className="absolute right-3 top-3 rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
                <Gift className="mx-auto h-6 w-6 text-pink" aria-hidden />
                <p className="font-slant mt-2 text-2xl md:text-3xl">{CONFIG.CHRISTMAS.TITLE}</p>
                <p className="mt-2 text-sm text-muted-foreground">{CONFIG.CHRISTMAS.MESSAGE}</p>
                <p className="label-mono mt-3">{CONFIG.CHRISTMAS.SIGN_OFF}</p>
              </div>
            </LightsAround>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
