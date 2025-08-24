// app/services/analytics.ts
type Props = Record<string, any> | undefined;

let phClient: any | null = null; // PostHog client if available

const KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

/** Call once at app start. If PostHog is installed & key exists, init it. */
export function initAnalytics() {
    if (!KEY) {
        console.log("[analytics] No EXPO_PUBLIC_POSTHOG_KEY; analytics disabled.");
        return;
    }
    try {
        // Lazy require so the app still runs if the package isn't installed yet.
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { PostHog } = require("posthog-react-native");
        phClient = new PostHog(KEY, {
            host: HOST,
            // send events quickly so you can see them while testing
            flushAt: 1,
            captureApplicationLifecycleEvents: true,
        });
        console.log("[analytics] PostHog initialized.");
    } catch (e) {
        console.warn("[analytics] posthog-react-native not installed; using console only.");
    }
}

/** Track a named event with optional properties. */
export function track(event: string, props?: Props) {
    try {
        if (phClient) phClient.capture(event, props);
        else console.log(`[analytics] ${event}`, props || {});
    } catch {
        // no-op
    }
}

/** Simple timer helper: call at start, then call the returned function to emit ms. */
export function timeSince(label: string) {
    const started = Date.now();
    return (props?: Props) =>
        track(`timing_${label}_ms`, { ms: Date.now() - started, ...(props || {}) });
}