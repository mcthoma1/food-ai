// Keep tests snappy
jest.setTimeout(15000);

// Silence RN warnings (optional)
const originalError = console.error.bind(console);
console.error = (...args: any[]) => {
    const msg = String(args[0] ?? "");
    if (msg.includes("Warning:")) return;
    originalError(...args);
};

// RN mocks to avoid noisy logs
jest.mock("react-native/Libraries/Animated/NativeAnimatedHelper");
jest.mock("react-native-reanimated", () => require("react-native-reanimated/mock"));

// Make this file a module (avoids TS "global scope" issues)
export {};