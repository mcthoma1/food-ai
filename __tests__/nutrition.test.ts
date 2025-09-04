// __tests__/nutrition.test.ts
import { scaleFacts } from "../services/nutrition";

describe("scaleFacts", () => {
    const per100 = { calories: 220, protein: 20, fat: 8, carbs: 24 };

    // Silence module-level console.log in services/nutrition during this suite
    let logSpy: jest.SpyInstance;
    beforeAll(() => {
        logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    });
    afterAll(() => {
        logSpy.mockRestore();
    });

    it("returns zeros for 0g", () => {
        const r = scaleFacts(per100, 0);
        expect(r.calories).toBeCloseTo(0, 0); // whole-number calories
        expect(r.protein).toBeCloseTo(0, 1);
        expect(r.fat).toBeCloseTo(0, 1);
        expect(r.carbs).toBeCloseTo(0, 1);
    });

    it("scales linearly at 150g", () => {
        const r = scaleFacts(per100, 150);
        // 220 * 1.5 -> 330, function rounds calories to an integer
        expect(r.calories).toBe(330);
        expect(r.protein).toBeCloseTo(30, 1);
        expect(r.fat).toBeCloseTo(12, 1);
        expect(r.carbs).toBeCloseTo(36, 1);
    });

    it("handles odd grams (37g) with sensible rounding", () => {
        const r = scaleFacts(per100, 37);
        // Implementation rounds calories to a whole number (220 * 0.37 = 81.4 -> 81)
        expect(r.calories).toBe(81);
        // Macros appear to keep one decimal place
        expect(r.protein).toBeCloseTo(7.4, 1);
        expect(r.fat).toBeCloseTo(3.0, 1);
        expect(r.carbs).toBeCloseTo(8.9, 1);
    });
});