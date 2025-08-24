// services/session.ts
import type { DetectionResult } from "./clarifai";
import type { NutritionFacts } from "./nutrition";

let _detections: DetectionResult[] = [];
let _selectedNames: string[] = [];
let _nutrition: Record<string, NutritionFacts | null> = {};
let _caloriesDelta = 0;

// called by Home after detect
export function setDetections(d: DetectionResult[]) {
    _detections = d;
    _selectedNames = [];
    _nutrition = {};
    _caloriesDelta = 0;
}

export function getDetections(): DetectionResult[] {
    return _detections;
}

export function setSelectedNames(names: string[]) {
    _selectedNames = names;
}
export function getSelectedNames(): string[] {
    return _selectedNames;
}

// set by Select after fetching FDC
export function setNutrition(map: Record<string, NutritionFacts | null>) {
    _nutrition = map;
}
export function getNutrition(): Record<string, NutritionFacts | null> {
    return _nutrition;
}

// set total calories for this confirmation; Home will add it then clear
export function setCaloriesDelta(kcal: number) {
    _caloriesDelta = kcal;
}
export function consumeCaloriesDelta(): number {
    const v = _caloriesDelta;
    _caloriesDelta = 0;
    return v;
}

// timing between confirm on Select/Search and nutrition ready on Review
let _confirmStart = 0;
export function markConfirmStart() {
  _confirmStart = Date.now();
}
export function consumeConfirmDuration(): number {
  if (!_confirmStart) return 0;
  const ms = Date.now() - _confirmStart;
  _confirmStart = 0;
  return ms;
}

// abort everything
export function clearSession() {
    _detections = [];
    _selectedNames = [];
    _nutrition = {};
    _caloriesDelta = 0;
}