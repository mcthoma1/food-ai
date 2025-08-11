import { Stack } from "expo-router";

export default function RootLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="select" options={{ presentation: "modal" }} />
            <Stack.Screen name="review" options={{ presentation: "modal" }} />
        </Stack>
    );
}