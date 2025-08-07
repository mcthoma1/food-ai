// app/services/clarifai.ts
export interface DetectionResult {
  name: string;
  confidence: number;
}

/**
 * Call Clarifai’s public **Food** workflow (dish‑level recognition)
 * with a base64‑encoded image and return the top concepts.
 */
export async function detectDishWithClarifai(
  base64: string
): Promise<DetectionResult[]> {
  // ----- workspace & payload ---------------------------------------------
  const payload = {
    user_app_id: { user_id: "clarifai", app_id: "main" },
    inputs: [{ data: { image: { base64 } } }],
  };

  // ----- REST call --------------------------------------------------------
  const response = await fetch(
    "https://api.clarifai.com/v2/workflows/Food/results",
    {
      method: "POST",
      headers: {
        // 👇 INSERT **your own** PAT that starts with pat_…
        Authorization: "Key INSERT",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  const json = await response.json();
  if (!response.ok) {
    throw new Error(json.status?.description || response.statusText);
  }

  // Dish classifier is outputs[0] of results[0]
  const concepts = json.results?.[0]?.outputs?.[0]?.data?.concepts ?? [];
  return concepts.map((c: any) => ({ name: c.name, confidence: c.value }));
}