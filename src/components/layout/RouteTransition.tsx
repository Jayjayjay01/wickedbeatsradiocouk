import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouterState } from "@tanstack/react-router";
import { useFx } from "@/lib/fx";

const BARS = ["var(--pink)", "var(--foreground)", "var(--violet)", "var(--pink)"];

/** "Switching stations" wipe on every route change. */
export function RouteTransition() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const first = useRef(true);
  const [key, setKey] = useState<string | null>(null);
  const { calm } = useFx();

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setKey(path + Date.now());
    const id = window.setTimeout(() => setKey(null), 650);
    return () => window.clearTimeout(id);
  }, [path]);

  const label = path === "/" ? "HOME" : path.slice(1).split("/")[0].toUpperCase();

  return (
    <AnimatePresence>
      {key && (
        <motion.div key={key} className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" aria-hidden exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          {calm ? (
            <motion.div className="absolute inset-0 bg-background" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.8, 0] }} transition={{ duration: 0.5 }} />
          ) : (
            <>
              {BARS.map((c, i) => (
                <motion.div
                  key={i}
                  className="absolute -inset-y-10 w-[140%] -skew-x-[8deg]"
                  style={{ background: c, left: "-20%", boxShadow: i === 3 ? "8px 0 0 var(--cyan)" : undefined }}
                  initial={{ x: "-110%" }}
                  animate={{ x: ["-110%", "0%", "110%"] }}
                  transition={{ duration: 0.55, delay: i * 0.04, times: [0, 0.45, 1], ease: [0.7, 0, 0.3, 1] }}
                />
              ))}
              <motion.div className="scanlines absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.6, 0] }} transition={{ duration: 0.5 }} />
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 1, 0] }}
                transition={{ duration: 0.55, times: [0, 0.25, 0.7, 1] }}
              >
                <span className="label-mono rounded bg-void px-4 py-2 text-base">TUNING... {label}</span>
              </motion.div>
              <motion.div className="absolute left-0 top-0 h-[3px] w-full bg-pink" style={{ transformOrigin: "left", boxShadow: "var(--glow-pink-sm)" }} initial={{ scaleX: 0 }} animate={{ scaleX: [0, 1] }} transition={{ duration: 0.5 }} />
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
