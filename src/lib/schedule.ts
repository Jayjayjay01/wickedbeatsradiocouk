import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Slot = { day: number; start: number; end: number; dj: string; auto?: boolean };
export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export const AUTO = "AUTO DJ";

const FALLBACK = `Mon: 1am-2am DJ DARION; 2am-5am AUTO DJ; 7am-10am AUTO DJ; 10am-12pm AUTO DJ; 12pm-2pm DJ DANNY BIT OF EVERYTHING; 2pm-4pm DJ STEVIE B; 4pm-6pm BJAMINOLI GROOVE TECHNO / EBM; 6pm-8pm BJAMINOLI PROGRESSIVE HOUSE / TRANCE; 8pm-10pm DJ HARAS; 10pm-12am AUTO DJ
Tue: 12am-2am AMY H.GRAVES; 2am-5am AUTO DJ; 7am-10am JADIE AT BREAKFAST; 10am-1pm DJ LEXI MIX MUSIC; 1pm-3pm DJ MBLESS1 MIX SELECTION; 3pm-5pm AUTO DJ; 5pm-7pm AUTO DJ; 7pm-9pm DJAIDED TRANCE / TECHNO / HOUSE; 9pm-10pm DJ ALTRIX; 10pm-12am DJ ROOSTA
Wed: 1am-3am ROB CHARLES; 3am-5am AUTO DJ; 7am-10am AUTO DJ; 10am-12pm AUTO DJ; 12pm-2pm SLIPBEATS SOUL RNB HIPHOP; 2pm-4pm DJ TRACEY B; 4pm-6pm DJ TOPLINKS REGGAE; 6pm-8pm DJ BROOKLYN RICH; 8pm-10pm DJ ECLIPSE; 10pm-12am DJ BAPS REGGAE
Thu: 12am-2am DJ BAPS REGGAE; 2am-5am AUTO DJ; 7am-10am JADIE AT BREAKFAST; 10am-12pm DJ SHREYZE; 12pm-2pm DJ FLASH; 2pm-4pm DJ TOPLINKS REGGAE; 4pm-6pm AUTO DJ; 6pm-8pm ANDIAMDJ; 8pm-10pm SOUNDBUDZ MUSIC; 10pm-11pm TYRAMYX HARDCORE JUNGLE / DNB; 11pm-12am KENOBI DRUM AND BASS
Fri: 1am-3am DJ YINKA; 4am-6am AUTO DJ; 7am-10am AUTO DJ; 10am-12pm DJ DON E; 12pm-2pm DJ RIARHYTEM; 2pm-4pm AUTO DJ; 4pm-6pm DJ STEVIE B REGGAE; 6pm-8pm DJ HINT BOMB; 8pm-10pm DJ FYAH DANCEHALL; 10pm-12am DJ XREOSS SPOT LIGHT
Sat: 12am-1am DJ DON E; 1am-2am WICKED VYBES WITH JASON SPACE; 4am-6am AUTO DJ; 9am-12pm STEVIE J; 12pm-2pm AUTO DJ; 2pm-3pm ANDIAMDJ; 3pm-4pm ANDIAMDJ; 4pm-6pm AUTO DJ; 6pm-8pm DJ EDDIE KANE SOULTRY SATURDAYS; 8pm-10pm AUTO DJ; 10pm-12am AUTO DJ
Sun: 12am-1am DJ APEX; 1am-3am ROB CHARLES; 4am-6am AUTO DJ; 9am-12pm AUTO DJ; 12pm-2pm DJ TRACEY B; 2pm-4pm DJ FYAH SOCA; 4pm-6pm DJ STEVIE B REGGAE; 6pm-8pm DJ BAPS REGGAE; 8pm-10pm NIGHTWALKER; 10pm-12am DJ MBLESS1 DANCEHALL / REGGAE`;

/** Accepts "1am", "1:00 AM", "13:00", "01:00", "noon", "midnight". Returns minutes. */
export function parseTime(raw: string, isEnd = false): number | null {
  const s = raw.trim().toLowerCase().replace(/\./g, "");
  if (!s) return null;
  if (s === "noon") return 720;
  if (s === "midnight") return isEnd ? 1440 : 0;
  const m = s.match(/^(\d{1,2})(?::?(\d{2}))?\s*(am|pm|a|p)?$/);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  const ap = m[3];
  if (ap) {
    if (h === 12) h = 0;
    if (ap.startsWith("p")) h += 12;
  }
  if (h > 24 || min > 59) return null;
  let v = h * 60 + min;
  if (isEnd && v === 0) v = 1440;
  return v;
}

function dayIndex(s: string): number {
  const k = s.trim().toLowerCase().slice(0, 3);
  return ["mon", "tue", "wed", "thu", "fri", "sat", "sun"].indexOf(k);
}

function parseFallback(): Slot[] {
  const out: Slot[] = [];
  for (const line of FALLBACK.split("\n")) {
    const [d, rest] = line.split(":");
    const day = dayIndex(d);
    const body = line.slice(d.length + 1);
    void rest;
    for (const part of body.split(";")) {
      const m = part.trim().match(/^(\S+)\s*-\s*(\S+)\s+(.+)$/);
      if (!m) continue;
      const start = parseTime(m[1]);
      const end = parseTime(m[2], true);
      if (start == null || end == null) continue;
      out.push({ day, start, end, dj: m[3].trim() });
    }
  }
  return out;
}

function parseCSVRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.trim()));
}

export function parseScheduleCSV(text: string): Slot[] {
  const rows = parseCSVRows(text);
  if (rows.length < 2) return [];
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const find = (...keys: string[]) => head.findIndex((h) => keys.some((k) => h.includes(k)));
  const di = find("day");
  const si = find("start", "from");
  const ei = find("end", "to");
  const ni = find("dj", "show", "presenter", "host", "name");
  const ti = find("time", "slot");
  if (di < 0 || ni < 0) return [];
  const out: Slot[] = [];
  let lastDay = -1;
  for (const r of rows.slice(1)) {
    const d = dayIndex(r[di] ?? "");
    const day = d >= 0 ? d : lastDay;
    if (day < 0) continue;
    lastDay = day;
    let sRaw = si >= 0 ? r[si] : "";
    let eRaw = ei >= 0 && ei !== si ? r[ei] : "";
    if ((!sRaw || !eRaw) && ti >= 0 && r[ti]?.includes("-")) [sRaw, eRaw] = r[ti].split("-");
    const start = parseTime(sRaw ?? "");
    const end = parseTime(eRaw ?? "", true);
    const dj = (r[ni] ?? "").replace(/\s+/g, " ").trim();
    if (start == null || end == null || !dj) continue;
    out.push({ day, start, end: end <= start ? 1440 : end, dj: dj.toUpperCase() });
  }
  return out;
}

export function fillGaps(slots: Slot[]): Slot[] {
  const out: Slot[] = [];
  for (let d = 0; d < 7; d++) {
    const day = slots.filter((s) => s.day === d).sort((a, b) => a.start - b.start);
    let t = 0;
    for (const s of day) {
      if (s.start > t) out.push({ day: d, start: t, end: s.start, dj: AUTO, auto: true });
      out.push({ ...s, auto: s.dj.toUpperCase() === AUTO });
      t = Math.max(t, s.end);
    }
    if (t < 1440) out.push({ day: d, start: t, end: 1440, dj: AUTO, auto: true });
  }
  return out;
}

export const FALLBACK_SLOTS = fillGaps(parseFallback());

/** Current time in Europe/London (handles BST/GMT). day: 0=Mon. */
export function londonNow(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? "0";
  const day = dayIndex(g("weekday"));
  const minutes = parseInt(g("hour"), 10) * 60 + parseInt(g("minute"), 10) + parseInt(g("second"), 10) / 60;
  return { day, minutes, week: day * 1440 + minutes };
}

export function fmt(min: number) {
  const m = Math.round(min) % 1440;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  const ap = h < 12 ? "am" : "pm";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}${mm ? ":" + String(mm).padStart(2, "0") : ""}${ap}`;
}
export const fmtRange = (s: Slot) => `${fmt(s.start)} – ${fmt(s.end)}`;

export function currentSlot(slots: Slot[], now: { day: number; minutes: number }) {
  return slots.find((s) => s.day === now.day && now.minutes >= s.start && now.minutes < s.end) ?? null;
}

/** Upcoming shows (skips AUTO DJ by default), with minutes until start. */
export function upcoming(slots: Slot[], now: { week: number }, n = 3, skipAuto = true) {
  const list = slots
    .filter((s) => !(skipAuto && s.auto))
    .map((s) => {
      let until = s.day * 1440 + s.start - now.week;
      if (until <= 0) until += 10080;
      return { slot: s, until };
    })
    .sort((a, b) => a.until - b.until);
  return list.slice(0, n);
}

export function fmtCountdown(min: number) {
  const m = Math.max(0, Math.round(min));
  const d = Math.floor(m / 1440);
  const h = Math.floor((m % 1440) / 60);
  const mm = m % 60;
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${mm}m`;
  return `${mm}m`;
}

const CACHE_KEY = "wb-schedule-v3";
const TTL = 5 * 60 * 1000;

export function useSchedule() {
  const [slots, setSlots] = useState<Slot[]>(FALLBACK_SLOTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const toMin = (t: string, isEnd: boolean) => {
      const [h, m] = t.split(":").map(Number);
      const v = h * 60 + m;
      return isEnd && v === 0 ? 1440 : v;
    };
    const load = async (force = false) => {
      try {
        if (!force) {
          const c = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
          if (c && Date.now() - c.at < TTL && c.slots?.length) {
            setSlots(c.slots);
            setLoading(false);
            return;
          }
        }
        const { data, error } = await supabase
          .from("schedule_entries")
          .select("day_of_week,start_time,end_time,title,host")
          .order("day_of_week")
          .order("start_time");
        if (error || !data?.length) throw new Error();
        const parsed: Slot[] = data.map((r) => {
          const start = toMin(r.start_time, false);
          const end = toMin(r.end_time, true);
          return { day: r.day_of_week, start, end: end <= start ? 1440 : end, dj: (r.host || r.title).replace(/\s+/g, " ").trim() };
        });
        const filled = fillGaps(parsed);
        if (!alive) return;
        setSlots(filled);
        localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), slots: filled }));
      } catch {
        /* keep fallback */
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    const id = window.setInterval(() => load(true), TTL);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  return { slots, loading };
}

/** London time, ticking every 30s. null until mounted (avoids SSR mismatch). */
export function useLondonNow(interval = 30000) {
  const [now, setNow] = useState<ReturnType<typeof londonNow> | null>(null);
  useEffect(() => {
    setNow(londonNow());
    const id = window.setInterval(() => setNow(londonNow()), interval);
    return () => window.clearInterval(id);
  }, [interval]);
  return now;
}

export function uniqueDJs(slots: Slot[]) {
  const map = new Map<string, Slot[]>();
  for (const s of slots) {
    if (s.auto) continue;
    const k = s.dj;
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(s);
  }
  return [...map.entries()].map(([name, list]) => ({ name, slots: list }));
}
