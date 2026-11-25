<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Project rules

- All editable station values (stream, schedule CSV, socials, PayPal, images) live in `src/config.ts`; components read from there so the owner edits one file.
- Audio, star field, visualiser, header and player live in `src/routes/__root.tsx` outside `<Outlet />` so music never stops on navigation.
- All canvas work runs through the single RAF loop in `src/lib/loop.ts`; per-frame audio data is the mutable `signal` singleton in `src/lib/signal.ts` (no React state per frame).
- Schedule is read from the `schedule_entries` table (public read, admin write) with a built-in fallback in `src/lib/schedule.ts`; times are Europe/London.
- Forms insert directly from the browser under insert-only RLS; admin access is via `user_roles` (first signed-up account becomes admin).

- Christmas strings and message frames share the Bulb renderer and CSS light-material tokens so their appearance and motion preferences stay consistent.
