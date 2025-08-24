import { Stack, useNavigationContainerRef } from "expo-router";
import { useEffect } from "react";
import { clearSession } from "../services/session";
import { clearAllEntries } from "../services/storage";
import { isRunningInExpoGo } from "expo";
import * as Sentry from "@sentry/react-native";
import { initAnalytics } from "./services/analytics";

const navigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: !isRunningInExpoGo(),
});

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN ?? "",
  tracesSampleRate: 1.0,
  integrations: [navigationIntegration],
  enableNativeFramesTracking: !isRunningInExpoGo(),
});

function RootLayout() {
  const navRef = useNavigationContainerRef();

  useEffect(() => {
    navigationIntegration.registerNavigationContainer(navRef);
  }, [navRef]);

  // Initialize analytics once (no-op if key not set)
  useEffect(() => {
    initAnalytics();
  }, []);

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
    <Stack screenOptions={{ headerShown: false }} ref={navRef}>
      <Stack.Screen name="index" />
      <Stack.Screen name="select" options={{ presentation: "modal" }} />
      <Stack.Screen name="review" options={{ presentation: "modal" }} />
      <Stack.Screen name="search" />
      <Stack.Screen name="history" />
    </Stack>
  );
}

export default Sentry.wrap(RootLayout);