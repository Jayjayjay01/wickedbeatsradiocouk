import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Gift, X } from "lucide-react";
import { CONFIG, PALETTE } from "@/config";

const BULB_COLORS = [PALETTE.pink, PALETTE.yellow, PALETTE.cyan, PALETTE.green, PALETTE.violet];
const BULBS = 26;
const WIRE_W = 1440;
const WIRE_H = 56;
const SAG = 30;
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
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-50 h-14">
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

export function Christmas() {
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
        {show && (
          <motion.aside
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24, transition: { duration: 0.25, delay: 0 } }}
            transition={{ duration: 0.4, delay: 0.6 }}
            role="region"
            aria-label="Christmas message from the DJs"
            className="fixed inset-x-3 bottom-[calc(76px+env(safe-area-inset-bottom))] z-40 mx-auto max-w-2xl md:bottom-24"
          >
            <div className="panel pink-line relative rounded-2xl p-5 pr-10 text-center shadow-2xl">
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
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
