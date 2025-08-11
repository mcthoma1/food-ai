// services/choices.ts
import type { DetectionResult } from "./clarifai";

/**
 * Save the user's chosen dishes.
 * This is a stub you can replace with a real API call later.
 */
export async function saveChosenDishes(dishes: DetectionResult[]): Promise<void> {
    // Example of what a real call might look like:
    // await fetch("https://your.api/choices", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({
    //     selections: dishes,
    //     ts: Date.now(),
    //   }),
    // });

    return;
}