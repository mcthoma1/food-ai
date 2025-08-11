import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";

import {
    getSelectedNames,
    setNutrition as setSessionNutrition,
    setCaloriesDelta,
    clearSession,
} from "../services/session";
import { fetchNutritionForName, type NutritionFacts } from "../services/nutrition";

export default function ReviewScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const names = useMemo(() => getSelectedNames(), []);
    const [nutrition, setNutrition] = useState<Record<string, NutritionFacts | null>>({});
    const [loading, setLoading] = useState(true);
    const fetched = useRef(false);

    // If came here directly, go Home
    if (!names || names.length === 0) {
        router.replace("/");
        return null;
    }

    useEffect(() => {
        if (fetched.current) return;
        fetched.current = true;

        (async () => {
            try {
                const pairs = await Promise.all(
                    names.map(async (n) => [n, await fetchNutritionForName(n)] as const)
                );
                const map = Object.fromEntries(pairs);
                setNutrition(map);            // local state → triggers UI
                setSessionNutrition(map);     // keep session in sync

                // compute calories for Home; store as delta to be applied when returning
                const total = pairs.reduce((sum, [, facts]) => {
                    const c = facts?.calories;
                    return sum + (typeof c === "number" ? c : 0);
                }, 0);
                setCaloriesDelta(total);
            } catch (e) {
                console.error("Nutrition fetch failed:", e);
                setNutrition({});
                setCaloriesDelta(0);
            } finally {
                setLoading(false);
            }
        })();
    }, [names]);

    const onCancel = () => {
        // do not add calories; drop session and go home
        clearSession();
        router.dismissAll(); // ✅ close all modals, reveal the original Home
    };

    const onOK = () => {
        // Calories were already stored via setCaloriesDelta(...) in useEffect.
        // Just close all modals; Home's useFocusEffect will consume the delta.
        router.dismissAll(); // ✅ no extra Home screen is pushed
    };

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.container}>
                <Text style={[styles.title, { marginTop: insets.top + 4 }]}>Nutrition</Text>

                <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
                    {loading && (
                        <Text style={{ textAlign: "center", color: "#6B7280" }}>
                            Loading nutrition…
                        </Text>
                    )}

                    {!loading &&
                        Object.entries(nutrition).map(([name, facts]) => (
                            <View key={name} style={styles.card}>
                                <Text style={styles.cardTitle}>{name}</Text>
                                <Text style={styles.line}>Calories: {facts?.calories ?? "—"} kcal</Text>
                                <Text style={styles.line}>Protein: {facts?.protein ?? "—"} g</Text>
                                <Text style={styles.line}>Fat: {facts?.fat ?? "—"} g</Text>
                                <Text style={styles.line}>Carbs: {facts?.carbs ?? "—"} g</Text>
                                <Text style={styles.line}>Sugars: {facts?.sugars ?? "—"} g</Text>
                                <Text style={styles.line}>Fiber: {facts?.fiber ?? "—"} g</Text>
                                <Text style={styles.line}>Sodium: {facts?.sodium ?? "—"} mg</Text>
                                {facts?.source && <Text style={styles.source}>Source: {facts.source}</Text>}
                            </View>
                        ))}
                </ScrollView>

                <View style={[styles.bottom, { paddingBottom: insets.bottom + 10 }]}>
                    <Pressable onPress={onCancel} style={styles.secondaryBtn}>
                        <Text style={styles.secondaryText}>Cancel</Text>
                    </Pressable>
                    <Pressable onPress={onOK} style={styles.primaryBtn}>
                        <Text style={styles.primaryText}>OK</Text>
                    </Pressable>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#f7f7f7" },
    container: { flex: 1 },
    title: { textAlign: "center", fontWeight: "700", fontSize: 18, marginBottom: 8 },
    card: {
        padding: 12, borderRadius: 10, backgroundColor: "#fff", borderWidth: 1,
        borderColor: "#E5E7EB", marginBottom: 12,
    },
    cardTitle: { fontWeight: "700", marginBottom: 6 },
    line: { fontSize: 14, color: "#111827", marginBottom: 2 },
    source: { fontSize: 12, color: "#6B7280", marginTop: 4 },
    bottom: { paddingHorizontal: 16, gap: 10 },
    secondaryBtn: {
        borderWidth: 2, borderColor: "#000", backgroundColor: "#fff",
        borderRadius: 12, paddingVertical: 14, alignItems: "center",
    },
    secondaryText: { fontWeight: "700", fontSize: 16, color: "#000" },
    primaryBtn: {
        borderRadius: 12, paddingVertical: 14, alignItems: "center", backgroundColor: "#4E70FF",
    },
    primaryText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});