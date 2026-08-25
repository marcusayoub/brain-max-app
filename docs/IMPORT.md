# Import spec

## The principle

The import **reduces**. It does not organise.

Sixty pasted lines come back as two or three goals, four or five habits, and a
sentence saying the rest is archived. Not a sixty-row approval queue — nobody
finishes those, and a queue is a worse first session than typing three goals by
hand.

The magic moment is: *we read your notes, here's what you actually keep saying
you want.* The service is deletion.

## Why it sits after Phase 4

The import produces goals and habits. Until those exist and I know what a
well-formed one looks like in this system, there is nothing to import *into*.

## Sources

**This phase:** paste, and plain text / markdown file upload.

**Later, if paste proves people have notes worth importing:** screenshot OCR via
a vision model, and Notion (it has a real API).

**Not buildable — do not put these in the UI:**
- Apple Notes has no public API. Paste or screenshot only.
- Google Keep's API is Workspace-scoped, not available for consumer accounts.
- Native share sheet needs a native app. This is a web app.

## The flow

1. **Paste or upload.** One big text box. No formatting requirements, no
   instructions about structure. Placeholder shows a messy example so people
   know mess is fine.

2. **Processing.** One server-side Anthropic call. Show what it's doing in
   plain language — this is the moment that earns trust.

3. **The verdict.** Not a list of everything found. A short screen:
   - 2–3 proposed six-month goals, each already specific enough to be checkable
   - 4–6 proposed habits, each already attached to one of those goals
   - one line: "We archived the other 47 items — you can pull any of them back."

4. **Edit and approve.** Every proposed item is editable inline. One button
   accepts the set. Editing must be faster than retyping.

5. **Archive is browsable**, searchable, and never surfaced again unasked.

## Classification

The model returns JSON only. Categories:

`goal` — a long-term outcome. Vague ones get **rewritten** into checkable form
and flagged `was_vague: true` so the UI can show the original alongside.

`habit` — a repeatable behaviour. Gets attached to whichever goal it serves.

`quote` — someone else's words. Goes to the quote library, not the goal system.

`affirmation` — a self-statement. **Do not turn these into daily prompts.**
Repeating positive self-statements makes people with low self-esteem feel worse
(Wood et al., 2009), and that is our user. Archive them, or offer to convert
one into a value statement — "I care about X" rather than "I am X."

`task` — one-off. Archive with a note that this app isn't a to-do list.

`journal` — reflection. Seeds the diary history.

`stale` — outdated, contradicted, or clearly abandoned. Archive silently.

## Deduplication

The example that matters: *go to gym / workout 4x per week / lift weights /
exercise every day* is **one** intention, badly written four times. Collapse it
into a single habit and say what was merged, so the user can see the app
understood rather than lost things.

Cluster by intent, not by wording.

## The vagueness rule

This is where import and the specificity thesis meet, and it's the part most
likely to go wrong.

The raw notes will be full of "become more confident", "stop comparing myself
to others", "remember that I am capable of doing difficult things." These are
exactly what the goal flow is built to reject.

So the importer must **rewrite them into checkable form**, showing both:

> You wrote: *become more confident*
> We read that as: **speak up unprompted in every seminar this quarter**
> Not right? Rewrite it.

Never save a vague goal silently. Never drop one silently either.

## Prompt location

`lib/prompts/import.ts`. Keep it in one file, keep the schema in the same file,
and keep it easy to tune — this prompt will need twenty revisions.

Model: `claude-sonnet-4-6`. Server-side only.

## What to check before building any of this

Ask the testers to screenshot the self-improvement notes they actually have.
If most send back four lines or nothing, the import serves a smaller audience
than assumed and the empty-state problem needs a different answer. That's a
text message, not a build.
