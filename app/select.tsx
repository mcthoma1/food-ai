import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useMemo, useState, useEffect } from "react";
import { track } from "./services/analytics";

import { getDetections, setSelectedNames, clearSession, markConfirmStart } from "../services/session";
import type { DetectionResult } from "../services/clarifai";

export default function SelectScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const detections: DetectionResult[] = useMemo(() => getDetections(), []);
    const [selected, setSelected] = useState<Set<string>>(new Set());

    useEffect(() => {
        const shown = detections.filter((d) => d.confidence > 0.6);
        const avg = shown.length ? shown.reduce((s, d) => s + d.confidence, 0) / shown.length : 0;
        track("predictions_view", { top_k: shown.length, avg_confidence: Number((avg * 100).toFixed(1)) });
    }, []);

    // If user landed here without data, go Home
    if (!detections || detections.length === 0) {
        router.replace("/");
        return null;
    }

    const toggle = (name: string) => {
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(name) ? next.delete(name) : next.add(name);
            return next;
        });
    };

    const onCancel = () => {
        clearSession();
        router.dismissAll(); // ✅ drop back to the existing Home
    };

    const onOK = () => {
        const names = detections
            .filter((d) => d.confidence > 0.6 && selected.has(d.name))
            .map((d) => d.name);

        if (names.length === 0) {
            alert("Select at least one item.");
            return;
        }
        track("prediction_select", { selected_count: names.length });
        setSelectedNames(names);
        markConfirmStart();
        router.push("/review");
    };

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.container}>
                <Text style={[styles.title, { marginTop: insets.top + 4 }]}>Select all that apply</Text>

                <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
                    {detections
                        .filter((d) => d.confidence > 0.6)
                        .map((d, i) => {
                            const isOn = selected.has(d.name);
                            return (
                                <Pressable
                                    key={`${d.name}-${i}`}
                                    onPress={() => toggle(d.name)}
                                    style={[styles.card, isOn && styles.cardOn]}
                                >
                                    <Text style={[styles.cardText, isOn && styles.cardTextOn]}>
                                        {d.name} • {(d.confidence * 100).toFixed(0)}%
                                    </Text>
                                </Pressable>
                            );
                        })}
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
        paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1,
        borderColor: "#E2E8F0", backgroundColor: "#fff", marginBottom: 12, alignItems: "center",
    },
    cardOn: { borderColor: "#4E70FF", backgroundColor: "#EEF2FF" },
    cardText: { fontSize: 16, color: "#111827", fontWeight: "500" },
    cardTextOn: { color: "#2131A8", fontWeight: "700" },
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