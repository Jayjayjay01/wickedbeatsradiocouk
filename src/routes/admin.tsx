import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import type { User } from "@supabase/supabase-js";
import { Check, Trash2, LogOut, Loader2 } from "lucide-react";
import { Field } from "@/components/Field";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { ScheduleManager } from "@/components/ScheduleManager";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin | Wicked Beats Radio" },
      { name: "description", content: "Station owner admin for Wicked Beats Radio." },
      { property: "og:title", content: "Admin | Wicked Beats Radio" },
      { property: "og:description", content: "Station owner admin." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

type Req = { id: string; kind: string; name: string; song: string; artist: string; message: string | null; show_or_dj: string | null; approved: boolean; created_at: string };
type Msg = { id: string; name: string; email: string; phone: string | null; message: string; created_at: string };

function Login() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const r = mode === "in"
      ? await supabase.auth.signInWithPassword({ email, password: pw })
      : await supabase.auth.signUp({ email, password: pw, options: { emailRedirectTo: `${window.location.origin}/admin` } });
    setBusy(false);
    if (r.error) setMsg(r.error.message);
    else if (mode === "up" && !r.data.session) setMsg("Check your inbox to confirm your email, then sign in.");
  };
  return (
    <form onSubmit={submit} className="panel mx-auto max-w-sm space-y-4 rounded-2xl p-8">
      <h1 className="font-slant text-4xl">Owner <span className="text-pink">{mode === "in" ? "login" : "setup"}</span></h1>
      <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
      <Field label="Password" type="password" value={pw} onChange={(e) => setPw(e.target.value)} required minLength={8} autoComplete={mode === "in" ? "current-password" : "new-password"} />
      {msg && <p className="text-sm text-pink">{msg}</p>}
      <Button type="submit" variant="hero" className="w-full" disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : mode === "in" ? "Sign in" : "Create owner account"}</Button>
      <button type="button" className="text-xs text-muted-foreground underline" onClick={() => setMode(mode === "in" ? "up" : "in")}>
        {mode === "in" ? "First time? Create the owner account" : "Have an account? Sign in"}
      </button>
    </form>
  );
}

function Admin() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState<"pending" | "approved" | "messages" | "schedule">("pending");
  const [reqs, setReqs] = useState<Req[]>([]);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [subs, setSubs] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data } = supabase.auth.onAuthStateChange((ev, s) => {
      if (ev === "SIGNED_IN" || ev === "SIGNED_OUT" || ev === "USER_UPDATED") setUser(s?.user ?? null);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const load = useCallback(async () => {
    const [r, m, s] = await Promise.all([
      supabase.from("song_requests").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("contact_submissions").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }),
    ]);
    setReqs(r.data ?? []);
    setMsgs(m.data ?? []);
    setSubs(s.count ?? 0);
  }, []);

  useEffect(() => {
    if (!user) { setIsAdmin(null); return; }
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle().then(({ data }) => {
      setIsAdmin(!!data);
      if (data) load();
    });
  }, [user, load]);

  const approve = async (id: string) => {
    const { error } = await supabase.from("song_requests").update({ approved: true }).eq("id", id);
    if (error) alert(`Couldn't approve: ${error.message}`); else load();
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    const { error } = await supabase.from("song_requests").delete().eq("id", id);
    if (error) alert(`Couldn't delete: ${error.message}`); else load();
  };

  return (
    <section className="mx-auto max-w-5xl px-4 pb-10 pt-28">
      {user === undefined ? (
        <Loader2 className="mx-auto animate-spin" />
      ) : !user ? (
        <Login />
      ) : isAdmin === false ? (
        <div className="panel mx-auto max-w-md rounded-2xl p-8 text-center">
          <p>This account doesn't have owner access.</p>
          <Button variant="chrome" className="mt-4" onClick={() => supabase.auth.signOut()}>Sign out</Button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-slant text-5xl">Station <span className="text-pink">Admin</span></h1>
            <div className="flex items-center gap-3">
              <span className="label-mono">{subs} newsletter subs</span>
              <Button variant="chrome" size="sm" onClick={() => supabase.auth.signOut()}><LogOut /> Sign out</Button>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {(["pending", "approved", "messages", "schedule"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={cn("rounded border px-4 py-2 text-sm font-bold uppercase", tab === t ? "border-pink bg-pink text-primary-foreground" : "border-graphite")}>
                {t} {t === "pending" ? `(${reqs.filter((r) => !r.approved).length})` : ""}
              </button>
            ))}
          </div>
          {tab === "schedule" ? <div className="mt-6"><ScheduleManager /></div> : <div className="mt-6 space-y-3">
            {tab === "messages"
              ? msgs.map((m) => (
                  <div key={m.id} className="panel rounded-lg p-4">
                    <p className="font-bold">{m.name} · <a className="text-pink" href={`mailto:${m.email}`}>{m.email}</a> {m.phone && `· ${m.phone}`}</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{m.message}</p>
                    <p className="label-mono mt-2 text-[10px]">{new Date(m.created_at).toLocaleString("en-GB")}</p>
                  </div>
                ))
              : reqs.filter((r) => r.approved === (tab === "approved")).map((r) => (
                  <div key={r.id} className="panel flex flex-wrap items-start justify-between gap-3 rounded-lg p-4">
                    <div>
                      <p className="label-mono mb-1 text-[10px] text-pink">{r.kind === "shoutout" ? "Shout-out" : "Song request"}</p>
                      <p className="font-bold">{r.name}{r.song && <> <span className="text-muted-foreground">requests</span> {r.song}{r.artist && ` – ${r.artist}`}</>}</p>
                      {r.message && <p className="mt-1 text-sm text-muted-foreground">"{r.message}"</p>}
                      {r.show_or_dj && <p className="label-mono mt-1 text-[10px]">For {r.show_or_dj}</p>}
                    </div>
                    <div className="flex gap-2">
                      {!r.approved && <Button size="sm" variant="hero" onClick={() => approve(r.id)}><Check /> Approve</Button>}
                      <Button size="sm" variant="destructive" onClick={() => remove(r.id)} aria-label="Delete"><Trash2 /></Button>
                    </div>
                  </div>
                ))}
          </div>}
        </>
      )}
    </section>
  );
}
