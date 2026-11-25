import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/PageHero";
import { Reveal, Tilt } from "@/components/brand";
import { DAYS, fmtCountdown, fmtRange, uniqueDJs, upcoming, useLondonNow, useSchedule } from "@/lib/schedule";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/djs")({
  head: () => seo({ title: "Resident DJs | Wicked Beats Radio", description: "Meet the resident DJs of Wicked Beats Radio and find their weekly show times.", path: "/djs" }),
  component: DJsPage,
});

function DJsPage() {
  const { slots } = useSchedule();
  const now = useLondonNow();
  const djs = uniqueDJs(slots);
  return (
    <>
      <PageHero label="// The crew" title={<>Resident <span className="text-pink">DJs</span></>}>
        {djs.length} DJs keeping the energy alive every week. Here's when to catch each of them live.
      </PageHero>
      <section className="mx-auto grid max-w-7xl gap-4 px-4 sm:grid-cols-2 lg:grid-cols-3">
        {djs.map((dj, i) => {
          const next = now ? upcoming(dj.slots, now, 1)[0] : null;
          const initials = dj.name.replace(/^DJ\s+/, "").split(/\s+/).map((w) => w[0]).slice(0, 2).join("");
          return (
            <Reveal key={dj.name} delay={(i % 6) * 0.05}>
              <Tilt className="h-full">
                <div className="panel h-full rounded-xl p-6 transition-colors hover:border-pink">
                  <div className="flex items-center gap-4">
                    <div className="relative h-16 w-16 shrink-0">
                      <div className="bg-spectrum absolute inset-0 animate-spin rounded-full [animation-duration:6s]" />
                      <div className="absolute inset-[3px] grid place-items-center rounded-full bg-void font-slant text-2xl text-pink">{initials}</div>
                    </div>
                    <h2 className="font-slant text-3xl leading-none">{dj.name}</h2>
                  </div>
                  <ul className="mt-5 space-y-1 text-sm">
                    {dj.slots.map((s) => (
                      <li key={`${s.day}-${s.start}`} className="flex justify-between border-b border-graphite/60 py-1">
                        <span className="font-bold">{DAYS[s.day]}</span>
                        <span className="text-muted-foreground">{fmtRange(s)}</span>
                      </li>
                    ))}
                  </ul>
                  {next && <p className="label-mono mt-4">Next show in {fmtCountdown(next.until)}</p>}
                </div>
              </Tilt>
            </Reveal>
          );
        })}
      </section>
    </>
  );
}
