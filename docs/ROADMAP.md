# Roadmap

Build in order. Do not start a phase before the one above it runs on a real
phone. Mark phases done here as you go.

---

## Phase 0 — it runs and it deploys — DONE

Next.js + TypeScript + Tailwind. One page that says the app name. Pushed to
GitHub, deployed to Vercel, opening correctly on my phone.

Nothing else. The point is to prove the pipeline works before there's anything
to lose.

**Done when:** I can open the Vercel URL on my phone and see the page.

---

## Phase 1 — accounts — DONE

Supabase auth, email magic link. Sign in, sign out, a protected page that shows
my email. RLS turned on from the start.

**Done when:** two different accounts see two different empty states.

Note: no app data tables exist yet, so there's nothing to apply RLS to besides
Supabase's own `auth.users`, which it manages itself. RLS becomes an action
item starting Phase 2, the first phase that creates a table.

---

## Phase 2 — goals — DONE

Create, view, edit, retire a six-month goal. The specificity check: when a
statement is vague, ask one follow-up question before saving. This is a plain
server-side call to the Anthropic API — keep the prompt in
`lib/prompts/specificity.ts` so it's easy to tune.

Goal statement gets the display treatment from the design direction.

**Done when:** I can write a vague goal, get pushed on it, and save a better one.

---

## Phase 3 — habits attached to goals

Create habits, attach each to a goal or leave it unattached. Check them off.
The home screen groups them by the goal they serve, with unattached ones shown
separately.

**Done when:** the home screen makes it obvious which habits point nowhere.

---

## Phase 4 — the daily loop

Morning intention, evening diary entry, quote collection. Nothing clever.

**Done when:** I've used it myself for five days straight without editing code.

---

## Phase 5 — import

Deliberately after Phase 4. You cannot build a good import until you know what
a well-formed goal looks like in your own system — build it earlier and you
build it twice.

Spec lives in `docs/IMPORT.md`. Read it before starting.

The import **reduces**. Sixty pasted items come back as a handful of goals and
habits plus an archive, not a sixty-row approval queue.

Sources for this phase: paste and file upload only. Screenshots and Notion
come later if the paste flow proves people actually have notes worth importing.

**Done when:** I can paste a messy real list and get back something I'd keep.

### Phase 5b — Notion import (later)

Only once Phase 5 proves people have notes worth importing. Notion has a real
API — OAuth connect, pull page content via the Blocks API, flatten to plain
text, then run it through the same pipeline in `lib/prompts/import.ts`
unchanged. No new classification logic needed, just a source-specific text
extraction step.

Apple Notes has no public API and is not buildable as a direct integration.
Users export/share their notes as text and use the Phase 5 paste flow instead
— that already covers it.

---

## Phase 6 — the reframe loop

`Something happened` opens the Mindset flow. Situation → two or three questions
that surface the automatic thought → user writes their own alternate reading.
Under ninety seconds.

Prompt lives in `lib/prompts/reframe.ts`. The model asks questions; it never
writes the reframe.

**Done when:** I've run it on something that actually annoyed me and it helped.

---

## Phase 7 — pattern detection

Across diary entries and reframes, surface recurring interpretations. "You've
framed four situations this month as personal failures where the cause was
outside your control."

Runs on demand, not on a schedule. Needs roughly twenty entries to say anything
worth reading — build the empty state honestly.

**Done when:** it tells me something about myself I hadn't noticed.

---

## Phase 8 — monthly review

The ritual. What you said, what happened, what to change. Milestones get set
and marked here.

---

## Phase 9 — WHOOP integration

After Phase 8, since it enhances the diary/review loop rather than blocking
anything before it. OAuth connect to WHOOP's API. Pull daily recovery score,
HRV, resting heart rate, and sleep summary; show them read-only next to that
day's diary entry — never blended into any score. In the monthly review, show
diary/reframe patterns and the recovery trend side by side and let the user
draw their own conclusion.

Tokens stored and refreshed server-side only, same rule as the Anthropic key.

**Done when:** a diary entry shows that day's actual WHOOP recovery data next
to what I wrote.

---

## Later — not now

Focus section: sessions, phone usage, blocking, grayscale. Needs native OS
access (iOS Family Controls, Android UsageStats) that a web app cannot reach —
this is a separate native build, not a Next.js feature. Options when it's
time: a small companion native app talking to the same Supabase backend
(smallest footprint, doesn't disturb the web app), Capacitor wrapping the web
app with custom native plugins, or a full React Native/Expo rewrite. Leaning
toward the companion-app route so the web app stays untouched, but not
deciding until this is actually next.

Mental training beyond the reframe loop: meditations, self-talk, visualization
exercises. No design rationale written yet, unlike the reframe loop — don't
scope until there's a specific reason to.

Growth section: reading, learning, cognitive challenges.
Payments and pricing. Decide after retention is known.
