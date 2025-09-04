// __tests__/review.native.test.tsx
import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

// Safe-area mock so RN doesn’t crash
jest.mock("react-native-safe-area-context", () => {
    const React = require("react");
    const { View } = require("react-native");
    return {
        SafeAreaProvider: ({ children }: any) => <View>{children}</View>,
        SafeAreaView: ({ children }: any) => <View>{children}</View>,
        useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    };
});

// Router mock
jest.mock("expo-router", () => ({
    useRouter: () => ({ dismissAll: jest.fn(), replace: jest.fn() }),
}));

// Silence analytics
jest.mock("../app/services/analytics", () => ({ track: jest.fn() }));

// Always have one selected name so Review renders instead of redirecting
jest.mock("../services/session", () => ({
    getSelectedNames: () => ["Apple"],
    setNutrition: jest.fn(),
    setCaloriesDelta: jest.fn(),
    clearSession: jest.fn(),
    consumeConfirmDuration: () => 0,
}));

// Use real scalers but mock network fetch
jest.mock("../services/nutrition", () => {
    const real = jest.requireActual("../services/nutrition");
    return {
        ...real,
        fetchNutritionForName: jest.fn(async () => ({
            // per 100 g
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

// tiny helper that works in RN + web trees (whitespace tolerant)
const waitForCaloriesText = async (utils: any, kcal: number) => {
    const rx = new RegExp(`Calories:\\s*${kcal}`);
    return utils.findByText(rx);
};

describe("ReviewScreen (UI)", () => {
    it("updates calories when grams input changes", async () => {
        const utils = render(<ReviewScreen />);

        // Initial render: default grams is "100" → 52 kcal
        await waitForCaloriesText(utils, 52);

        // Grab the grams input by its placeholder ("100") — stable across RN & web
        const gramsInput = await utils.findByPlaceholderText("100");

        // Change to 50 g → 26 kcal
        fireEvent.changeText(gramsInput, "50");

        await waitForCaloriesText(utils, 26);
    });
});