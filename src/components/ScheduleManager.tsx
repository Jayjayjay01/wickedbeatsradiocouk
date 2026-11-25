import { useCallback, useEffect, useState } from "react";
import { Pencil, Trash2, Plus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { DAY_NAMES } from "@/lib/schedule";

type Entry = { id: string; day_of_week: number; start_time: string; end_time: string; title: string; host: string | null; notes: string | null };
type Draft = Omit<Entry, "id"> & { id?: string };

const EMPTY: Draft = { day_of_week: 0, start_time: "12:00", end_time: "14:00", title: "", host: "", notes: "" };
const hhmm = (t: string) => (t.startsWith("24") ? "00:00" : t.slice(0, 5));
const input = "w-full rounded border border-graphite bg-void/60 px-3 py-2 text-sm focus:border-pink focus:outline-none";

export function ScheduleManager() {
  const [rows, setRows] = useState<Entry[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("schedule_entries").select("*").order("day_of_week").order("start_time");
    if (error) setErr(error.message);
    else setRows(data ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const bust = () => localStorage.removeItem("wb-schedule-v3");

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    if (!draft.title.trim()) return setErr("Title is required.");
    setBusy(true);
    setErr("");
    const payload = {
      day_of_week: draft.day_of_week,
      start_time: draft.start_time,
      end_time: draft.end_time === "00:00" ? "24:00" : draft.end_time,
      title: draft.title.trim(),
      host: draft.host?.trim() || null,
      notes: draft.notes?.trim() || null,
    };
    const { error } = draft.id
      ? await supabase.from("schedule_entries").update(payload).eq("id", draft.id)
      : await supabase.from("schedule_entries").insert(payload);
    setBusy(false);
    if (error) return setErr(`Couldn't save: ${error.message}`);
    bust();
    setDraft(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this show?")) return;
    const { error } = await supabase.from("schedule_entries").delete().eq("id", id);
    if (error) return alert(`Couldn't delete: ${error.message}`);
    bust();
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">UK times. Empty gaps show as AUTO DJ.</p>
        <Button size="sm" variant="hero" onClick={() => { setErr(""); setDraft({ ...EMPTY }); }}><Plus /> Add show</Button>
      </div>
      {err && !draft && <p className="text-sm text-pink">{err}</p>}

      {draft && (
        <form onSubmit={save} className="panel grid gap-3 rounded-lg p-4 sm:grid-cols-2">
          <label className="text-xs">Day
            <select className={input} value={draft.day_of_week} onChange={(e) => setDraft({ ...draft, day_of_week: Number(e.target.value) })}>
              {DAY_NAMES.map((d, i) => <option key={d} value={i}>{d}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs">Start<input type="time" required className={input} value={draft.start_time} onChange={(e) => setDraft({ ...draft, start_time: e.target.value })} /></label>
            <label className="text-xs">End<input type="time" required className={input} value={draft.end_time} onChange={(e) => setDraft({ ...draft, end_time: e.target.value })} /></label>
          </div>
          <label className="text-xs">Title<input required className={input} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></label>
          <label className="text-xs">Host<input className={input} value={draft.host ?? ""} onChange={(e) => setDraft({ ...draft, host: e.target.value })} /></label>
          <label className="text-xs sm:col-span-2">Notes<textarea rows={2} className={input} value={draft.notes ?? ""} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} /></label>
          {err && <p className="text-sm text-pink sm:col-span-2">{err}</p>}
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" variant="hero" size="sm" disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : draft.id ? "Save changes" : "Add show"}</Button>
            <Button type="button" variant="chrome" size="sm" onClick={() => setDraft(null)}><X /> Cancel</Button>
          </div>
        </form>
      )}

      {DAY_NAMES.map((d, di) => {
        const list = rows.filter((r) => r.day_of_week === di);
        return (
          <div key={d}>
            <h3 className="font-slant text-2xl">{d}</h3>
            <div className="mt-1 space-y-1">
              {list.length === 0 && <p className="text-xs text-muted-foreground">No shows.</p>}
              {list.map((r) => (
                <div key={r.id} className="panel flex items-center gap-3 rounded px-3 py-2">
                  <span className="label-mono w-28 shrink-0 text-foreground">{hhmm(r.start_time)}–{hhmm(r.end_time)}</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-bold">{r.title}{r.host && r.host !== r.title && <span className="font-normal text-muted-foreground"> · {r.host}</span>}</span>
                  <Button size="sm" variant="chrome" aria-label="Edit" onClick={() => { setErr(""); setDraft({ ...r, start_time: hhmm(r.start_time), end_time: hhmm(r.end_time) }); window.scrollTo({ top: 0, behavior: "smooth" }); }}><Pencil /></Button>
                  <Button size="sm" variant="destructive" aria-label="Delete" onClick={() => remove(r.id)}><Trash2 /></Button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
