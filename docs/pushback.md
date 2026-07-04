# pushbacks.md

A running log of moments where I pushed back on Claude while building this. Source material for the README and recording. Update after every stage.

## Pushback 1. Rejected silent clamping of invalid scores

Stage 2. Claude wrote the aggregation function to clamp invalid scores, so 25 became 20 and negatives became 0. Its reasoning was that clamping never crashes and the UI validates first.

I rejected this. Scores reach this function from two validated sources, the reviewer UI and the parsed Claude API response. If a score of 25 ever arrives, upstream validation already failed. Clamping turns that bug into a plausible but wrong total and hides it. I made Claude replace clamping with an explicit error result that names the invalid score, so bad data surfaces instead of disappearing into the math.

## Pushback 2. Rejected an advisory edit guard

Stage 4. Claude built the publish lock as a standalone guard function that components were supposed to remember to call before editing. When I asked how a component could cheat, Claude admitted any component could skip the guard and write scores directly, then argued a real enforcement layer would be over engineering for a three hour task.

I disagreed. The spec says the lock must be enforced, not just visually disabled. A promise that reviewers will check usage is not enforcement. I made Claude wrap the state in a reducer where every edit action passes through the guard internally, so components dispatch actions and can never touch scores directly. The change was about twenty lines.

## Pushback 3. Caught Claude misdescribing its own code

Stage 4. While explaining the guard, Claude described the aggregation function's error behavior in a way that contradicted the earlier conversation about how it should work. I made it open the actual file, state which behavior really existed, and confirm the tests matched the implementation. Claude admitted it had misspoken. Lesson applied to the rest of the build. Verify Claude's claims against the code and the test output, not against its summaries.