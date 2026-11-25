import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Globe, Users, Mic2 } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { Reveal } from "@/components/brand";
import { CONFIG } from "@/config";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/about")({
  head: () => seo({ title: "About Wicked Beats | Independent Birmingham Radio", description: "Wicked Beats Radio is an independent online radio station built for people who live and breathe music.", path: "/about", image: CONFIG.ABOUT_IMAGE }),
  component: About,
});

const COPY = [
  "Welcome to Wicked Beats Radio, where the music never stops, and the beats hit different. Wicked Beats Radio is an independent online radio station built for people who live and breathe music.",
  "From fresh new sounds and classic favourites to underground gems and the tracks you forgot you loved, we're here to keep you entertained, connected and tuned in.",
  "Our passion is simple: great music, great vibes and a great community.",
  "We bring you a mix of genres, live shows, DJ sets, music features, interviews, shout-outs and entertainment, giving both established artists and up-and-coming talent a place to be heard.",
  "Whether you're chilling at home, working, travelling, partying or just looking for something wicked to listen to, Wicked Beats Radio is the soundtrack to your day.",
  "We're more than just a radio station, we're a community brought together by the love of music.",
];

function About() {
  return (
    <>
      <PageHero label="// Who we are" title={<>About <span className="text-pink">Wicked Beats</span></>} />
      <section className="mx-auto grid max-w-7xl items-start gap-10 px-4 lg:grid-cols-2">
        <Reveal className="relative">
          <img src={CONFIG.ABOUT_IMAGE} alt="Wicked Beats Radio broadcasting live" width={800} height={800} loading="lazy" className="w-full rounded-2xl border border-graphite object-cover" />
          <span className="on-air absolute -bottom-4 left-6 -skew-x-6 rounded bg-pink px-4 py-2 font-bold uppercase text-primary-foreground">Established 2024</span>
        </Reveal>
        <div className="panel space-y-4 rounded-2xl p-6 md:p-8">
          {COPY.map((p, i) => (
            <Reveal key={i} delay={i * 0.05}><p className="text-muted-foreground md:text-lg">{p}</p></Reveal>
          ))}
          <Reveal><p className="font-slant text-4xl text-pink">Turn it up. Tune in. Stay wicked.</p></Reveal>
          <Reveal><p className="font-bold">Wicked Beats Radio, Feel the Beat. Live the Music.</p></Reveal>
        </div>
      </section>
      <section className="mx-auto mt-14 flex max-w-7xl flex-wrap justify-center gap-4 px-4">
        {[{ t: "Global Reach", I: Globe }, { t: "Community", I: Users }, { t: "Authentic Sound", I: Mic2 }].map(({ t, I }, i) => (
          <motion.div key={t} initial={{ opacity: 0, scale: 0.7, rotate: -6 }} whileInView={{ opacity: 1, scale: 1, rotate: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12, type: "spring" }} whileHover={{ y: -6 }} className="panel flex items-center gap-3 rounded-full px-6 py-3 hover:border-pink">
            <I className="h-5 w-5 text-pink" /><span className="font-bold uppercase tracking-wider">{t}</span>
          </motion.div>
        ))}
      </section>
    </>
  );
}
