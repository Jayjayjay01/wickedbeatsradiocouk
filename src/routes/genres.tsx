import { useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "framer-motion";
import { PageHero } from "@/components/PageHero";
import { Tilt } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { CONFIG } from "@/config";
import { useAudio } from "@/lib/audio";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/genres")({
  head: () => seo({ title: "Our Genres | Wicked Beats Radio", description: "Reggae, Dancehall, House, Jungle and Afrobeat, the wickedest sounds on Wicked Beats Radio.", path: "/genres", image: CONFIG.GENRES[0].img }),
  component: GenresPage,
});

function GenreCard({ g, i }: { g: (typeof CONFIG.GENRES)[number]; i: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { play } = useAudio();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-12%", "12%"]);
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
      <Tilt max={6}>
        <div className="relative overflow-hidden rounded-2xl border border-graphite" style={{ boxShadow: `0 0 50px ${g.color}33` }}>
          <motion.img src={g.img} alt={`${g.name}, ${g.tag}`} loading="lazy" width={1200} height={600} style={{ y }} className="h-[200px] w-full scale-125 object-cover md:h-[420px]" />
          <div className="absolute inset-0 bg-gradient-to-r from-void via-void/70 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10">
            <span className="label-mono" style={{ color: g.color }}>0{i + 1} // {g.tag}</span>
            <h2 className="font-slant mt-2 text-6xl md:text-8xl">{g.name}</h2>
            <div className="mt-5"><Button variant="hero" onClick={play}>Listen Live</Button></div>
          </div>
          <div className="absolute inset-x-0 top-0 h-1" style={{ background: g.color }} />
        </div>
      </Tilt>
    </motion.div>
  );
}

function GenresPage() {
  return (
    <>
      <PageHero label="// The Sound" title={<>Our <span className="text-pink">Genres</span></>}>
        🔊 From underground beats to island heat, we bring the world's wickedest sounds straight to your ears!
      </PageHero>
      <section className="mx-auto max-w-6xl space-y-8 px-4">
        {CONFIG.GENRES.map((g, i) => <GenreCard key={g.name} g={g} i={i} />)}
      </section>
    </>
  );
}
