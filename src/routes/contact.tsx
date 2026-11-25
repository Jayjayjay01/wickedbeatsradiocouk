import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { z } from "zod";
import { Check, Loader2 } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { Field, Honeypot } from "@/components/Field";
import { Button } from "@/components/ui/button";
import { useServerFn } from "@tanstack/react-start";
import { sendContact } from "@/lib/contact.functions";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/contact")({
  head: () => seo({ title: "Get In Touch | Wicked Beats Radio", description: "Contact Wicked Beats Radio, Birmingham's 24/7 internet radio station.", path: "/contact" }),
  component: Contact,
});

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().max(40).optional(),
  message: z.string().trim().min(1, "Message is required").max(2000),
});

function Contact() {
  const [f, setF] = useState({ name: "", email: "", phone: "", message: "" });
  const [hp, setHp] = useState("");
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "busy" | "ok">("idle");
  const [err, setErr] = useState("");
  const send = useServerFn(sendContact);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  const reveal = (sel: string) => requestAnimationFrame(() => {
    const el = document.querySelector<HTMLElement>(sel);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) el.focus({ preventScroll: true });
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === "busy") return;
    // Only treat as bot if the hidden field is filled AND the visible form is empty (guards against mobile autofill).
    if (hp && !f.message.trim()) { setState("ok"); return; }
    const p = schema.safeParse(f);
    if (!p.success) {
      const map = Object.fromEntries(p.error.issues.map((i) => [i.path[0], i.message]));
      setErrs(map);
      const first = ["name", "email", "phone", "message"].find((k) => map[k]);
      if (first) reveal(`[name="${first}"]`);
      return;
    }
    setErrs({});
    setState("busy");
    setErr("");
    try {
      const r = await Promise.race([
        send({ data: p.data }),
        new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), 25000)),
      ]);
      if (!r.ok) { setState("idle"); setErr(`${r.error} Please try again.`); reveal("#contact-error"); return; }
      setState("ok");
      reveal("#contact-card");
    } catch {
      setState("idle"); setErr("Couldn't send your message, please check your connection and try again."); reveal("#contact-error");
    }
  };

  return (
    <>
      <PageHero label="// Holla at us" title={<>Get In <span className="text-pink">Touch</span></>}>
        Bookings, collabs, DJ applications or just to say hi, drop us a message.
      </PageHero>
      <section className="mx-auto max-w-2xl px-4">
        <div id="contact-card" className="panel relative scroll-mt-24 rounded-2xl p-6 md:p-8">
          {state === "ok" ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-10 text-center" role="status">
              <motion.div initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 260, damping: 14 }} className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-pink-grad glow-pink">
                <Check className="h-10 w-10 text-primary-foreground" />
              </motion.div>
              <p className="font-slant mt-6 text-5xl">Message <span className="text-pink">received</span></p>
              <p className="mt-2 text-muted-foreground">Thanks for reaching out, we'll be in touch.</p>
            </motion.div>
          ) : (
            <form onSubmit={submit} className="space-y-4" noValidate>
              <Honeypot value={hp} onChange={setHp} />
              <Field label="Name *" name="name" value={f.name} onChange={set("name")} maxLength={100} error={errs.name} autoComplete="name" />
              <Field label="Email *" name="email" type="email" inputMode="email" autoCapitalize="none" autoCorrect="off" value={f.email} onChange={set("email")} maxLength={255} error={errs.email} autoComplete="email" />
              <Field label="Contact Number (optional)" name="phone" type="tel" inputMode="tel" value={f.phone} onChange={set("phone")} maxLength={40} autoComplete="tel" />
              <Field label="Message *" name="message" textarea value={f.message} onChange={set("message")} maxLength={2000} error={errs.message} />
              {err && <p id="contact-error" className="rounded border border-destructive bg-destructive/10 p-3 text-sm text-destructive" role="alert">{err}</p>}
              <Button type="submit" variant="hero" size="xl" className="w-full touch-manipulation" disabled={state === "busy"}>
                {state === "busy" ? <><Loader2 className="animate-spin" /> Sending…</> : "Send message"}
              </Button>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
