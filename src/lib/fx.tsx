import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

/** Mutable state read by the canvas loop (no React re-render per frame). */
export const fxState = { calm: false, reduced: false, visMode: 0, lowTier: false };

type Bus = { warp: void; shockwave: { x: number; y: number }; sparks: { x: number; y: number; n?: number; confetti?: boolean }; vismode: void };
const target = typeof window !== "undefined" ? new EventTarget() : null;
export function emit<K extends keyof Bus>(name: K, detail?: Bus[K]) {
  target?.dispatchEvent(new CustomEvent(name, { detail }));
}
export function on<K extends keyof Bus>(name: K, fn: (d: Bus[K]) => void) {
  const h = (e: Event) => fn((e as CustomEvent).detail);
  target?.addEventListener(name, h);
  return () => target?.removeEventListener(name, h);
}

const Ctx = createContext<{ calm: boolean; reduced: boolean; toggleCalm: () => void }>({
  calm: false,
  reduced: false,
  toggleCalm: () => {},
});

export function FxProvider({ children }: { children: ReactNode }) {
  const [userCalm, setUserCalm] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    setUserCalm(localStorage.getItem("wb-calm") === "1");
    const h = () => setReduced(mq.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  const calm = userCalm || reduced;
  useEffect(() => {
    fxState.calm = calm;
    fxState.reduced = reduced;
    document.documentElement.classList.toggle("calm", calm);
  }, [calm, reduced]);

  const toggleCalm = useCallback(() => {
    setUserCalm((v) => {
      localStorage.setItem("wb-calm", v ? "0" : "1");
      return !v;
    });
  }, []);

  return <Ctx.Provider value={{ calm, reduced, toggleCalm }}>{children}</Ctx.Provider>;
}

export const useFx = () => useContext(Ctx);
