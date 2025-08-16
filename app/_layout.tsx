import { Stack } from "expo-router";
import { useEffect } from "react";
import { clearSession } from "../services/session";
import { clearAllEntries } from "../services/storage";

export default function RootLayout() {
  useEffect(() => {
    // Always clear transient wizard/session data at app boot
    clearSession();

    // Optional: during development you can auto-clear history on boot by setting
    // EXPO_PUBLIC_CLEAR_HISTORY_ON_BOOT=1 in your .env
    if (process.env.EXPO_PUBLIC_CLEAR_HISTORY_ON_BOOT === "1") {
      (async () => {
        try {
          await clearAllEntries();
          // console.log("History cleared on boot (dev)");
        } catch (e) {
          // console.warn("Could not clear history on boot", e);
        }
      })();
    }
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="select" options={{ presentation: "modal" }} />
      <Stack.Screen name="review" options={{ presentation: "modal" }} />
      <Stack.Screen name="search" />
      <Stack.Screen name="history" />
    </Stack>
  );
}