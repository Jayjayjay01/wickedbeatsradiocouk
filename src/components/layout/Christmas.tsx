import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouterState } from "@tanstack/react-router";
import { Gift, X } from "lucide-react";
import { CONFIG } from "@/config";
import { Button } from "@/components/ui/button";

const BULB_TONES = ["red", "green", "blue", "gold", "violet", "orange"];
const STORAGE_KEY = "wb-xmas-2026-dismissed";

function Bulb({ left, top, index, side = "down" }: { left: string; top: string; index: number; side?: "down" | "left" | "right" }) {
  return (
    <span aria-hidden className={`fairy-bulb fairy-bulb--${BULB_TONES[index % BULB_TONES.length] ?? "gold"} fairy-bulb--${side}`}
      style={{ left, top, animationDelay: `${(index % 9) * -0.43}s` }} />
  );
}

function FairyLights() {
  return (
    <div aria-hidden className="fairy-screen-frame">
      <div className="fairy-screen-wire" />
      {(["top", "bottom", "left", "right"] as const).map((edge) => (
        <div key={edge} className={`fairy-screen-row fairy-screen-row--${edge}`}>
          {Array.from({ length: edge === "top" || edge === "bottom" ? 20 : 8 }, (_, i) => (
            <Bulb key={i} left="auto" top="auto" index={i} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** The DJs' Christmas message for the station homepage. */
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
      <div className="panel-solid pink-line rounded-2xl px-5 py-6 text-center md:px-8">
        <Gift className="mx-auto h-6 w-6 text-pink" aria-hidden />
        <p className="font-slant mt-2 text-2xl text-glow md:text-3xl">{CONFIG.CHRISTMAS.TITLE}</p>
        <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground md:text-base">{CONFIG.CHRISTMAS.MESSAGE}</p>
        <p className="label-mono mt-3">{CONFIG.CHRISTMAS.SIGN_OFF}</p>
      </div>
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
        {/* On the homepage the message sits inside the hero. */}
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
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
