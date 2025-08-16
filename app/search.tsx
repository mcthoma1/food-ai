// app/search.tsx
import { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, StyleSheet, ScrollView, Pressable } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { searchFoods } from "../services/nutrition";
import { setSelectedNames, clearSession } from "../services/session";

export default function SearchScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const [query, setQuery] = useState("");
    const [results, setResults] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Debounced search
    useEffect(() => {
        if (timer.current) clearTimeout(timer.current);
        if (query.trim().length < 2) {
            setResults([]);
            return;
        }
        timer.current = setTimeout(async () => {
            try {
                setLoading(true);
                const names = await searchFoods(query);
                setResults(names);
            } catch (e) {
                console.error("FDC search error:", e);
            } finally {
                setLoading(false);
            }
        }, 350);
        return () => {
            if (timer.current) clearTimeout(timer.current);
        };
    }, [query]);

    const toggle = (name: string) => {
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(name) ? next.delete(name) : next.add(name);
            return next;
        });
    };

    const onCancel = () => {
        clearSession();
        router.dismissAll(); // back to Home without stacking
    };

    const onOK = () => {
        if (selected.size === 0) {
            alert("Select at least one item.");
            return;
        }
        setSelectedNames(Array.from(selected)); // reuse Review screen flow
        router.push("/review");
    };

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.container}>
                <Text style={[styles.title, { marginTop: insets.top + 4 }]}>
                    Search foods (USDA)
                </Text>

                <View style={styles.inputRow}>
                    <TextInput
                        placeholder="e.g., grilled chicken, apple, rice"
                        value={query}
                        onChangeText={setQuery}
                        autoCapitalize="none"
                        autoCorrect={false}
                        style={styles.input}
                        returnKeyType="search"
                    />
                </View>

                <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
                    {loading && (
                        <Text style={{ textAlign: "center", color: "#6B7280" }}>Searching…</Text>
                    )}

                    {!loading &&
                        results.map((name, i) => {
                            const isOn = selected.has(name);
                            return (
                                <Pressable
                                    key={`${name}-${i}`}
                                    onPress={() => toggle(name)}
                                    style={[styles.card, isOn && styles.cardOn]}
                                >
                                    <Text style={[styles.cardText, isOn && styles.cardTextOn]}>{name}</Text>
                                </Pressable>
                            );
                        })}

                    {!loading && results.length === 0 && query.trim().length >= 2 && (
                        <Text style={{ textAlign: "center", color: "#6B7280" }}>
                            No results. Try a different term.
                        </Text>
                    )}
                </ScrollView>

                <View style={[styles.bottom, { paddingBottom: insets.bottom + 10 }]}>
                    <Pressable onPress={onCancel} style={styles.secondaryBtn}>
                        <Text style={styles.secondaryText}>Cancel</Text>
                    </Pressable>
                    <Pressable
                        onPress={onOK}
                        style={[
                            styles.primaryBtn,
                            selected.size === 0 && { backgroundColor: "#B9C3FF" },
                        ]}
                        disabled={selected.size === 0}
                    >
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
    inputRow: { paddingHorizontal: 16, marginTop: 8 },
    input: {
        backgroundColor: "#fff",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 16,
    },

    // ⬇️ Left-aligned result cards
    card: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        backgroundColor: "#fff",
        marginBottom: 10,
        alignItems: "flex-start", // left align
        width: "100%",            // take full width so text can align left
    },
    cardOn: { borderColor: "#4E70FF", backgroundColor: "#EEF2FF" },
    cardText: {
        fontSize: 16,
        color: "#111827",
        fontWeight: "500",
        textAlign: "left",        // left align text
        width: "100%",
    },
    cardTextOn: { color: "#2131A8", fontWeight: "700" },

    bottom: { paddingHorizontal: 16, gap: 10 },
    secondaryBtn: {
        borderWidth: 2,
        borderColor: "#000",
        backgroundColor: "#fff",
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: "center",
    },
    secondaryText: { fontWeight: "700", fontSize: 16, color: "#000" },
    primaryBtn: {
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: "center",
        backgroundColor: "#4E70FF",
    },
    primaryText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});