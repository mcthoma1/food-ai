// services/nutrition.ts
export interface NutritionFacts {
    calories?: number; // kcal
    protein?: number;  // g
    fat?: number;      // g
    carbs?: number;    // g
    sugars?: number;   // g
    fiber?: number;    // g
    sodium?: number;   // mg
    source?: string;   // description from FDC
}

const FDC_BASE = "https://api.nal.usda.gov/fdc/v1";
const FDC_KEY =
    (process.env.EXPO_PUBLIC_FDC_API_KEY as string | undefined) || "YOUR_FDC_KEY_HERE";
console.log("FDC key loaded?", !!FDC_KEY);

/**
 * Look up a food name in FDC and return basic nutrition facts (per 100g for most non-branded foods).
 */
export async function fetchNutritionForName(name: string): Promise<NutritionFacts | null> {
    if (!FDC_KEY || FDC_KEY === "YOUR_FDC_KEY_HERE") {
        throw new Error("Missing FDC API key. Set EXPO_PUBLIC_FDC_API_KEY in your .env.");
    }

    const url =
        `${FDC_BASE}/foods/search?api_key=${encodeURIComponent(FDC_KEY)}` +
        `&query=${encodeURIComponent(name)}&pageSize=1`;

    const res = await fetch(url);
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error?.message || res.statusText);

    const item = json?.foods?.[0];
    if (!item) return null;

    const nutrients: any[] = item.foodNutrients ?? [];

    const findVal = (predicate: (n: any) => boolean) =>
        nutrients.find(predicate)?.value;

    const byName = (needle: string) => (n: any) =>
        typeof n.nutrientName === "string" &&
        n.nutrientName.toLowerCase().includes(needle);

    // Pull common nutrients by name (robust to minor naming differences)
    const facts: NutritionFacts = {
        calories: findVal(byName("energy")) ?? findVal(byName("calories")),
        protein: findVal(byName("protein")),
        fat: findVal(byName("total lipid")) ?? findVal(byName("fat")),
        carbs: findVal(byName("carbohydrate")),
        sugars: findVal(byName("sugars")),
        fiber: findVal(byName("fiber")),
        sodium: findVal(byName("sodium")),
        source: item.description,
    };

    return facts;
}