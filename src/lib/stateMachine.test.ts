import { describe, it, expect } from "vitest";
import {
  guardEdit,
  transitionToReviewed,
  transitionToPublished,
} from "./stateMachine";

describe("stateMachine", () => {
  describe("guardEdit", () => {
    it("allows edits in draft state", () => {
      const result = guardEdit("draft", { score: 15 });
      expect(result).toEqual({ ok: true, value: { score: 15 } });
    });

    it("allows edits in reviewed state", () => {
      const result = guardEdit("reviewed", { score: 18 });
      expect(result).toEqual({ ok: true, value: { score: 18 } });
    });

    it("rejects edits in published state with error message", () => {
      const result = guardEdit("published", { score: 20 });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("This score is published and locked");
      }
    });
  });

  describe("illegal transitions", () => {
    it("cannot transition from published back to reviewed", () => {
      const result = transitionToReviewed("published");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("Cannot transition");
      }
    });

    it("cannot transition directly from draft to published", () => {
      const result = transitionToPublished("draft");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("Cannot transition");
      }
    });
  });
});
