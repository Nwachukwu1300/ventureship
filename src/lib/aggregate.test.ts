import { describe, it, expect } from "vitest";
import { aggregate } from "./aggregate";

describe("aggregate", () => {
  describe("tier boundaries", () => {
    it("returns Exceptional for total of 90", () => {
      // 18 + 18 + 18 + 18 + 18 = 90
      const result = aggregate([18, 18, 18, 18, 18]);
      expect(result).toEqual({ ok: true, total: 90, tier: "Exceptional" });
    });

    it("returns High Performer for total of 89", () => {
      // 18 + 18 + 18 + 18 + 17 = 89
      const result = aggregate([18, 18, 18, 18, 17]);
      expect(result).toEqual({ ok: true, total: 89, tier: "High Performer" });
    });

    it("returns High Performer for total of 80", () => {
      // 16 + 16 + 16 + 16 + 16 = 80
      const result = aggregate([16, 16, 16, 16, 16]);
      expect(result).toEqual({ ok: true, total: 80, tier: "High Performer" });
    });

    it("returns Promising for total of 79", () => {
      // 16 + 16 + 16 + 16 + 15 = 79
      const result = aggregate([16, 16, 16, 16, 15]);
      expect(result).toEqual({ ok: true, total: 79, tier: "Promising" });
    });

    it("returns Promising for total of 60", () => {
      // 12 + 12 + 12 + 12 + 12 = 60
      const result = aggregate([12, 12, 12, 12, 12]);
      expect(result).toEqual({ ok: true, total: 60, tier: "Promising" });
    });

    it("returns Developing for total of 59", () => {
      // 12 + 12 + 12 + 12 + 11 = 59
      const result = aggregate([12, 12, 12, 12, 11]);
      expect(result).toEqual({ ok: true, total: 59, tier: "Developing" });
    });
  });

  describe("invalid input", () => {
    it("returns error when a score is above 20", () => {
      // 18 + 25 (invalid) + 18 + 18 + 18
      const result = aggregate([18, 25, 18, 18, 18]);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("Invalid score");
        expect(result.error).toContain("25");
      }
    });

    it("returns error when a score is below 0", () => {
      // 18 + 18 + -5 (invalid) + 18 + 18
      const result = aggregate([18, 18, -5, 18, 18]);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("Invalid score");
        expect(result.error).toContain("-5");
      }
    });
  });
});
