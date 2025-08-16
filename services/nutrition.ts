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

    // Optional serving metadata if FDC provides it
    servingSize?: number;   // numeric value from FDC (e.g., 55)
    servingUnit?: string;   // unit string (e.g., "g", "cup")
    servingGrams?: number;  // grams per serving if unit is grams; else undefined
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

    // Try to capture serving info if present on the search item
    const rawServingSize =
        typeof item?.servingSize === "number" ? item.servingSize : undefined;
    const rawServingUnit =
        typeof item?.servingSizeUnit === "string" ? item.servingSizeUnit : undefined;

    let servingGrams: number | undefined = undefined;
    // If the unit is grams, we can directly use it as grams-per-serving
    if (rawServingSize && rawServingUnit && /(^g$|gram)/i.test(rawServingUnit)) {
        servingGrams = rawServingSize;
    }

    const facts: NutritionFacts = {
        calories: findVal(byName("energy")) ?? findVal(byName("calories")),
        protein:  findVal(byName("protein")),
        fat:      findVal(byName("total lipid")) ?? findVal(byName("fat")),
        carbs:    findVal(byName("carbohydrate")),
        sugars:   findVal(byName("sugars")),
        fiber:    findVal(byName("fiber")),
        sodium:   findVal(byName("sodium")),
        source:   item.description,

        servingSize: rawServingSize,
        servingUnit: rawServingUnit,
        servingGrams,
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

/** Scale a per-100g NutritionFacts object to the given gram amount. */
export function scaleFacts(
    base: NutritionFacts | null | undefined,
    grams: number
): NutritionFacts {
    const f = base ?? {};
    const g = Math.max(0, Number.isFinite(grams) ? Number(grams) : 0);
    const ratio = g / 100;

    const round1 = (v?: number) =>
        v == null ? undefined : Math.round(v * ratio * 10) / 10; // one decimal for grams
    const roundKcal = (v?: number) =>
        v == null ? undefined : Math.round(v * ratio); // whole number for kcal

    return {
        calories: roundKcal(f.calories),
        protein:  round1(f.protein),
        fat:      round1(f.fat),
        carbs:    round1(f.carbs),
        sugars:   round1(f.sugars),
        fiber:    round1(f.fiber),
        sodium:   f.sodium == null ? undefined : Math.round(f.sodium * ratio), // mg
        source:   f.source,

        // keep any serving metadata intact
        servingSize: f.servingSize,
        servingUnit: f.servingUnit,
        servingGrams: f.servingGrams,
    };
}

/** Scale using servings. If grams per serving is unknown, default to 100 g per serving. */
export function scaleByServings(
    base: NutritionFacts | null | undefined,
    servings: number
): NutritionFacts {
    const perServingGrams =
        (base && typeof base.servingGrams === "number" && base.servingGrams > 0)
            ? base.servingGrams
            : 100; // sensible default
    const gramsTotal = Math.max(0, Number.isFinite(servings) ? Number(servings) : 0) * perServingGrams;
    return scaleFacts(base, gramsTotal);
}