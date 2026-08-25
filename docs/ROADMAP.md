# Roadmap

Build in order. Mark phases done here as you go.

---

## Phase 0 — it runs and it deploys — DONE

Next.js + TypeScript + Tailwind. Pushed to GitHub, deployed to Vercel.

---

## Phase 1 — accounts — DONE

Supabase auth, email magic link. Sign in, sign out. RLS turned on from the
start.

---

## Phase 2 — goals — DONE, revised

Create, view, edit, archive, or mark complete a goal. Optional target date.
No required "why." No blocking AI check — creating a goal is one field and a
save, always.

**Done when:** a goal can be created in one step, and later archived or
marked complete without either reading as failure.

---

## Phase 3 — Home MVP — IN PROGRESS

The real build. Dark-first design system (see `docs/PRODUCT.md`). Both
signature elements — the thread, etched goal statements.

- **Tasks**: one-off items, swipe right to complete / swipe left to carry to
  tomorrow, buttons as a fallback. After a few carries, ask once whether it's
  still worth keeping — never framed as failure.
- **Habits**: create, edit, archive, check off daily, grouped by goal.
- **Diary**: one open text box, one entry per day.
- **Quotes**: text, author, optional note.

**Done when:** the home screen makes Tasks and Habits immediately
distinguishable, and the thread visibly connects a goal to what was done
today.

---

## Phase 4 — Mindset (reframe only)

`Something happened` opens the flow. Situation → two or three questions that
surface the automatic thought → user writes their own alternate reading.
Under ninety seconds. Prompt lives in `lib/prompts/reframe.ts`. The model asks
questions; it never writes the reframe.

Self-talk and visualization stay out until reframing has proven itself.

**Done when:** run it on something that actually happened and it helped.

---

## Phase 5 — Progress

One generated paragraph reflecting the week back — built from habits, tasks,
diary entries, and goals — with at most a couple of small supporting numbers
underneath. Never leads with numbers. Returning after a break is always
welcoming, never a report of what was missed.

**Done when:** it says something true and useful, not a stats readout.

---

## Phase 6 — refinement

Stronger Goal ↔ Habit ↔ Task visual relationships, better Progress insights,
animation polish, expand Mindset (self-talk, visualization) only once
reframing is proven, continued UX polish.

---

## Phase 7 — import

Spec lives in `docs/IMPORT.md`. The import reduces — sixty pasted items come
back as a handful of goals/habits plus an archive, not an approval queue.
Paste and file upload only to start; Notion later if paste proves people have
notes worth importing. Apple Notes has no public API — paste flow covers it.

**Done when:** a messy real list comes back as something worth keeping.

---

## Later — not now

Focus (sessions, phone usage, blocking, grayscale) — needs native OS access
(iOS Family Controls, Android UsageStats) a web app can't reach. When it's
time: a small companion native app talking to the same Supabase backend,
not a rewrite of what already works.

Growth (reading, cognitive challenges). WHOOP. Apple Health. Social features.
Payments and pricing — decide after retention is known.

None of these get built because the category exists — only when there's an
actual reason to.
