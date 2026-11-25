import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { BrushDivider, CountUp, Logo, Magnetic, Reveal, SectionLabel, SlashHeading, SpeakerRings, Wordmark } from "@/components/brand";
import { OnAirCard } from "@/components/OnAirCard";
import { Button } from "@/components/ui/button";
import { CONFIG } from "@/config";
import { useAudio } from "@/lib/audio";
import { DAYS, fmtCountdown, fmtRange, upcoming, useLondonNow, useSchedule } from "@/lib/schedule";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () =>
    seo({
      title: "Wicked Beats Radio | Birmingham Reggae, House & Dancehall",
      description:
        "Stream Wicked Beats Radio live from Birmingham, 24/7 Reggae, Dancehall, House, Jungle & Afrobeat. Tune in to our DJs and weekly shows. Listen now!",
      path: "/",
    }),
  component: Home,
});

const STATS = [
  { n: 50, s: "K+", l: "Listeners" },
  { n: 31, s: "+", l: "Resident DJs" },
  { n: 7, s: "", l: "Genres" },
  { n: 24, s: "/7", l: "On Air now" },
];

function Hero() {
  const { play } = useAudio();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, 120]);
  const o = useTransform(scrollY, [0, 500], [1, 0.3]);
  return (
    <section className="relative flex flex-col items-center justify-center px-4 pb-12 pt-20 md:min-h-[100svh] md:pb-16 md:pt-24 text-center">
      <motion.div style={{ y, opacity: o }} className="relative mb-4 w-[min(55vw,300px)] md:mb-6 md:w-[min(64vw,300px)]">
        <SpeakerRings />
        <div className="relative aspect-square">
          <Logo size={300} eager className="!h-full !w-full" />
        </div>
      </motion.div>
      <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="on-air mb-4 inline-flex items-center gap-2 rounded-full border border-pink bg-void/60 px-4 py-1.5 text-xs font-bold uppercase tracking-widest">
        <span className="h-2 w-2 animate-pulse rounded-full bg-pink" /> On Air · Live 24/7
      </motion.span>
      <Wordmark />
      <div className="mt-4 max-w-2xl rounded-xl bg-void/55 px-4 py-3 md:mt-6 md:px-5 md:py-4 backdrop-blur-sm">
        <p className="font-bold">24/7 Internet Radio Station · Live from Birmingham.UK</p>
        <p className="label-mono mt-1">Reggae · Dancehall · House · Jungle · Afrobeat</p>
        <p className="mt-3 text-sm text-muted-foreground md:text-base">
          From underground bass to island vibes, Wicked Beats Radio brings you the finest sounds from around the globe. Tune in for non-stop energy, fresh sounds and wicked vibes, mixed live by our resident DJs who know how to keep the party moving.
        </p>
      </div>
      <div className="mt-6 flex w-full flex-col gap-3 max-md:[&_button]:h-12 max-md:[&_a]:h-12 max-md:[&_*]:w-full md:mt-7 md:w-auto md:flex-row md:flex-wrap md:justify-center md:gap-4">
        <Magnetic>
          <Button variant="hero" size="xl" onClick={play}>Listen Live Now</Button>
        </Magnetic>
        <Magnetic>
          <Button asChild variant="chrome" size="xl">
            <Link to="/schedule">Today's DJs</Link>
          </Button>
        </Magnetic>
      </div>
      <div className="mt-8 grid w-full max-w-4xl grid-cols-2 gap-2 md:mt-12 md:gap-3 md:grid-cols-4">
        {STATS.map((s, i) => (
          <Reveal key={s.l} delay={i * 0.08}>
            <div className="panel relative overflow-hidden rounded-lg p-4">
              <div aria-hidden className="absolute inset-x-2 bottom-0 flex h-full items-end gap-1 opacity-25">
                {Array.from({ length: 10 }, (_, k) => (
                  <span key={k} className="eq-bar flex-1 bg-pink" style={{ height: `${30 + ((k * 29 + i * 17) % 70)}%`, animationDelay: `${k * 0.11}s`, animationDuration: "1.4s" }} />
                ))}
              </div>
              <CountUp to={s.n} suffix={s.s} className="font-slant relative block text-3xl text-pink md:text-5xl" />
              <span className="relative text-xs font-bold uppercase tracking-widest">{s.l}</span>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Marquee() {
  const words = ["REGGAE", "DANCEHALL", "HOUSE", "JUNGLE", "AFROBEAT", "DRUM & BASS", "ROOTS"];
  const row = [...words, ...words];
  return (
    <div className="relative overflow-hidden border-y border-graphite bg-void/70 py-5" aria-hidden>
      <div className="marquee flex w-max gap-10 whitespace-nowrap">
        {[...row, ...row].map((w, i) => (
          <span key={i} className={`font-slant text-6xl md:text-8xl ${i % 2 ? "text-pink" : "text-foreground"}`}>
            {w} <span className="text-graphite">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function UpNext() {
  const { slots } = useSchedule();
  const now = useLondonNow();
  const list = now ? upcoming(slots, now, 3) : [];
  return (
    <div className="space-y-3">
      {(list.length ? list : [null, null, null]).map((it, i) => (
        <Reveal key={i} delay={i * 0.08}>
          <Link to="/schedule" className="panel group flex items-center justify-between rounded-lg px-5 py-4 transition-colors hover:border-pink">
            <div>
              <p className="label-mono text-muted-foreground">{it ? `${DAYS[it.slot.day]} · ${fmtRange(it.slot)}` : "…"}</p>
              <p className="font-slant mt-1 text-2xl">{it?.slot.dj ?? "Loading"}</p>
            </div>
            <span className="text-sm text-pink">{it ? `in ${fmtCountdown(it.until)}` : ""}</span>
          </Link>
        </Reveal>
      ))}
    </div>
  );
}

const TEASERS = [
  { to: "/about", label: "// Who we are", title: "About", text: "An independent station built for people who live and breathe music." },
  { to: "/community", label: "// Link up", title: "Community", text: "Follow us everywhere. Don't miss a single beat." },
  { to: "/support", label: "// Tip jar", title: "Support", text: "Keep the beats spinning 24/7 with a quick tip." },
  { to: "/requests", label: "// Shout out", title: "Requests", text: "Request a tune and get your shoutout on air." },
] as const;

function Home() {
  return (
    <>
      <Hero />
      <BrushDivider seed={5} />
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-20 lg:grid-cols-2">
        <div>
          <SectionLabel>// Live right now</SectionLabel>
          <SlashHeading className="mt-2">On Air Now</SlashHeading>
          <p className="mt-4 max-w-md text-muted-foreground">Live shows, DJ sets and shoutouts around the clock. Here's who's on the decks and who's up next.</p>
          <div className="mt-8">
            <UpNext />
          </div>
        </div>
        <Reveal>
          <OnAirCard />
        </Reveal>
      </section>
      <Marquee />
      <section className="mx-auto max-w-7xl px-4 py-20">
        <SectionLabel>// The Sound</SectionLabel>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SlashHeading className="mt-2">Our Genres</SlashHeading>
          <Link to="/genres" className="flex items-center gap-2 text-pink hover:underline">All genres <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-5">
          {CONFIG.GENRES.map((g, i) => (
            <Reveal key={g.name} delay={i * 0.06}>
              <Link to="/genres" className="group relative block aspect-[3/4] overflow-hidden rounded-lg border border-graphite">
                <img src={g.img} alt={`${g.name} on Wicked Beats Radio`} loading="lazy" width={300} height={400} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-void via-void/30 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <p className="font-slant text-2xl">{g.name}</p>
                  <p className="text-xs" style={{ color: g.color }}>{g.tag}</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
      <BrushDivider seed={9} flip />
      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-20 sm:grid-cols-2 lg:grid-cols-4">
        {TEASERS.map((t, i) => (
          <Reveal key={t.to} delay={i * 0.07}>
            <Link to={t.to} className="panel group flex h-full flex-col rounded-xl p-6 transition-all hover:-translate-y-1 hover:border-pink hover:glow-pink">
              <span className="label-mono">{t.label}</span>
              <span className="font-slant mt-3 text-4xl">{t.title}</span>
              <span className="mt-3 flex-1 text-sm text-muted-foreground">{t.text}</span>
              <ArrowRight className="mt-5 h-5 w-5 text-pink transition-transform group-hover:translate-x-2" />
            </Link>
          </Reveal>
        ))}
      </section>
    </>
  );
}
