import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { List, LayoutGrid } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { EqLoader } from "@/components/brand";
import { DAYS, DAY_NAMES, fmtRange, useLondonNow, useSchedule, type Slot } from "@/lib/schedule";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/schedule")({
  head: () => seo({ title: "Weekly DJ Schedule | Wicked Beats Radio", description: "See who's on the decks at Wicked Beats Radio. Live DJ shows 24/7, all times in UK time.", path: "/schedule" }),
  component: SchedulePage,
});

function isLive(s: Slot, now: { day: number; minutes: number } | null) {
  return !!now && s.day === now.day && now.minutes >= s.start && now.minutes < s.end;
}

function SchedulePage() {
  const { slots, loading } = useSchedule();
  const now = useLondonNow();
  const [day, setDay] = useState(0);
  const [view, setView] = useState<"list" | "grid">("list");
  useEffect(() => {
    if (now) setDay(now.day);
    // only on first resolve
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now === null]);

  const daySlots = slots.filter((s) => s.day === day);

  return (
    <>
      <PageHero label="// On the decks" title={<>Weekly DJ <span className="text-pink">Schedule</span></>}>
        Your favourite shows, your favourite beats, anytime you want them. Tune in live 24 hours a day, 7 days a week!
        <span className="label-mono mt-2 block">All times shown in UK time</span>
      </PageHero>
      <section className="mx-auto max-w-7xl px-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Day">
            {DAYS.map((d, i) => (
              <button
                key={d}
                role="tab"
                aria-selected={day === i}
                onClick={() => { setDay(i); setView("list"); }}
                className={cn("-skew-x-6 rounded border px-4 py-2 text-sm font-bold uppercase transition-colors", day === i && view === "list" ? "border-pink bg-pink text-primary-foreground" : "border-graphite bg-void/60 hover:border-pink")}
              >
                {d}
                {now?.day === i && <span className="ml-1 text-[10px]">•</span>}
              </button>
            ))}
          </div>
          <div className="flex gap-1 rounded border border-graphite bg-void/60 p-1">
            <button onClick={() => setView("list")} aria-label="List view" aria-pressed={view === "list"} className={cn("rounded p-2", view === "list" && "bg-pink text-primary-foreground")}><List className="h-4 w-4" /></button>
            <button onClick={() => setView("grid")} aria-label="Week grid view" aria-pressed={view === "grid"} className={cn("rounded p-2", view === "grid" && "bg-pink text-primary-foreground")}><LayoutGrid className="h-4 w-4" /></button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><EqLoader /></div>
        ) : view === "list" ? (
          <div key={day} className="mt-6 space-y-2">
            <h2 className="font-slant text-3xl">{DAY_NAMES[day]}</h2>
            {daySlots.map((s, i) => {
              const live = isLive(s, now);
              return (
                <motion.div
                  key={`${s.start}-${s.dj}`}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={cn("panel flex items-center gap-4 rounded-lg border-2 px-5 py-4", live ? "live-border bg-pink-soft" : "border-graphite", s.auto && !live && "opacity-60")}
                >
                  <span className="label-mono w-32 shrink-0 text-foreground">{fmtRange(s)}</span>
                  <span className="font-slant flex-1 text-2xl">{s.dj}</span>
                  {live && <span className="on-air rounded bg-pink px-2 py-1 text-xs font-bold text-primary-foreground">LIVE NOW</span>}
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <div className="grid min-w-[900px] grid-cols-7 gap-2">
              {DAYS.map((d, di) => (
                <div key={d} className="space-y-1">
                  <p className={cn("font-slant text-center text-xl", now?.day === di && "text-pink")}>{d}</p>
                  {slots.filter((s) => s.day === di).map((s) => {
                    const live = isLive(s, now);
                    return (
                      <div key={`${s.start}-${s.dj}`} className={cn("panel rounded border p-2 text-xs", live ? "live-border border-pink bg-pink-soft" : "border-graphite", s.auto && "opacity-50")} style={{ minHeight: Math.max(36, ((s.end - s.start) / 60) * 18) }}>
                        <p className="font-mono text-[10px] text-muted-foreground">{fmtRange(s)}</p>
                        <p className="font-bold leading-tight">{s.dj}</p>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </>
  );
}
