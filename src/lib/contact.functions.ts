import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

const TO_EMAIL = "wickedbeatsradio@gmail.com";
const FROM_EMAIL = "Wicked Beats Radio <forms@wickedbeatsradio.co.uk>";

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(40).optional(),
  message: z.string().trim().min(1).max(2000),
});

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export const sendContact = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => schema.parse(d))
  .handler(async ({ data }) => {
    const RESEND_API_KEY = process.env["RESEND_API_KEY"];

    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const db = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });
    const { error: dbErr } = await db.from("contact_submissions").insert({ ...data, phone: data.phone || null });
    if (dbErr) {
      console.error("contact insert failed", dbErr);
      return { ok: false as const, error: "Couldn't save your message." };
    }

    const html = `<h2>New website enquiry</h2>
<p><strong>Name:</strong> ${esc(data.name)}</p>
<p><strong>Email:</strong> ${esc(data.email)}</p>
${data.phone ? `<p><strong>Phone:</strong> ${esc(data.phone)}</p>` : ""}
<p><strong>Message:</strong></p><p style="white-space:pre-wrap">${esc(data.message)}</p>`;
    const text = `Name: ${data.name}\nEmail: ${data.email}\n${data.phone ? `Phone: ${data.phone}\n` : ""}\nMessage:\n${data.message}`;

    // Message is already saved; the email is a notification. Never let it hang the form.
    try {
      if (!RESEND_API_KEY) throw new Error("Email service not configured");
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        signal: AbortSignal.timeout(15000),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [TO_EMAIL],
          reply_to: data.email,
          subject: `New enquiry from ${data.name}`,
          html,
          text,
        }),
      });
      if (!res.ok) console.error(`Resend failed [${res.status}]: ${await res.text()}`);
    } catch (e) {
      console.error("Resend request failed", e);
    }
    return { ok: true as const };
  });
