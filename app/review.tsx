// app/review.tsx
import { track } from "./services/analytics";
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { addEntry, type Entry } from "../services/storage";

import {
    getSelectedNames,
    setNutrition as setSessionNutrition,
    setCaloriesDelta,
    clearSession,
    consumeConfirmDuration,
} from "../services/session";
import {
    fetchNutritionForName,
    scaleFacts,
    scaleByServings,
    type NutritionFacts,
} from "../services/nutrition";

function slugify(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export default function ReviewScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const names = useMemo(() => getSelectedNames(), []);
    const [nutrition, setNutrition] = useState<Record<string, NutritionFacts | null>>({});
    const [loading, setLoading] = useState(true);

    // per-item input mode + values
    const [mode, setMode] = useState<Record<string, "grams" | "servings">>({});
    const [grams, setGrams] = useState<Record<string, string>>({});
    const [servings, setServings] = useState<Record<string, string>>({});
    const fetched = useRef(false);

    if (!names || names.length === 0) {
        router.replace("/");
        return null;
    }

    useEffect(() => {
        track("review_view");
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

                // defaults for inputs
                const gMap: Record<string, string> = {};
                const mMap: Record<string, "grams" | "servings"> = {};
                const sMap: Record<string, string> = {};
                for (const n of names) {
                    gMap[n] = "100";   // default 100 g
                    mMap[n] = "grams"; // default mode
                    sMap[n] = "1";     // default 1 serving
                }
                setGrams(gMap);
                setMode(mMap);
                setServings(sMap);

                const ms = consumeConfirmDuration();
                if (ms > 0) {
                    track("timing_confirm_to_macros_ms", { ms, items: names.length });
                }
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
        clearSession();
        router.dismissAll();
    };

    const onOK = async () => {
        try {
            const items = Object.entries(nutrition).map(([name, base]) => {
                const useServ = mode[name] === "servings";
                const amount = useServ
                    ? parseFloat(servings[name] || "0")
                    : parseFloat(grams[name] || "0");

                const scaled = useServ
                    ? scaleByServings(base || {}, isNaN(amount) ? 0 : amount)
                    : scaleFacts(base || {}, isNaN(amount) ? 0 : amount);

                return {
                    name,
                    calories: scaled.calories ?? 0,
                    protein:  scaled.protein,
                    fat:      scaled.fat,
                    carbs:    scaled.carbs,
                    sugars:   scaled.sugars,
                    fiber:    scaled.fiber,
                    sodium:   scaled.sodium,
                };
            });

            const total = Math.round(items.reduce((s, it) => s + (it.calories || 0), 0));

            const d = new Date();
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, "0");
            const dd = String(d.getDate()).padStart(2, "0");

            const entry: Entry = {
                id: String(Date.now()),
                date: `${yyyy}-${mm}-${dd}`,
                items,
                totalKcal: total,
            };

            track("review_save", { items: items.length, total_kcal: total });
            await addEntry(entry);
            setCaloriesDelta(total);
            router.dismissAll();
        } catch (e) {
            console.error("Save error:", e);
            alert("Couldn’t save that entry.");
        }
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
                        Object.entries(nutrition).map(([name, facts]) => {
                            const id = slugify(name);
                            const useServ = mode[name] === "servings";
                            const amount = useServ
                                ? parseFloat(servings[name] || "0")
                                : parseFloat(grams[name] || "0");
                            const scaled = useServ
                                ? scaleByServings(facts || {}, isNaN(amount) ? 0 : amount)
                                : scaleFacts(facts || {}, isNaN(amount) ? 0 : amount);

                            return (
                                <View key={name} style={styles.card} testID={`food-card-${id}`}>
                                    <Text style={styles.cardTitle}>{name}</Text>

                                    {/* Mode toggle */}
                                    <View style={styles.toggleRow}>
                                        <Pressable
                                            onPress={() => setMode((prev) => ({ ...prev, [name]: "grams" }))}
                                            style={[styles.toggleBtn, mode[name] !== "grams" && styles.toggleOff]}
                                            testID={`toggle-grams-${id}`}
                                        >
                                            <Text
                                                style={[
                                                    styles.toggleText,
                                                    mode[name] !== "grams" && styles.toggleTextOff,
                                                ]}
                                            >
                                                Grams
                                            </Text>
                                        </Pressable>
                                        <Pressable
                                            onPress={() => setMode((prev) => ({ ...prev, [name]: "servings" }))}
                                            style={[styles.toggleBtn, mode[name] !== "servings" && styles.toggleOff]}
                                            testID={`toggle-servings-${id}`}
                                        >
                                            <Text
                                                style={[
                                                    styles.toggleText,
                                                    mode[name] !== "servings" && styles.toggleTextOff,
                                                ]}
                                            >
                                                Servings
                                            </Text>
                                        </Pressable>
                                    </View>

                                    {/* Input row */}
                                    {useServ ? (
                                        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 }}>
                                            <Text style={{ width: 64, color: "#374151" }}>Servings</Text>
                                            <TextInput
                                                value={servings[name] ?? ""}
                                                onChangeText={(t) =>
                                                    setServings((prev) => ({ ...prev, [name]: t.replace(/[^0-9.]/g, "") }))
                                                }
                                                keyboardType="decimal-pad"
                                                // inputMode removed for better Node/Web test stability
                                                style={{ flex: 1, borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#fff" }}
                                                placeholder="1"
                                                testID={`servings-input-${id}`}
                                            />
                                            <Text style={styles.hintText}>
                                                {facts?.servingGrams
                                                    ? `(~${facts.servingGrams} g each)`
                                                    : `(defaults to 100 g each)`}
                                            </Text>
                                        </View>
                                    ) : (
                                        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 }}>
                                            <Text style={{ width: 64, color: "#374151" }}>Grams</Text>
                                            <TextInput
                                                value={grams[name] ?? ""}
                                                onChangeText={(t) =>
                                                    setGrams((prev) => ({ ...prev, [name]: t.replace(/[^0-9.]/g, "") }))
                                                }
                                                keyboardType="decimal-pad"
                                                // inputMode removed for better Node/Web test stability
                                                style={{ flex: 1, borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#fff" }}
                                                placeholder="100"
                                                testID={`grams-input-${id}`}
                                            />
                                        </View>
                                    )}

                                    {/* Make the whole line a single string so tests can match consistently */}
                                    <Text style={styles.line} testID={`calories-${id}`}>
                                        {`Calories: ${scaled.calories ?? 0} kcal`}
                                    </Text>
                                    <Text style={styles.line}>{`Protein: ${scaled.protein ?? 0} g`}</Text>
                                    <Text style={styles.line}>{`Fat: ${scaled.fat ?? 0} g`}</Text>
                                    <Text style={styles.line}>{`Carbs: ${scaled.carbs ?? 0} g`}</Text>
                                    <Text style={styles.line}>{`Sugars: ${scaled.sugars ?? 0} g`}</Text>
                                    <Text style={styles.line}>{`Fiber: ${scaled.fiber ?? 0} g`}</Text>
                                    <Text style={styles.line}>{`Sodium: ${scaled.sodium ?? 0} mg`}</Text>
                                    {facts?.source && <Text style={styles.source}>Source: {facts.source}</Text>}
                                </View>
                            );
                        })}
                </ScrollView>

                <View style={[styles.bottom, { paddingBottom: insets.bottom + 10 }]}>
                    <Pressable onPress={onCancel} style={styles.secondaryBtn} testID="btn-cancel">
                        <Text style={styles.secondaryText}>Cancel</Text>
                    </Pressable>
                    <Pressable onPress={onOK} style={styles.primaryBtn} testID="btn-ok">
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

    toggleRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
    toggleBtn: {
        flex: 1, borderWidth: 1, borderColor: "#4E70FF", backgroundColor: "#EEF2FF",
        borderRadius: 10, paddingVertical: 8, alignItems: "center",
    },
    toggleOff: { borderColor: "#E5E7EB", backgroundColor: "#fff" },
    toggleText: { fontWeight: "700", color: "#2131A8" },
    toggleTextOff: { color: "#111827", fontWeight: "600" },
    hintText: { color: "#6B7280" },

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