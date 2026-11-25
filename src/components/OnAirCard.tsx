import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { SpeakerRings } from "@/components/brand";
import { CONFIG } from "@/config";
import { currentSlot, fmtCountdown, fmtRange, upcoming, useLondonNow, useSchedule } from "@/lib/schedule";

function useNowPlaying() {
  const [track, setTrack] = useState<string | null>(null);
  useEffect(() => {
    if (!CONFIG.NOW_PLAYING_URL) return;
    const load = async () => {
      try {
        const r = await fetch(CONFIG.NOW_PLAYING_URL, { cache: "no-store" });
        const txt = await r.text();
        let t = txt.trim();
        try {
          const j = JSON.parse(txt);
          t = j.title ?? j.now_playing?.song?.text ?? j.songtitle ?? j.song ?? j.track ?? "";
        } catch {
          /* plain text */
        }
        setTrack(t || null);
      } catch {
        setTrack(null);
      }
    };
    load();
    const id = window.setInterval(load, 30000);
    return () => window.clearInterval(id);
  }, []);
  return track;
}

/** Waveform-style progress bar */
function WaveProgress({ pct }: { pct: number }) {
  const bars = 48;
  return (
    <div className="flex h-8 items-center gap-[3px]" role="progressbar" aria-valuenow={Math.round(pct * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Show progress">
      {Array.from({ length: bars }, (_, i) => {
        const h = 20 + Math.abs(Math.sin(i * 1.7) * 60) + ((i * 13) % 20);
        const on = i / bars < pct;
        return <span key={i} className={on ? "flex-1 rounded-sm bg-pink" : "flex-1 rounded-sm bg-graphite"} style={{ height: `${h}%` }} />;
      })}
    </div>
  );
}

export function OnAirCard() {
  const { slots } = useSchedule();
  const now = useLondonNow();
  const track = useNowPlaying();
  const cur = now ? currentSlot(slots, now) : null;
  const next = now ? upcoming(slots, now, 1)[0] : null;
  const pct = cur && now ? (now.minutes - cur.start) / (cur.end - cur.start) : 0;

  return (
    <div className="relative">
      <SpeakerRings className="opacity-40 [&>div]:max-w-none" />
      <div className="panel pink-line relative overflow-hidden rounded-2xl p-6 md:p-8">
        <div className="flex items-center justify-between">
          <span className="on-air rounded border-2 border-pink px-3 py-1 font-slant text-2xl text-pink text-glow">ON AIR</span>
          <span className="label-mono text-muted-foreground">UK time</span>
        </div>
        <p className="label-mono mt-6 text-muted-foreground">// Now playing</p>
        <h3 className="font-slant mt-1 text-4xl md:text-5xl">{cur ? cur.dj : "…"}</h3>
        {cur && <p className="mt-1 text-sm text-muted-foreground">{fmtRange(cur)}</p>}
        {track && <p className="mt-2 text-sm">♪ <span className="text-pink">{track}</span></p>}
        <div className="mt-5">
          <WaveProgress pct={pct} />
        </div>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-t border-graphite pt-5">
          <div>
            <p className="label-mono text-muted-foreground">Up next</p>
            <p className="mt-1 text-lg font-bold">{next ? next.slot.dj : "…"}</p>
            {next && <p className="text-sm text-pink">in {fmtCountdown(next.until)} · {fmtRange(next.slot)}</p>}
          </div>
          <Button asChild variant="hero">
            <a href={CONFIG.RADIO_NET_URL} target="_blank" rel="noopener noreferrer">Tune In</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
