# STAGES.md

Build one stage at a time. Do not start a stage until the previous one passes every requirement. After each stage, stop and wait for my review.

## Stage 1. Project shell

Build

1. Create a new Next.js App Router project.
2. Deploy the empty app to Vercel.
3. Add ANTHROPIC_API_KEY as a server side environment variable in Vercel and in .env.local.
4. Confirm .env.local is in .gitignore.
5. Hardcode the sample submission text on the home page.

Passes when

1. The Vercel URL loads in a browser and shows the submission text.
2. git log shows no file containing the API key.
3. The project runs locally with npm run dev.

## Stage 2. Aggregation function

Build

1. Create lib/aggregate.ts as a pure function with no imports from UI or API code.
2. Input is five pillar scores, each a number from 0 to 20.
3. Output is an object with total (0 to 100) and tier.
4. Tiers are Exceptional at 90 or above, High Performer from 80 to 89, Promising from 60 to 79, Developing below 60.

Passes when

1. The function returns correct totals and tiers when called manually with sample values.
2. It rejects or clamps invalid input such as a score of 25 or a negative number, and the choice is documented in a code comment.
3. The file imports nothing from React, Next or the API route.

## Stage 3. Test the aggregation

Build

1. Add Vitest.
2. Write one test file for the aggregation function.
3. Cover these exact cases. Total of 90 returns Exceptional. Total of 89 returns High Performer. Total of 80 returns High Performer. Total of 79 returns Promising. Total of 60 returns Promising. Total of 59 returns Developing. One invalid input case.

Passes when

1. npm test runs all cases with a single command and every test passes.
2. Each boundary case above appears in the test file.
3. The work is committed.

## Stage 4. State machine

Build

1. Create lib/stateMachine.ts as a second pure module.
2. Three states only. draft, reviewed, published.
3. Explicit transition functions. Draft moves to reviewed, reviewed moves to published. No other transitions exist.
4. An edit guard function that accepts edits in draft and reviewed, and rejects edits in published with a clear error value, not a thrown crash.
5. Add a small test file if it takes under ten minutes.

Passes when

1. Calling the edit guard in published state returns a rejection the UI can display.
2. Illegal transitions such as published back to draft are impossible through the module's API.
3. npm test still passes, including the new tests if written.

## Stage 5. Claude API route

Build

1. Create app/api/score/route.ts as a server side POST route.
2. It sends the submission text to Claude and asks for strict JSON only. Five pillars, each with a score out of 20 and a feedback string. Pillar names are Analytical Rigour, Commercial Acumen, Quality of Output, Communication, Initiative and Ownership.
3. Validate the response shape before returning it. Wrong shape returns a 502 with a clear error message. Never crash.
4. The API key comes from process.env only.

Passes when

1. A curl or fetch to the route returns valid JSON with all five pillars, correct names, scores between 0 and 20, and nonempty feedback strings.
2. Simulating a malformed Claude response returns the error path, not a crash.
3. Searching the client bundle and repo shows the key nowhere outside environment variables.

## Stage 6. Submission view

Build

1. Home page shows the hardcoded submission in a card.
2. A generate draft score button calls the stage 5 route.
3. On success, store the five pillar scores and feedback in React state and set the state machine to draft.
4. Show a loading state while waiting and a visible error message if the route fails.

Passes when

1. Clicking the button on the live site returns real Claude scores and they render on screen.
2. The loading state appears during the call.
3. Killing the network or forcing an API error shows the error message instead of a blank screen.

## Stage 7. Reviewer editing

Build

1. Render the five pillars as cards with inline editable inputs for score and feedback.
2. Every edit flows through the state machine edit guard, never directly into state.
3. Score inputs only accept 0 to 20.

Passes when

1. Editing a score updates the visible total immediately through the aggregation function.
2. Typing 25 or a letter into a score field is blocked or corrected.
3. Reading the code confirms no component writes scores without calling the edit guard.

## Stage 8. Publish and lock

Build

1. Add a publish button that moves the state machine to published.
2. On publish, disable all inputs.
3. An attempted edit after publish shows a visible message such as This score is published and locked.
4. Update the status badge from draft to published.

Passes when

1. After clicking publish, no field accepts changes.
2. Attempting an edit shows the locked message on screen, not silence and not a console error.
3. Refresh behavior is defined. Either state persists in localstorage or a refresh resets to a fresh draft, and the choice is intentional.

## Stage 9. Published view

Build

1. A read only view showing the total out of 100, the tier, and per pillar scores with feedback.
2. Total and tier come from the stage 2 aggregation function, not a recalculation.
3. No inputs, no buttons except navigation.

Passes when

1. The view renders the same numbers the reviewer approved.
2. The tier label matches the aggregation function output exactly.
3. Nothing on the page is editable.

## Stage 10. Final pass

Build

1. Redeploy to Vercel.
2. Click through the full flow on the live URL. Generate, edit, publish, view report.
3. Run npm test one final time.
4. Write the README. Ticket choice and reason, stack in one line, what was cut, how AI tools were used including one moment of pushing back on Claude, total time spent, how to run tests.
5. Record the two to three minute walkthrough.

Passes when

1. The full flow works on the live URL with no console errors.
2. npm test passes from a fresh clone.
3. The README is committed and covers every point above.
4. The recording shows the running app, explains one decision, and admits one thing to change.