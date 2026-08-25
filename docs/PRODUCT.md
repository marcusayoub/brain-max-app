# Product spec

## The problem

People move through their days on autopilot. They have habits, they have vague
ambitions, and the two are not connected to each other. Nobody can tell you what
this Tuesday was in service of.

## The thesis

Specificity is the intervention. Make someone name what they want in terms
concrete enough that anyone could tell whether they hit it, then hang every
daily behaviour off that statement. A habit attached to a named goal is a
different experience from the same habit floating alone — and a habit attached
to nothing should be visible as such.

## Sections

Five tabs. Three of them are entered from a moment, not browsed.

### 1. Daily Brain — home

The only screen with a daily rhythm.

- **Morning**: today's intention, one line. Shows which goal it serves.
- **Habits**: short list, grouped under the goal each one serves. Unattached
  habits appear in their own group labelled plainly.
- **Evening**: diary entry, free text. This is the input the reframe engine
  learns from.
- **Quotes**: a passive collection the user adds to and browses.

Two buttons on this screen open other sections:
`Something happened` → Mindset. `Start working` → Focus.

### 2. Mindset — entered from a moment

The reframe loop. Something went badly; user writes what happened in a sentence
or two. The app asks two or three questions to surface the automatic
interpretation. Names the pattern if it has seen it before. User writes the
alternate reading themselves — the app does not write it for them.

Target: under ninety seconds start to finish.

Later: self-talk, visualization, mental exercises. Not in v1.

### 3. Focus — entered from a moment

Deep work sessions and phone usage. **Not in v1.** The blocking and grayscale
features need native OS access and are a separate build.

### 4. Growth — entered from a moment

Reading, learning, cognitive challenges. **Not in v1.**

### 5. Progress — reviewed weekly and monthly, never daily

The goal hierarchy lives here.

- **Six-month goal**: one to three, maximum. The app pushes back on vague
  wording — if someone writes "be more disciplined", it asks what they'd be
  doing in six months that they aren't doing now.
- **Monthly milestone**: what has to be true at the end of this month for the
  six-month goal to still be reachable.
- **Daily habits**: attached to a goal at the moment they're created.

**Monthly review** is the ritual and the retention event. Here's what you said,
here's what happened, here's what to change. Missing a day doesn't break it.

Every goal can be retired or rewritten without it reading as failure. Apps that
skip this fill up with dead goals and get deleted.

## What is never shown

- A composite "brain health score", or any blended index across unlike things.
- Daily mood ratings.
- Total time spent in the app.

Show counts and streaks honestly labelled as counts and streaks.

## Free vs paid

Free: goals, habits, morning intention, evening diary, quotes, monthly review
in basic form. The product works fully.

Paid: the AI layer — pattern detection across diary entries, the reframe engine,
the monthly review written from actual data, full history.

Conversion moment is the first monthly review, four weeks in, when there's real
data to show a preview of.

Do not price this yet.

## Design direction

The subject is attention and self-knowledge, so the interface should feel like
a quiet room, not a dashboard.

- **Palette**: paper-white ground (`#FAFAF8`), deep ink for text (`#16181D`),
  muted warm grey for secondary (`#8A8983`), and one saturated accent —
  a strong signal blue (`#1B4DFF`) — used *only* on the reframe flow and the
  goal statement. Nowhere else. Avoid cream-plus-serif-plus-terracotta and
  avoid dark-mode-with-acid-green; both are the current AI-design defaults.
- **Type**: a neutral grotesk for interface and data. Goal statements get set
  large in a face with real character — the user's own words should look
  typeset, like something declared rather than entered into a form.
- **Signature element**: the goal statement rendered at display size on
  Progress, with the habits serving it listed beneath as small marks. Habits
  attached to nothing sit visually detached from any statement. The layout
  itself is the argument.
- **Motion**: almost none. One deliberate transition entering the reframe flow,
  so it feels like stepping into a different room. Respect
  `prefers-reduced-motion`.

Empty states are invitations, not apologies. Errors say what happened and what
to do.
