import { createFileRoute } from "@tanstack/react-router";
import { Smartphone } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { Magnetic, Reveal } from "@/components/brand";
import { SOCIALS } from "@/components/layout/Footer";
import { CONFIG } from "@/config";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/community")({
  head: () => seo({ title: "Join the Movement | Wicked Beats Radio", description: "Follow Wicked Beats Radio on Instagram, TikTok, Facebook and get the Android app.", path: "/community" }),
  component: Community,
});

function Community() {
  const items = [
    ...SOCIALS.map((s) => ({ label: s.label, sub: s.handle, url: s.url, Icon: s.Icon })),
    { label: "Android App", sub: "Download Now", url: CONFIG.GOOGLE_PLAY_URL, Icon: Smartphone },
  ];
  return (
    <>
      <PageHero label="// Link Up" title={<>Join the <span className="text-pink">Movement</span></>}>
        🎶 Get connected. Get involved. Get WICKED! Follow us across every platform and keep up with the latest shows, beats, news and madness. Don't miss a single beat!
      </PageHero>
      <section className="mx-auto grid max-w-5xl gap-5 px-4 sm:grid-cols-2">
        {items.map(({ label, sub, url, Icon }, i) => (
          <Reveal key={label} delay={i * 0.08}>
            <Magnetic className="block w-full" strength={0.15}>
              <a href={url} target="_blank" rel="noopener noreferrer" className="panel group flex items-center gap-5 rounded-2xl p-6 transition-all hover:border-pink hover:glow-pink">
                <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-pink-grad text-primary-foreground transition-transform group-hover:rotate-12 group-hover:scale-110">
                  <Icon className="h-7 w-7" />
                </span>
                <span>
                  <span className="font-slant block text-4xl">{label}</span>
                  <span className="text-pink">{sub}</span>
                </span>
              </a>
            </Magnetic>
          </Reveal>
        ))}
      </section>
    </>
  );
}
