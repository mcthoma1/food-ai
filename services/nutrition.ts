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
 * Look up a food name in FDC and return basic nutrition facts
 * (per 100g for most non-branded foods).
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

    const facts: NutritionFacts = {
        calories: findVal(byName("energy")) ?? findVal(byName("calories")),
        protein:  findVal(byName("protein")),
        fat:      findVal(byName("total lipid")) ?? findVal(byName("fat")),
        carbs:    findVal(byName("carbohydrate")),
        sugars:   findVal(byName("sugars")),
        fiber:    findVal(byName("fiber")),
        sodium:   findVal(byName("sodium")),
        source:   item.description,
    };

    return facts;
}

/* ---------- Search helpers (TOP LEVEL) ---------- */

export interface FdcSearchItem {
    fdcId: number;
    description: string;
    brandName?: string;
}

/** Search FoodData Central by free-text and return up to `pageSize` names. */
export async function searchFoods(query: string, pageSize = 15): Promise<string[]> {
    if (!FDC_KEY || FDC_KEY === "YOUR_FDC_KEY_HERE") {
        throw new Error("Missing FDC API key. Set EXPO_PUBLIC_FDC_API_KEY in your .env.");
    }

    const q = query.trim();
    if (q.length < 2) return []; // avoid noisy 1-letter searches

    const url =
        `${FDC_BASE}/foods/search?api_key=${encodeURIComponent(FDC_KEY)}` +
        `&query=${encodeURIComponent(q)}&pageSize=${pageSize}`;

    const res = await fetch(url);
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error?.message || res.statusText);

    const items: FdcSearchItem[] = Array.isArray(json.foods) ? json.foods : [];
    const names = items.map(i => i.description).filter(Boolean);
    return Array.from(new Set(names)); // dedupe
}