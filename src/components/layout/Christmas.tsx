import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouterState } from "@tanstack/react-router";
import { Gift, X } from "lucide-react";
import { CONFIG } from "@/config";
import { Button } from "@/components/ui/button";

const BULB_TONES = ["red", "gold", "blue", "green", "pink", "gold"];
const BULBS = 38;
const WIRE_W = 1440;
const WIRE_H = 56;
const SAG = 16;
const STORAGE_KEY = "wb-xmas-2026-dismissed";

/** Two drooping swags: parabola per half, 0 at each fixing point. */
function wireY(t: number) {
  const seg = t < 0.5 ? t * 2 : (t - 0.5) * 2;
  return 4 * seg * (1 - seg) * SAG;
}

function Bulb({ left, top, index, side = "down" }: { left: string; top: string; index: number; side?: "down" | "left" | "right" }) {
  return (
    <span aria-hidden className={`fairy-bulb fairy-bulb--${BULB_TONES[index % BULB_TONES.length] ?? "gold"} fairy-bulb--${side}`}
      style={{ left, top, animationDelay: `${(index % 9) * -0.43}s` }} />
  );
}

function FairyLights() {
  const points = Array.from({ length: 49 }, (_, i) => {
    const t = i / 48;
    return `${(t * WIRE_W).toFixed(1)},${wireY(t).toFixed(1)}`;
  }).join(" ");

  return (
    <div aria-hidden className="fairy-string pointer-events-none fixed inset-x-0 top-14 z-50 h-10 md:top-16">
      <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${WIRE_W} ${WIRE_H}`} preserveAspectRatio="none">
        <polyline className="fairy-wire" points={points} fill="none" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
      </svg>
      {Array.from({ length: BULBS }, (_, i) => {
        const t = (i + 0.5) / BULBS;
        return <Bulb key={i} left={`${t * 100}%`} top={`${(wireY(t) / WIRE_H) * 100}%`} index={i} />;
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

/** A card strung with fairy lights: drooping wire top and bottom, straight runs down the sides. */
function LightsAround({ children, className = "" }: { children: ReactNode; className?: string }) {
  const top = Array.from({ length: 13 }, (_, i) => (i + 0.5) / 13);
  const bottom = Array.from({ length: 13 }, (_, i) => (i + 0.5) / 13);
  const side = Array.from({ length: 5 }, (_, i) => (i + 0.5) / 5);

  return (
    <div className={`fairy-frame relative p-6 ${className}`}>
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <path
          d={`M 0 ${TOP_T} Q 50 ${TOP_T + 2 * TOP_S} 100 ${TOP_T} L 100 ${BOT_T} Q 50 ${BOT_T + 2 * BOT_S} 0 ${BOT_T} Z`}
          fill="none"
          className="fairy-wire"
          strokeWidth="2.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {top.map((t, i) => <Bulb key={`t${i}`} left={`${t * 100}%`} top={`${topY(t)}%`} index={i} />)}
      {bottom.map((t, i) => <Bulb key={`b${i}`} left={`${t * 100}%`} top={`${botY(t)}%`} index={i + 3} />)}
      {side.map((t, i) => <Bulb key={`l${i}`} left="0%" top={`${sideY(t)}%`} index={i + 1} side="right" />)}
      {side.map((t, i) => <Bulb key={`r${i}`} left="100%" top={`${sideY(t)}%`} index={i + 4} side="left" />)}
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
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={dismiss}
                  aria-label="Dismiss Christmas message"
                  className="absolute right-3 top-3 rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
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
