import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { Field, Honeypot } from "@/components/Field";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { emit } from "@/lib/fx";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/requests")({
  head: () => seo({ title: "Requests & Shoutouts | Wicked Beats Radio", description: "Request a tune and send a shoutout to the Wicked Beats Radio DJs.", path: "/requests" }),
  component: Requests,
});

const base = {
  name: z.string().trim().min(1, "Your name please").max(80),
  show_or_dj: z.string().trim().max(100).optional(),
};
const reqSchema = z.object({ ...base, song: z.string().trim().min(1, "Which song?").max(150), artist: z.string().trim().min(1, "Which artist?").max(150), message: z.string().trim().max(500).optional() });
const shoutSchema = z.object({ ...base, song: z.string().trim().max(150), artist: z.string().trim().max(150), message: z.string().trim().min(1, "What's the shout-out?").max(500) });

type Wall = { id: string; kind: string; name: string; song: string; artist: string; message: string | null; show_or_dj: string | null };

function ShoutWall() {
  const [items, setItems] = useState<Wall[]>([]);
  useEffect(() => {
    supabase.from("song_requests").select("id,kind,name,song,artist,message,show_or_dj").eq("approved", true).order("created_at", { ascending: false }).limit(30).then(({ data }) => setItems(data ?? []));
  }, []);
  if (!items.length) return <p className="panel rounded-xl p-6 text-center text-muted-foreground">The wall's warming up. Approved shoutouts will appear here.</p>;
  const row = [...items, ...items];
  return (
    <div className="overflow-hidden py-2">
      <div className="marquee-slow flex w-max gap-4 hover:[animation-play-state:paused]">
        {row.map((r, i) => (
          <div key={r.id + i} className="panel w-72 shrink-0 rounded-xl border-pink/40 p-5 shadow-[var(--glow-pink-sm)]">
            <p className="font-slant text-2xl text-pink">{r.name}</p>
            {r.song && <p className="mt-1 text-sm font-bold">♪ {r.song}{r.artist && ` – ${r.artist}`}</p>}
            {r.message && <p className="mt-2 text-sm text-muted-foreground">"{r.message}"</p>}
            {r.show_or_dj && <p className="label-mono mt-3 text-[10px]">For {r.show_or_dj}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function Requests() {
  const [kind, setKind] = useState<"request" | "shoutout">("request");
  const [f, setF] = useState({ name: "", song: "", artist: "", message: "", show_or_dj: "" });
  const [hp, setHp] = useState("");
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "busy" | "ok">("idle");
  const [err, setErr] = useState("");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (state === "busy") return;
    setErr("");
    const form = e.currentTarget;
    if (hp && !f.name.trim()) { setState("ok"); return; }
    const last = Number(localStorage.getItem("wb-req-at") || 0);
    if (Date.now() - last < 60000) { setErr("Easy now! Please wait a minute between requests."); return; }
    const p = (kind === "request" ? reqSchema : shoutSchema).safeParse(f);
    if (!p.success) {
      setErrs(Object.fromEntries(p.error.issues.map((i) => [i.path[0], i.message])));
      return;
    }
    setErrs({});
    setState("busy");
    const { error } = await supabase.from("song_requests").insert({ kind, ...p.data, song: p.data.song || "", artist: p.data.artist || "", message: p.data.message || null, show_or_dj: p.data.show_or_dj || null });
    if (error) { console.error("request insert failed", error); setState("idle"); setErr(error.message.includes("Too many") ? "Lots of requests right now, try again in a minute." : "Couldn't send that, please try again shortly."); return; }
    localStorage.setItem("wb-req-at", String(Date.now()));
    const r = form?.getBoundingClientRect?.();
    emit("sparks", { x: r ? r.left + r.width / 2 : window.innerWidth / 2, y: r ? r.top + 100 : 300, n: 50, confetti: true });
    setState("ok");
  };

  return (
    <>
      <PageHero label="// Shout out" title={<>Requests & <span className="text-pink">Shoutouts</span></>}>
        Got a tune you need to hear? Want to big up your crew? Send it in and our DJs will do the rest.
      </PageHero>
      <section className="mx-auto grid max-w-7xl gap-10 px-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="panel relative rounded-2xl p-6 md:p-8">
          {state === "ok" ? (
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="py-10 text-center" role="status">
              <p className="font-slant text-5xl text-pink">{kind === "request" ? "Request sent!" : "Shout-out sent!"}</p>
              <p className="mt-3 text-muted-foreground">Once a DJ approves it, it lands on the wall.</p>
              <Button variant="chrome" className="mt-6" onClick={() => { setF({ name: "", song: "", artist: "", message: "", show_or_dj: "" }); setState("idle"); }}>Send another</Button>
            </motion.div>
          ) : (
            <form onSubmit={submit} className="space-y-4" noValidate>
              <Honeypot value={hp} onChange={setHp} />
              <div className="grid grid-cols-2 gap-2" role="tablist">
                {(["request", "shoutout"] as const).map((k) => (
                  <button key={k} type="button" role="tab" aria-selected={kind === k} onClick={() => { setKind(k); setErrs({}); }}
                    className={`rounded border px-3 py-2 text-sm font-bold uppercase ${kind === k ? "border-pink bg-pink text-primary-foreground" : "border-graphite"}`}>
                    {k === "request" ? "Song request" : "Shout-out"}
                  </button>
                ))}
              </div>
              <Field label="Your name *" name="name" value={f.name} onChange={set("name")} maxLength={80} error={errs.name} autoComplete="name" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={kind === "request" ? "Song *" : "Song (optional)"} name="song" value={f.song} onChange={set("song")} maxLength={150} error={errs.song} />
                <Field label={kind === "request" ? "Artist *" : "Artist (optional)"} name="artist" value={f.artist} onChange={set("artist")} maxLength={150} error={errs.artist} />
              </div>
              <Field label={kind === "shoutout" ? "Shout-out message *" : "Shoutout message (optional)"} name="message" textarea value={f.message} onChange={set("message")} maxLength={500} error={errs.message} />
              <Field label="Show or DJ (optional)" name="show_or_dj" value={f.show_or_dj} onChange={set("show_or_dj")} maxLength={100} />
              {err && <p className="rounded border border-destructive bg-destructive/10 p-3 text-sm text-destructive" role="alert">{err}</p>}
              <Button type="submit" variant="hero" size="xl" className="w-full touch-manipulation" disabled={state === "busy"}>
                {state === "busy" ? <Loader2 className="animate-spin" /> : "Send it in"}
              </Button>
            </form>
          )}
        </div>
        <div>
          <h2 className="font-slant text-5xl">Shoutout <span className="text-pink">Wall</span></h2>
          <div className="mt-6"><ShoutWall /></div>
        </div>
      </section>
    </>
  );
}
