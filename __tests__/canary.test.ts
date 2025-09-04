// A tiny “canary” test that never touches RN, Expo, fetch, or routing.
// It will run cleanly in Node/Web/iOS/Android Jest projects.

describe("canary", () => {
    it("sanity: adds numbers", () => {
        expect(1 + 2).toBe(3);
    });

    it("scales nutrition per 100g to an arbitrary grams value", () => {
        type Macros = { kcal: number; protein: number; fat: number; carbs: number };

        function scale(per100g: Macros, grams: number): Macros {
            const r = grams / 100;
            // round to 1 decimal to avoid floating-point fuzz
            const round1 = (n: number) => Math.round(n * 10) / 10;
            return {
                kcal: round1(per100g.kcal * r),
                protein: round1(per100g.protein * r),
                fat: round1(per100g.fat * r),
                carbs: round1(per100g.carbs * r),
            };
        }

        const per100 = { kcal: 220, protein: 20, fat: 8, carbs: 24 };

        expect(scale(per100, 0)).toEqual({ kcal: 0, protein: 0, fat: 0, carbs: 0 });
        expect(scale(per100, 150)).toEqual({ kcal: 330, protein: 30, fat: 12, carbs: 36 });
        expect(scale(per100, 37)).toEqual({
            kcal: 81.4, protein: 7.4, fat: 3, carbs: 8.9,
        });
    });
});
