/**
 * Pillar score aggregation function.
 * Pure function with no external dependencies.
 */

export type Tier = "Exceptional" | "High Performer" | "Promising" | "Developing";

export type AggregateResult =
  | { ok: true; total: number; tier: Tier }
  | { ok: false; error: string };

/**
 * Invalid input handling: REJECT with an error value.
 *
 * Rationale: Returning an error (not throwing) keeps the function total while
 * surfacing upstream validation failures. If a score of 25 or -5 reaches this
 * function, something is already wrong—clamping would hide that bug inside a
 * wrong total. By returning { ok: false, error: "..." }, the caller knows
 * exactly what went wrong and can handle it appropriately.
 *
 * This pattern matches the state machine's edit guard (stage 4), which also
 * returns error values instead of throwing. Consistency across pure modules
 * makes error handling predictable throughout the app.
 */
function validateScore(score: number, index: number): string | null {
  if (score < 0 || score > 20) {
    return `Invalid score at position ${index + 1}: ${score} (must be 0-20)`;
  }
  return null;
}

function getTier(total: number): Tier {
  if (total >= 90) return "Exceptional";
  if (total >= 80) return "High Performer";
  if (total >= 60) return "Promising";
  return "Developing";
}

export function aggregate(scores: [number, number, number, number, number]): AggregateResult {
  for (let i = 0; i < scores.length; i++) {
    const error = validateScore(scores[i], i);
    if (error) {
      return { ok: false, error };
    }
  }

  const total = scores.reduce((sum, score) => sum + score, 0);
  const tier = getTier(total);

  return { ok: true, total, tier };
}
