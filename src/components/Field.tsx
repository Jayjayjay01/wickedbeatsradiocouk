import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

const cls = "w-full rounded border border-graphite bg-void/70 px-4 py-3 outline-none transition-colors focus:border-pink";

export function Field({ label, error, textarea, ...p }: { label: string; error?: string; textarea?: boolean } & InputHTMLAttributes<HTMLInputElement> & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="block">
      <span className="label-mono mb-1.5 block text-muted-foreground">{label}</span>
      {textarea ? <textarea rows={4} className={cls} {...p} /> : <input className={cls} {...p} />}
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  );
}

/** Hidden field bots fill in; humans never see it. Neutral name/label so mobile autofill skips it. */
export function Honeypot({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
      <input type="text" name="wb_hp_field" tabIndex={-1} autoComplete="new-password" data-lpignore="true" data-1p-ignore value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
