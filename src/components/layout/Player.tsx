import { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize2, Shuffle, X, Loader2, Radio } from "lucide-react";
import { Logo } from "@/components/brand";
import { useAudio } from "@/lib/audio";
import { addFrame } from "@/lib/loop";
import { signal } from "@/lib/signal";
import { emit } from "@/lib/fx";
import { CONFIG } from "@/config";
import { currentSlot, fmtCountdown, fmtRange, upcoming, useLondonNow, useSchedule } from "@/lib/schedule";

function MiniEq() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const bars = Array.from(ref.current!.children) as HTMLElement[];
    return addFrame(() => {
      bars.forEach((b, i) => {
        const v = signal.freq[2 + i * 14] / 255;
        b.style.transform = `scaleY(${0.12 + v * 0.88})`;
      });
    });
  }, []);
  return (
    <div ref={ref} aria-hidden className="flex h-5 shrink-0 md:h-7 items-end gap-[3px]">
      {Array.from({ length: 7 }, (_, i) => (
        <span key={i} className="h-full w-[3px] origin-bottom rounded-sm bg-pink" />
      ))}
    </div>
  );
}

export function Player() {
  const { status, toggle, volume, setVolume, muted, setMuted } = useAudio();
  const { slots } = useSchedule();
  const now = useLondonNow();
  const [full, setFull] = useState(false);
  const cur = now ? currentSlot(slots, now) : null;
  const next = now ? upcoming(slots, now, 1)[0] : null;
  const playing = status === "playing" || status === "loading" || status === "reconnecting";

  useEffect(() => {
    document.documentElement.classList.toggle("vis-only", full);
    if (!full) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && setFull(false);
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [full]);

  const statusLabel =
    status === "reconnecting" ? "Reconnecting..." : status === "loading" ? "Tuning in..." : `Live · ${CONFIG.BITRATE}`;

  return (
    <>
      <section
        id="player"
        tabIndex={-1}
        aria-label="Radio player"
        className="glass pink-line fixed inset-x-0 bottom-0 z-40 border-x-0 border-b-0 pb-[env(safe-area-inset-bottom)]"
      >
        <div className="mx-auto flex h-16 md:h-[76px] max-w-7xl items-center gap-3 px-3 md:gap-5 md:px-5">
          <Logo size={44} className="max-md:!h-9 max-md:!w-9" />
          <button
            onClick={toggle}
            aria-label={playing ? "Pause live stream" : "Play live stream"}
            className="grid h-11 w-11 md:h-14 md:w-14 shrink-0 place-items-center rounded-full bg-pink-grad text-primary-foreground glow-pink transition-transform hover:scale-105 active:scale-95"
          >
            {status === "loading" || status === "reconnecting" ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : playing ? (
              <Pause className="h-6 w-6" fill="currentColor" />
            ) : (
              <Play className="ml-1 h-6 w-6" fill="currentColor" />
            )}
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-bold md:text-base">Wicked Beats Radio</span>
              <span className="label-mono hidden text-[10px] sm:inline" aria-live="polite">{statusLabel}</span>
            </div>
            <div className="truncate text-xs text-muted-foreground">
              <span className="sm:hidden" aria-live="polite">{statusLabel} · </span>
              {cur ? (
                <>
                  <span className="text-foreground">Now: {cur.dj}</span>
                  <span className="hidden md:inline"> ({fmtRange(cur)})</span>
                </>
              ) : (
                "Live 24/7"
              )}
              {next && <span className="hidden lg:inline"> · Next: {next.slot.dj} in {fmtCountdown(next.until)}</span>}
            </div>
          </div>
          <MiniEq />
          <div className="hidden items-center gap-2 md:flex">
            <button onClick={() => setMuted(!muted)} aria-label={muted ? "Unmute" : "Mute"} className="rounded p-1.5 text-muted-foreground hover:text-pink">
              {muted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={muted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              aria-label="Volume"
              className="range-pink w-24"
            />
          </div>
          <div className="hidden items-center gap-1 md:flex">
            <button onClick={() => emit("vismode")} aria-label="Switch visualiser mode" className="rounded p-2 text-muted-foreground hover:text-pink">
              <Shuffle className="h-4 w-4" />
            </button>
            <button onClick={() => setFull(true)} aria-label="Fullscreen visualiser" className="rounded p-2 text-muted-foreground hover:text-pink">
              <Maximize2 className="h-4 w-4" />
            </button>
            <a href={CONFIG.RADIO_NET_URL} target="_blank" rel="noopener noreferrer" aria-label="Listen on radio.net" className="rounded p-2 text-muted-foreground hover:text-pink">
              <Radio className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>
      {full && (
        <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center gap-3">
          <button onClick={() => emit("vismode")} className="glass label-mono rounded-full px-4 py-2">Switch mode</button>
          <button onClick={() => setFull(false)} className="glass label-mono flex items-center gap-2 rounded-full px-4 py-2" autoFocus>
            <X className="h-4 w-4" /> Exit (Esc)
          </button>
        </div>
      )}
    </>
  );
}
