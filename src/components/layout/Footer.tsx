import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Instagram, Facebook, Music2, Smartphone, Loader2, Check } from "lucide-react";
import { z } from "zod";
import { Logo, Wordmark, BrushDivider } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { CONFIG } from "@/config";
import { useAudio } from "@/lib/audio";
import { supabase } from "@/integrations/supabase/client";
import licensingLogos from "@/assets/licensing-logos.png.asset.json";

export const SOCIALS = [
  { ...CONFIG.SOCIAL.instagram, Icon: Instagram },
  { ...CONFIG.SOCIAL.tiktok, Icon: Music2 },
  { ...CONFIG.SOCIAL.facebook, Icon: Facebook },
];

function Newsletter() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "ok" | "err">("idle");
  const [msg, setMsg] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = z.string().trim().email().max(255).safeParse(email);
    if (!p.success) {
      setState("err");
      setMsg("Enter a valid email.");
      return;
    }
    setState("busy");
    const { error } = await supabase.from("newsletter_subscribers").insert({ email: p.data.toLowerCase() });
    if (error && error.code !== "23505") {
      setState("err");
      setMsg("Couldn't subscribe, try again.");
      return;
    }
    setState("ok");
    setMsg(error ? "You're already on the list!" : "You're in. Stay wicked.");
    setEmail("");
  };
  return (
    <form onSubmit={submit} className="space-y-2">
      <p className="text-sm text-muted-foreground">Show news, guest mixes & events, no spam.</p>
      <div className="flex gap-2">
        <label htmlFor="nl-email" className="sr-only">Email</label>
        <input
          id="nl-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          className="min-w-0 flex-1 rounded border border-graphite bg-muted px-3 py-2 text-sm outline-none focus:border-pink"
        />
        <Button type="submit" variant="hero" disabled={state === "busy"}>
          {state === "busy" ? <Loader2 className="animate-spin" /> : state === "ok" ? <Check /> : "Subscribe"}
        </Button>
      </div>
      {msg && <p className={state === "err" ? "text-xs text-destructive" : "text-xs text-pink"} role="status">{msg}</p>}
    </form>
  );
}

export function Footer() {
  const { play } = useAudio();
  return (
    <footer className="relative mt-16 pb-28 max-md:text-sm">
      <BrushDivider seed={11} />
      <div className="mx-auto max-w-7xl px-4 pt-12">
        <div className="mb-12 flex justify-center">
          <Wordmark size="sm" />
        </div>
        <div className="grid gap-6 md:gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Logo size={88} />
            <p className="text-sm text-muted-foreground">
              24/7 global beats from Birmingham.UK Uniting communities worldwide through the power of music.
            </p>
            <Button variant="hero" onClick={play}>Listen Live Now</Button>
            <div className="flex gap-3">
              {SOCIALS.map(({ label, url, Icon }) => (
                <a key={label} href={url} target="_blank" rel="noopener noreferrer" aria-label={label} className="grid h-10 w-10 place-items-center rounded-full border border-graphite text-muted-foreground transition-colors hover:border-pink hover:text-pink">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          <div>
            <h3 className="label-mono mb-4">// Explore</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/schedule" className="hover:text-pink">Schedule</Link></li>
              <li><Link to="/genres" className="hover:text-pink">Genres</Link></li>
              <li><Link to="/about" className="hover:text-pink">About Us</Link></li>
              <li><Link to="/community" className="hover:text-pink">Community</Link></li>
              <li><Link to="/support" className="hover:text-pink">Support Us</Link></li>
              <li><a href={CONFIG.RADIO_NET_URL} target="_blank" rel="noopener noreferrer" className="hover:text-pink">Recent Mixes</a></li>
            </ul>
          </div>
          <div>
            <h3 className="label-mono mb-4">// Newsletter</h3>
            <Newsletter />
          </div>
          <div>
            <h3 className="label-mono mb-4">// Listen & Apps</h3>
            <div className="flex flex-col gap-2">
              <a href={CONFIG.RADIO_NET_URL} target="_blank" rel="noopener noreferrer" className="panel flex items-center gap-3 rounded px-4 py-3 text-sm hover:border-pink">
                <Music2 className="h-4 w-4 text-pink" /> Listen on radio.net
              </a>
              <a href={CONFIG.GOOGLE_PLAY_URL} target="_blank" rel="noopener noreferrer" className="panel flex items-center gap-3 rounded px-4 py-3 text-sm hover:border-pink">
                <Smartphone className="h-4 w-4 text-pink" /> Get it on Google Play
              </a>
              <a href={CONFIG.FLAG_COUNTER_LINK} target="_blank" rel="noopener noreferrer" className="mt-2 block">
                <img src={CONFIG.FLAG_COUNTER_IMG} alt="Flag Counter" loading="lazy" width={240} height={120} className="max-w-full rounded" />
              </a>
            </div>
          </div>
        </div>
        <div className="mt-12 flex justify-center py-6">
          <div className="w-[90%] max-w-[320px] md:max-w-[420px]">
            <img src={licensingLogos.url} alt="MCPS, PRS for Music and PPL" loading="lazy" width={600} height={180} className="block h-auto w-full" />
          </div>
        </div>
        <div className="flex flex-col items-center justify-between gap-2 border-t border-graphite pt-6 text-xs text-muted-foreground md:flex-row">
          <p>© 2026 Wicked Beats Radio · All rights reserved.</p>
          <p>Designed by Nexscales</p>
        </div>
      </div>
    </footer>
  );
}
