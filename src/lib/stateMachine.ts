/**
 * State machine for submission scoring workflow.
 * Pure module with no external dependencies.
 *
 * States: draft → reviewed → published
 * Transitions are one-way only. Published state is terminal.
 */

export type State = "draft" | "reviewed" | "published";

export type TransitionResult =
  | { ok: true; state: State }
  | { ok: false; error: string };

export type EditResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

/**
 * Transition from draft to reviewed.
 * Only valid when current state is draft.
 */
export function transitionToReviewed(current: State): TransitionResult {
  if (current === "draft") {
    return { ok: true, state: "reviewed" };
  }
  return { ok: false, error: `Cannot transition to reviewed from ${current}` };
}

/**
 * Transition from reviewed to published.
 * Only valid when current state is reviewed.
 */
export function transitionToPublished(current: State): TransitionResult {
  if (current === "reviewed") {
    return { ok: true, state: "published" };
  }
  return { ok: false, error: `Cannot transition to published from ${current}` };
}

/**
 * Edit guard: checks if edits are allowed in the current state.
 * Edits are allowed in draft and reviewed states.
 * Edits are rejected in published state with a clear error message.
 *
 * Returns the edit value wrapped in a result object, allowing the caller
 * to proceed with the edit or display the error message.
 */
export function guardEdit<T>(current: State, editValue: T): EditResult<T> {
  if (current === "published") {
    return { ok: false, error: "This score is published and locked" };
  }
  return { ok: true, value: editValue };
}
