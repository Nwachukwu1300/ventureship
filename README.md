# Submission Scorer

## Ticket Choice

I picked Ticket 02 (Submission Scorer) because it had a clear workflow with testable boundaries: generate, edit, publish, lock. The state machine requirement meant I could write meaningful tests without mocking everything.

## Stack

Next.js 15 (App Router), Anthropic SDK, Vitest. No database—state lives in localStorage. Chose this because it matches the assessment requirements exactly with no extra dependencies.

## What I Cut

- No auth or multi-user support
- No pixel-perfect design (functional styling only)
- No exhaustive error handling for impossible edge cases
- Skipped undo/history for edits

## AI Tools

I used Claude Code throughout. One moment I pushed back: Claude initially suggested clamping invalid scores (turning 25 into 20). I disagreed—if a score of 25 reaches the aggregation function, upstream validation already failed, and clamping would hide that bug. We changed it to return an error result object instead, making validation failures explicit and debuggable.

## Time Spent

2 hours 48 minutes from reading the assessment to final commit.

## Running Tests

```bash
npm install
npm test
```

## Demo Recording

[(https://drive.google.com/file/d/1bs6hKPQHJYXj_u5XI9W1hqpU6nt9hmQ6/view?usp=sharing)]
