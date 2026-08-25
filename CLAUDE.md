# CLAUDE.md

Read this first, every session. Then read `docs/PRODUCT.md` before writing any feature code.

## What this is

**Brain-Max** — a mobile-first web app that connects daily action (tasks,
habits) back to the goals a person has actually named, instead of tracking
either in isolation. Premium, dark-first, calm even with a full task list.
No gamification, no scores, no shame for missed days.

## Who I am

I am new to coding. When you give me terminal commands:

- Tell me exactly where to type them (which folder, which terminal).
- Give one command at a time when something can fail.
- Tell me what I should see if it worked.
- Do not assume I know what a flag, env var, or migration is — say it plainly.

When you finish a chunk of work, tell me what to click to check it myself.

## Stack

- **Next.js** (App Router, TypeScript) — the app itself
- **Tailwind CSS** — styling
- **Supabase** — auth + Postgres database
- **Anthropic API** (`claude-sonnet-4-6`) — the reframe engine and pattern detection
- **Vercel** — hosting

No native app yet. This is a web app people add to their phone home screen.
Do not add React Native, Expo, or any app-store tooling.

## Rules

1. **Ship one thing at a time.** Check `docs/ROADMAP.md` for what's current.
   Do not build ahead.
2. **No new dependencies without telling me first** — say what it does and why
   the built-in option won't work.
3. **No localStorage for user data.** Everything real goes in Supabase so I can
   see what testers actually do.
4. **Secrets live in `.env.local`**, which is gitignored. Never put an API key in
   a file that gets committed.
5. **Every AI call happens server-side** in a route handler. The Anthropic key
   never reaches the browser.
6. **Write the migration file** when you change the database. Don't edit tables
   only through the Supabase dashboard.

## What this app is not

Not a habit tracker with extra screens. Not a meditation app. Not a journal.
If a feature doesn't help someone see or close the gap between what they said
they wanted and what they did today, it doesn't belong.

There is no composite "brain score". Show real counts, never a blended index.

## Current status

Product pivoted from the original "Autopilot" light/quiet-room direction to
Brain-Max: dark-first, premium, with Tasks as a first-class entity and no
Morning Intention. `docs/PRODUCT.md` and `docs/ROADMAP.md` reflect the new
direction; the app itself is being rebuilt to match — see
`docs/ROADMAP.md` for current phase status.

Email delivery for magic links runs through Resend as custom SMTP (set up in
Supabase's Authentication → Emails settings) — the free built-in Supabase
sender is rate-limited to a couple emails/hour and isn't enough even for
solo testing.

@AGENTS.md
