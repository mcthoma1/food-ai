// app/services/clarifai.ts
export interface DetectionResult {
    name: string;
    confidence: number;
}

const CLARIFAI_FOOD_URL =
    "https://api.clarifai.com/v2/workflows/Food/results";

// If you later add an env var (EXPO_PUBLIC_CLARIFAI_PAT), we'll prefer it.
// Otherwise, replace the fallback with your real PAT (must start with pat_).
const CLARIFAI_PAT =
    (process.env.EXPO_PUBLIC_CLARIFAI_PAT as string | undefined) ?? "pat_REPLACE_ME";
/**
 * Calls Clarifai’s public Food workflow with a base64 image
 * and returns the top concepts (dish candidates).
 */
export async function detectDishWithClarifai(
    base64: string
): Promise<DetectionResult[]> {
    const payload = {
        user_app_id: { user_id: "clarifai", app_id: "main" },
        inputs: [{ data: { image: { base64 } } }],
    };

    const response = await fetch(CLARIFAI_FOOD_URL, {
        method: "POST",
        headers: {
            Authorization: `Key ${CLARIFAI_PAT}`, // <-- must be pat_...
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    const json = await response.json();
    if (!response.ok) {
        throw new Error(json.status?.description || response.statusText);
    }

    // Grab the first output that actually has concepts (more robust than fixed index).
    const outputs = json?.results?.[0]?.outputs ?? [];
    const concepts =
        outputs.find((o: any) => Array.isArray(o?.data?.concepts))?.data?.concepts ??
        [];

    return concepts
        .map((c: any) => ({ name: c.name, confidence: c.value }))
        .sort((a, b) => b.confidence - a.confidence);
}