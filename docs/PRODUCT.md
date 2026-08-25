# Product spec

## The problem

People move through their days on autopilot. They have habits, they have vague
ambitions, and the two are not connected to each other. Nobody can tell you what
this Tuesday was in service of.

## The thesis

Connect daily action back to stated intent, and make that connection visible,
not just implied. A habit or task attached to a named goal is a different
experience from the same item floating alone. The product's job is to make
that link feel real, not to maximize how much it tracks.

Small number of features, done exceptionally well, beats a large surface area.

## Sections

Four areas. Home has a daily rhythm; the rest are visited, not browsed daily.

### 1. Home

The daily space. Answers "what matters today" without becoming a dashboard.

- **Tasks**: one-off items. Complete them, or carry them to tomorrow. Carrying
  a task over is never framed as failure — after a few carries, the app asks
  once, gently, whether it's still worth keeping.
- **Habits**: daily non-negotiables, grouped under the goal each one serves.
  Checked fresh each day; missing a day doesn't carry over, doesn't delete the
  habit, and isn't shown as broken. Unattached habits appear in their own
  group, labelled plainly.
- **Diary**: one open question, one text box. "How did today go?" No
  questionnaire. This is the input the reframe engine and Progress learn from.
- **Quotes**: a passive collection the user adds to and browses.

### 2. Goals

Longer-term things the user wants. Create, edit, archive, or mark complete.
Optional target date. Optional habits/tasks attached.

Creating a goal is frictionless — one field, save, done. No required "why," no
motivation statement, no interrogation. A non-blocking AI suggestion may exist
later, but it never gates saving.

Goals are revisitable, not permanent. Archiving or rewriting a goal never
reads as failure — apps that treat abandoned goals as dead weight fill up and
get deleted.

### 3. Mindset — entered from a moment

Launches small: the reframe loop only. Something went badly; user writes what
happened in a sentence or two. The app asks two or three questions to surface
the automatic interpretation. User writes the alternate reading themselves —
the app never writes it for them.

Target: under ninety seconds start to finish.

Self-talk and visualization are real ideas but have no design work behind them
yet — don't build them until reframing has proven itself.

### 4. Progress — reviewed weekly, never daily

Reflection, not statistics. Built from what's already collected — habits,
tasks, diary entries, goals — to surface what actually happened, in a sentence
a person would say to a friend, not a scorecard.

> This week you were more consistent with exercise, and your diary entries
> from those days mention feeling more energized.

A small amount of supporting data may sit underneath. It never leads.

Returning after a break is always welcoming, never a report of what was
missed. No streak language, no "you fell behind."

## Not in the MVP

Focus (sessions, phone usage, blocking, grayscale) — needs native OS access,
separate build. Growth (reading, cognitive challenges). WHOOP and Apple
Health. Import from Notion or elsewhere. Social features. Payments.

All of these are real future ideas, not commitments. Build only when there's
an actual reason to, not because the category exists.

## What is never shown

- A composite score of any kind, blended or otherwise.
- Daily mood ratings.
- Broken-streak messaging, "you missed N days," or any shame framing.
- Total time spent in the app.

Show counts honestly labelled as counts. No gamification — no points, XP,
badges, levels, or leaderboards, anywhere.

## Free vs paid

Free: goals, tasks, habits, diary, quotes, Progress in basic form. The product
works fully.

Paid: the AI layer — the reframe engine, Progress written from actual data,
full history.

Do not price this yet.

## Design direction

Premium, dark-first, restrained — closer to a high-end performance app than a
productivity dashboard, but never a copy of one. Motivating without being
aggressive; calm even with a full task list.

- **Surfaces**: near-black ground with charcoal/deep-gray elevated tiers, not
  pure black everywhere. Not everything belongs in a card — some content sits
  directly on the background.
- **Type**: one confident grotesk family (already loaded: Geist), carrying all
  hierarchy through weight, size, and spacing rather than mixing typefaces.
- **Accent**: one restrained signature color for actions and state. Used
  sparingly, never decoratively.
- **Motion**: subtle and purposeful — task/habit completion, page transitions,
  opening the diary. Should feel expensive, not flashy. Respect
  `prefers-reduced-motion`.

### Signature elements

Two, deliberately not more, and neither is a new feature — both are ways of
rendering the relationships and content that already exist.

1. **The thread.** A quiet connecting line from a goal down through its
   attached habits and tasks to today's completions. Normally inert. The
   moment something attached to that goal is completed, a brief glow travels
   that segment of the line and settles — a few hundred milliseconds, then
   gone. Not a meter, nothing accumulates — it's a momentary confirmation that
   this action fed that goal, which is the actual thesis of the product made
   visible. This is why goal/habit/task relationships matter enough to model
   explicitly in the data, not just as a foreign key.
2. **Etched goal statements.** A saved goal's statement renders with a subtle
   inset/engraved treatment — soft light from one direction, shadow from the
   other — instead of flat colored text. Declared, not typed into a form.
   Cheap (CSS only), no new asset or dependency.

Explicitly avoided: any waveform, pulse-line, or heart-rate-style motif —
that visual language already belongs to health wearables and would read as
homage rather than as its own thing.

Empty states are invitations, not apologies. Errors say what happened and
what to do.
