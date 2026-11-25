import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/PageHero";
import { Magnetic, Reveal } from "@/components/brand";
import { CONFIG } from "@/config";
import { emit } from "@/lib/fx";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/support")({
  head: () => seo({ title: "Support the Station | Wicked Beats Radio", description: "Tip Wicked Beats Radio via PayPal to keep the beats spinning 24/7.", path: "/support" }),
  component: Support,
});

function Support() {
  return (
    <>
      <PageHero label="// Tip Jar" title={<>Support the <span className="text-pink">Station</span></>}>
        Keep the beats spinning 24/7. Every tip helps cover the servers, gear & the DJs who keep the energy alive. 🙌
      </PageHero>
      <section className="mx-auto max-w-4xl px-4">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {CONFIG.PAYPAL.map((p, i) => (
            <Reveal key={p.label} delay={i * 0.07}>
              <Magnetic className="block w-full">
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    const r = e.currentTarget.getBoundingClientRect();
                    emit("sparks", { x: r.left + r.width / 2, y: r.top + r.height / 2, n: 50, confetti: true });
                  }}
                  className="bg-pink-grad glow-pink flex aspect-square -skew-x-6 flex-col items-center justify-center rounded-2xl text-primary-foreground transition-transform hover:scale-105"
                >
                  <span className="font-slant text-6xl">{p.label}</span>
                  <span className="text-xs font-bold uppercase tracking-widest">Tip</span>
                </a>
              </Magnetic>
            </Reveal>
          ))}
        </div>
        <p className="label-mono mt-8 text-center text-muted-foreground">Secure payment via PayPal · No account needed</p>
      </section>
    </>
  );
}
