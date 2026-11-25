import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { CONFIG } from "@/config";
import logo from "@/assets/logo.jpg.asset.json";
import { setAnalyser, signal } from "./signal";
import { emit } from "./fx";

export type Status = "idle" | "loading" | "playing" | "paused" | "reconnecting";
type Mode = "cors" | "plain";

type AudioApi = {
  status: Status;
  volume: number;
  muted: boolean;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  setVolume: (v: number) => void;
  setMuted: (m: boolean) => void;
};

const Ctx = createContext<AudioApi | null>(null);

export function AudioProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("idle");
  const [volume, setVol] = useState(0.85);
  const [muted, setMut] = useState(false);

  const el = useRef<HTMLAudioElement | null>(null);
  const mode = useRef<Mode>("cors");
  const ctx = useRef<AudioContext | null>(null);
  const want = useRef(false);
  const attempts = useRef(0);
  const retryT = useRef<number | undefined>(undefined);
  const firstPlay = useRef(true);
  const corsOk = useRef(false);
  const volRef = useRef(volume);
  const mutedRef = useRef(muted);

  const build = useCallback((m: Mode) => {
    if (el.current && mode.current === m) return el.current;
    if (el.current) {
      el.current.pause();
      el.current.removeAttribute("src");
      el.current.load();
    }
    const a = new Audio();
    a.preload = "none";
    if (m === "cors") a.crossOrigin = "anonymous";
    a.volume = volRef.current;
    a.muted = mutedRef.current;
    mode.current = m;
    el.current = a;

    a.addEventListener("playing", () => {
      attempts.current = 0;
      if (mode.current === "cors") corsOk.current = true;
      signal.playing = true;
      setStatus("playing");
    });
    a.addEventListener("waiting", () => setStatus((s) => (s === "playing" ? "loading" : s)));
    const onFail = () => {
      if (!want.current || el.current !== a) return;
      signal.playing = false;
      // CORS fallback: never leave the listener in silence.
      if (mode.current === "cors" && !corsOk.current) {
        switchToPlain();
        return;
      }
      scheduleRetry();
    };
    a.addEventListener("error", onFail);
    a.addEventListener("ended", onFail);
    a.addEventListener("stalled", () => {
      window.setTimeout(() => {
        if (want.current && el.current === a && a.readyState < 3) onFail();
      }, 8000);
    });

    if (m === "cors") {
      try {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!ctx.current) ctx.current = new AC();
        const src = ctx.current.createMediaElementSource(a);
        const an = ctx.current.createAnalyser();
        an.fftSize = 1024;
        an.smoothingTimeConstant = 0.8;
        src.connect(an);
        an.connect(ctx.current.destination);
        setAnalyser(an);
      } catch {
        setAnalyser(null);
      }
    } else setAnalyser(null);
    return a;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = useCallback(() => {
    const a = build(mode.current);
    ctx.current?.resume().catch(() => {});
    // Fresh src each time => live audio, never stale buffer.
    a.src = `${CONFIG.STREAM_URL}${CONFIG.STREAM_URL.includes("?") ? "&" : "?"}t=${Date.now()}`;
    setStatus((s) => (s === "reconnecting" ? s : "loading"));
    a.play().catch((err: DOMException) => {
      if (err?.name === "NotAllowedError") {
        want.current = false;
        setStatus("paused");
      }
    });
  }, [build]);

  const switchToPlain = useCallback(() => {
    build("plain");
    start();
  }, [build, start]);

  const scheduleRetry = useCallback(() => {
    setStatus("reconnecting");
    window.clearTimeout(retryT.current);
    const delay = Math.min(30000, 1000 * 2 ** attempts.current);
    attempts.current++;
    retryT.current = window.setTimeout(() => want.current && start(), delay);
  }, [start]);

  const play = useCallback(() => {
    want.current = true;
    attempts.current = 0;
    start();
    if (firstPlay.current) {
      firstPlay.current = false;
      emit("warp");
      emit("shockwave", { x: window.innerWidth / 2, y: window.innerHeight / 2 });
    }
  }, [start]);

  const pause = useCallback(() => {
    want.current = false;
    window.clearTimeout(retryT.current);
    const a = el.current;
    if (a) {
      a.pause();
      a.removeAttribute("src");
      a.load();
    }
    signal.playing = false;
    setStatus("paused");
  }, []);

  const toggle = useCallback(() => (want.current ? pause() : play()), [pause, play]);

  const setVolume = useCallback((v: number) => {
    volRef.current = v;
    setVol(v);
    if (el.current) el.current.volume = v;
    if (v > 0 && mutedRef.current) {
      mutedRef.current = false;
      setMut(false);
      if (el.current) el.current.muted = false;
    }
  }, []);
  const setMuted = useCallback((m: boolean) => {
    mutedRef.current = m;
    setMut(m);
    if (el.current) el.current.muted = m;
  }, []);

  // Analyser returning only zeros while "playing" => CORS-tainted & silent. Fall back.
  useEffect(() => {
    const id = window.setInterval(() => {
      if (want.current && mode.current === "cors" && signal.playing && signal.zeroFrames > 120) {
        corsOk.current = false;
        signal.zeroFrames = 0;
        switchToPlain();
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [switchToPlain]);

  // Spacebar toggles play unless typing / on a control.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, button, a, [contenteditable=true]")) return;
      e.preventDefault();
      toggle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  // Media Session (lock screen controls)
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    const art = new URL(logo.url, window.location.origin).href;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: "Wicked Beats Radio",
      artist: "Live 24/7 · Birmingham UK",
      album: "Wicked Beats Radio",
      artwork: [{ src: art, sizes: "512x512", type: "image/jpeg" }],
    });
    navigator.mediaSession.setActionHandler("play", play);
    navigator.mediaSession.setActionHandler("pause", pause);
    navigator.mediaSession.setActionHandler("stop", pause);
  }, [play, pause]);
  useEffect(() => {
    if ("mediaSession" in navigator)
      navigator.mediaSession.playbackState = status === "playing" ? "playing" : status === "paused" || status === "idle" ? "paused" : "playing";
  }, [status]);

  return (
    <Ctx.Provider value={{ status, volume, muted, play, pause, toggle, setVolume, setMuted }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAudio() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAudio outside AudioProvider");
  return c;
}
