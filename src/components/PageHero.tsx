import type { ReactNode } from "react";
import { SectionLabel, SlashHeading } from "@/components/brand";

export function PageHero({ label, title, children }: { label: string; title: ReactNode; children?: ReactNode }) {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-6 pt-20 md:pb-10 md:pt-36">
      <SectionLabel>{label}</SectionLabel>
      <SlashHeading as="h1" className="mt-3 text-[clamp(2rem,10vw,2.5rem)] md:text-8xl">{title}</SlashHeading>
      {children && <div className="mt-4 max-w-2xl rounded-lg bg-void/50 p-3 md:mt-5 md:p-4 text-muted-foreground backdrop-blur-sm md:text-lg">{children}</div>}
    </section>
  );
}
