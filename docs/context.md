# CONTEXT.md

## What this project is

A take home assessment for a technical internship at Ventureship. I am building Ticket 02, the Submission Scorer. Hard cap of three hours of focused work, so prioritise working code over polish. A clean submission with one strong test beats an ambitious one that tried to do everything.

## The feature

A scoring flow for a candidate submission.

1. A page shows a hardcoded candidate submission (text provided below).
2. A "generate draft score" button calls Claude server side. Claude returns five pillar scores, each out of 20, plus per pillar feedback.
3. The five pillars are: Analytical Rigour, Commercial Acumen, Quality of Output, Communication, Initiative and Ownership.
4. A reviewer interface lets each pillar score and feedback be edited inline.
5. A publish button locks the score. State machine has three states: draft, then reviewed, then published. Editing a published score must fail visibly (disabled inputs plus an error message, not a silent no op).
6. A published view shows the final per pillar scores, total out of 100, tier, and feedback. This is what the candidate would see.

## Hardcoded submission text

"I went deep on the audience side first. The TEDxManchester ticket data shows 62 percent of attendees are 28 to 42, professional, design conscious. I built a single master deck that leans into that. Then I tailored three versions, one for Marks and Spencer, one for Lululemon, one for Ace Hotel. The pricing tiers are 5k, 15k, 35k. I decided against programmatic banner ads because the audience hates them."

## Hard requirements (failing any one fails the assessment)

1. At least one meaningful test for the score aggregation function. It returns the total out of 100 and the tier: Exceptional for 90 or above, High Performer for 80 to 89, Promising for 60 to 79, Developing below 60. Must include edge cases at the tier boundaries (90, 80, 60). Tests run with a single command (npm test) and pass.
2. Deployed live on Vercel. A preview URL is fine.
3. The Anthropic API key lives in server side environment variables only. Never committed to git, never in client code. Ensure .env.local is in .gitignore.
4. Short README (half a page).
5. All AI calls happen in a server side API route, never from the browser.

## Stack

Next.js (App Router) on Vercel. Anthropic SDK for the Claude call. No database. State lives in React state or localstorage. No auth, no multi user support, no email.

## Architecture

Keep core logic in pure, testable modules separate from the UI:

- `lib/aggregate.ts` — takes five pillar scores, returns { total, tier }. Pure function.
- `lib/stateMachine.ts` — states draft, reviewed, published. Explicit transition functions and an edit guard that rejects changes when state is published. Pure module.
- `app/api/score/route.ts` — server side route. Sends the submission text to Claude, asks for strict JSON only (five pillars, score out of 20, feedback string each), validates the response shape before returning it. A malformed Claude response returns a clear error, it never crashes the app.
- UI components consume these modules. Edits must flow through the state machine module so the publish lock is actually enforced, not just visually disabled.

## Views

1. Submission view: the hardcoded text plus the generate button.
2. Reviewer view: five pillars with inline editable score and feedback fields, plus a publish button.
3. Published view: read only, shows total out of 100, tier, and per pillar feedback.

These can be one page with conditional rendering by state, or separate routes. Simple beats clever.

## Testing

Use Vitest (or Jest). Required test file covers the aggregation function at tier boundaries: 90 (Exceptional), 89 and 80 (High Performer), 79 and 60 (Promising), 59 (Developing). If cheap, add a test that the state machine rejects edits in the published state.

## What to explicitly skip

Authentication, real databases, email, pixel perfect design, multi user support, exhaustive error handling for edge cases that will never happen.

## Working style

- Build in small stages, each producing something working: aggregation function, then its test, then the state machine, then the API route, then the views in order (submission, reviewer editing, publish lock, published view).
- Deploy early and often so deployment issues surface at the start, not the end.
- Write readable code someone can trust six months from now. Prefer boring, explicit solutions.
- If a decision is ambiguous, make a sensible choice and flag it so I can document it in the README.
- Do not over engineer. Time budget is three hours total including README and recording.