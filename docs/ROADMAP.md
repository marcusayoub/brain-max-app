# Roadmap

Build in order. Do not start a phase before the one above it runs on a real
phone. Mark phases done here as you go.

---

## Phase 0 — it runs and it deploys — NOT STARTED

Next.js + TypeScript + Tailwind. One page that says the app name. Pushed to
GitHub, deployed to Vercel, opening correctly on my phone.

Nothing else. The point is to prove the pipeline works before there's anything
to lose.

**Done when:** I can open the Vercel URL on my phone and see the page.

---

## Phase 1 — accounts

Supabase auth, email magic link. Sign in, sign out, a protected page that shows
my email. RLS turned on from the start.

**Done when:** two different accounts see two different empty states.

---

## Phase 2 — goals

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

## Later — not now

Focus section: sessions, phone usage, blocking, grayscale. Needs native access,
crowded category, separate build.
Growth section: reading, learning, cognitive challenges.
Payments and pricing. Decide after retention is known.
