// __tests__/review.ui.test.tsx
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";

// 1) Mock AsyncStorage (since review writes via storage.addEntry)
jest.mock(
    "@react-native-async-storage/async-storage",
    () => require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

// 2) Safe-area mock
jest.mock("react-native-safe-area-context", () => {
    const React = require("react");
    const { View } = require("react-native");
    return {
        SafeAreaProvider: ({ children }: any) => <View>{children}</View>,
        SafeAreaView: ({ children }: any) => <View>{children}</View>,
        useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    };
});

// 3) Router mock
jest.mock("expo-router", () => ({
    useRouter: () => ({ dismissAll: jest.fn(), replace: jest.fn() }),
}));

// 4) Silence analytics
jest.mock("../app/services/analytics", () => ({ track: jest.fn() }));

// 5) Session: ensure we have one selected name so Review mounts
jest.mock("../services/session", () => ({
    getSelectedNames: jest.fn(() => ["Apple"]),
    setNutrition: jest.fn(),
    setCaloriesDelta: jest.fn(),
    clearSession: jest.fn(),
    consumeConfirmDuration: () => 0,
}));

// 6) Nutrition: use real scalers, mock only the fetch
jest.mock("../services/nutrition", () => {
    const real = jest.requireActual("../services/nutrition");
    return {
        ...real,
        fetchNutritionForName: jest.fn(async () => ({
            // per-100g example apple
            calories: 52,
            protein: 0.3,
            fat: 0.2,
            carbs: 14,
            sugars: 10,
            fiber: 2.4,
            sodium: 1,
            servingGrams: 182,
            source: "Mock",
        })),
    };
});

const ReviewScreen = require("../app/review").default;

// helper to read text content reliably across platforms
function textOf(node: any): string {
    const c = node?.props?.children;
    if (Array.isArray(c)) return c.map((x: any) => (typeof x === "string" ? x : String(x))).join("");
    return typeof c === "string" ? c : String(c ?? "");
}

describe("ReviewScreen (UI)", () => {
    it("updates calories when grams input changes", async () => {
        const { findByTestId, getByTestId } = render(<ReviewScreen />);

        // Wait for the calories row to appear
        const calories = await findByTestId("calories-apple");
        expect(textOf(calories)).toMatch(/Calories:\s*52/);

        // Change grams from default "100" to "50"
        const gramsInput = getByTestId("grams-input-apple");
        fireEvent.changeText(gramsInput, "50");

        // Wait for the updated kcal (roughly half: 26)
        await waitFor(() => {
            expect(textOf(getByTestId("calories-apple"))).toMatch(/Calories:\s*26/);
        });
    });
});