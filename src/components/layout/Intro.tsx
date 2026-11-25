import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LOGO_SRC } from "@/components/brand";
import { useAudio } from "@/lib/audio";
import { emit } from "@/lib/fx";

const KEY = "wb-intro-seen";

/** ~4s opening sequence, once per session. */
export function Intro() {
  const [show, setShow] = useState(false);
  const [stage, setStage] = useState(0); // 0 build, 1 ready, 2 leaving
  const { play } = useAudio();

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || sessionStorage.getItem(KEY) || localStorage.getItem("wb-calm") === "1") return;
    setShow(true);
    document.body.style.overflow = "hidden";
    const t1 = window.setTimeout(() => emit("warp"), 3000);
    const t2 = window.setTimeout(() => setStage(1), 3400);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  const leave = (withAudio: boolean) => {
    sessionStorage.setItem(KEY, "1");
    if (withAudio) play();
    setStage(2);
    document.body.style.overflow = "";
    window.setTimeout(() => setShow(false), 950);
  };

  if (!show) return null;
  const ticks = Array.from({ length: 41 }, (_, i) => i);
  const eq = Array.from({ length: 7 }, (_, i) => i);

  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-label="Welcome to Wicked Beats Radio">
      {/* Two slanted halves that split apart */}
      {[0, 1].map((half) => (
        <motion.div
          key={half}
          className="absolute inset-0 bg-void"
          style={{ clipPath: half === 0 ? "polygon(0 0, 58% 0, 42% 100%, 0 100%)" : "polygon(58% 0, 100% 0, 100% 100%, 42% 100%)" }}
          animate={stage === 2 ? { x: half === 0 ? "-70%" : "70%", y: half === 0 ? "-6%" : "6%" } : {}}
          transition={{ duration: 0.9, ease: [0.7, 0, 0.2, 1] }}
        />
      ))}
      <AnimatePresence>
        {stage < 2 && (
          <motion.div className="absolute inset-0 overflow-hidden" exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <div className="grain absolute -inset-1/2 opacity-[0.12]" />
            <div className="scanlines absolute inset-0 opacity-30" />

            <button onClick={() => leave(false)} className="label-mono absolute right-5 top-5 z-10 rounded border border-graphite px-3 py-1.5 hover:border-pink">
              Skip
            </button>

            {/* Waveform line -> frequency dial */}
            <svg viewBox="0 0 1000 200" className="absolute left-0 top-1/2 w-full -translate-y-1/2" preserveAspectRatio="none" aria-hidden>
              <motion.path
                d="M0,100 L300,100 L320,70 L335,135 L350,40 L365,160 L380,85 L395,115 L410,100 L1000,100"
                stroke="var(--pink)"
                strokeWidth="2.5"
                fill="none"
                initial={{ pathLength: 0, opacity: 1 }}
                animate={{ pathLength: 1, opacity: [1, 1, 0] }}
                transition={{ pathLength: { duration: 0.8, delay: 0.3 }, opacity: { duration: 2.6, times: [0, 0.8, 1] } }}
                style={{ filter: "drop-shadow(0 0 6px var(--pink))" }}
              />
              {ticks.map((i) => (
                <motion.line
                  key={i}
                  x1={100 + i * 20}
                  x2={100 + i * 20}
                  y1={i % 5 ? 112 : 106}
                  y2={124}
                  stroke="var(--silver)"
                  strokeWidth="1.5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.8, 0.8, 0] }}
                  transition={{ delay: 1 + i * 0.008, duration: 1.6, times: [0, 0.2, 0.8, 1] }}
                />
              ))}
              <motion.line
                y1={70}
                y2={130}
                stroke="var(--pink)"
                strokeWidth="3"
                initial={{ x1: 100, x2: 100, opacity: 0 }}
                animate={{ x1: [100, 820, 680], x2: [100, 820, 680], opacity: [0, 1, 1, 0] }}
                transition={{ delay: 1.1, duration: 1.5, times: [0, 0.6, 1], opacity: { delay: 1.1, duration: 1.7, times: [0, 0.1, 0.8, 1] } }}
                style={{ filter: "drop-shadow(0 0 8px var(--pink))" }}
              />
            </svg>

            {/* EQ bars left & right */}
            {[0, 1].map((side) => (
              <div key={side} className={`absolute top-1/2 flex h-24 md:h-40 -translate-y-1/2 items-end gap-2 ${side ? "right-[6%]" : "left-[6%]"}`} aria-hidden>
                {eq.map((i) => (
                  <motion.span
                    key={i}
                    className="w-2.5 origin-bottom bg-pink md:w-4"
                    style={{ height: `${30 + ((i * 37) % 70)}%`, boxShadow: "var(--glow-pink-sm)" }}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: [0, 1, 0.5, 0.9, 0.6] }}
                    transition={{ delay: 1.2 + i * 0.05, duration: 2.2 }}
                  />
                ))}
              </div>
            ))}

            {/* Logo assembly */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative aspect-square w-[min(60vw,440px)] md:w-[min(78vw,440px)]">
                <svg viewBox="0 0 200 200" className="absolute inset-0" aria-hidden>
                  <motion.circle cx="100" cy="100" r="92" fill="none" stroke="var(--silver)" strokeWidth="4" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 1.8, duration: 0.6 }} />
                  <motion.circle cx="100" cy="100" r="84" fill="none" stroke="var(--pink)" strokeWidth="1.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 1.95, duration: 0.6 }} style={{ filter: "drop-shadow(0 0 4px var(--pink))" }} />
                </svg>
                <motion.div className="absolute inset-0 flex flex-col items-center justify-center" animate={{ opacity: [1, 1, 0] }} transition={{ duration: 3.15, times: [0, 0.95, 1] }}>
                  <motion.span className="font-slant text-[min(13vw,6.5rem)] md:text-[min(17vw,6.5rem)] text-foreground" initial={{ x: "-120vw", opacity: 0 }} animate={{ x: [null, "4%", "-2%", "0%"], opacity: [0, 1, 1, 1] }} transition={{ delay: 2.2, duration: 0.45 }} style={{ textShadow: "-3px 0 var(--cyan), 3px 0 var(--pink)" }}>
                    WICKED
                  </motion.span>
                  <motion.span className="font-slant -mt-2 text-[min(13vw,6.5rem)] md:text-[min(17vw,6.5rem)] text-pink" initial={{ x: "120vw", opacity: 0 }} animate={{ x: [null, "-4%", "2%", "0%"], opacity: [0, 1, 1, 1] }} transition={{ delay: 2.4, duration: 0.45 }} style={{ textShadow: "-3px 0 var(--cyan), 3px 0 var(--foreground)" }}>
                    BEATS
                  </motion.span>
                  <motion.span className="bg-chrome mt-1 px-4 text-sm font-bold tracking-[0.6em]" initial={{ scale: 2.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 2.7, type: "spring", stiffness: 500, damping: 18 }}>
                    RADIO
                  </motion.span>
                </motion.div>
                {/* The real logo slams in */}
                <motion.div
                  className="logo-badge absolute inset-[4%]"
                  initial={{ scale: 1.6, opacity: 0 }}
                  animate={{ scale: [1.6, 0.94, 1], opacity: [0, 1, 1] }}
                  transition={{ delay: 3, duration: 0.45 }}
                >
                  <img src={LOGO_SRC} alt="" width={440} height={440} />
                </motion.div>
                {/* Shockwave ring */}
                <motion.div className="absolute inset-0 rounded-full border-4 border-pink" initial={{ scale: 1, opacity: 0 }} animate={{ scale: [1, 2.6], opacity: [0.9, 0] }} transition={{ delay: 3.05, duration: 0.8 }} />
              </div>
            </div>
            {/* Soft white->pink flash */}
            <motion.div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,var(--foreground),var(--pink)_45%,transparent_75%)]" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.65, 0] }} transition={{ delay: 3.0, duration: 0.45 }} />

            {stage === 1 && (
              <motion.div className="absolute inset-x-0 bottom-[9%] flex flex-col items-center gap-4" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
                <span className="label-mono animate-pulse text-base">Tap to enter</span>
                <div className="flex w-full flex-col gap-3 px-4 md:w-auto md:flex-row md:flex-wrap md:justify-center md:px-0">
                  <button onClick={() => leave(true)} className="bg-pink-grad glow-pink -skew-x-6 rounded px-6 py-3 font-bold md:px-8 md:py-4 uppercase tracking-wider text-primary-foreground transition-transform hover:scale-105" autoFocus>
                    Enter and Play
                  </button>
                  <button onClick={() => leave(false)} className="-skew-x-6 rounded border border-chrome px-8 py-4 font-bold uppercase tracking-wider transition-colors hover:border-pink hover:text-pink">
                    Enter muted
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
