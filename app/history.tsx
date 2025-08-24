import { track } from "./services/analytics";
import { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { getEntries, type Entry } from "../services/storage";

export default function HistoryScreen() {
    const insets = useSafeAreaInsets();
    const [entries, setEntries] = useState<Entry[]>([]);

    useEffect(() => {
        (async () => setEntries(await getEntries()))();
    }, []);

    useEffect(() => {
        track("history_view");
    }, []);

    return (
        <SafeAreaView style={styles.safe}>
            <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
                <Text style={styles.title}>History</Text>
                <FlatList
                    data={entries.slice(0, 14)} // show recent days
                    keyExtractor={(e) => e.id}
                    contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <Text style={styles.date}>{item.date}</Text>
                            <Text style={styles.kcal}>{item.totalKcal} kcal</Text>
                            {item.items.map((it, i) => (
                                <Text key={i} style={styles.line}>• {it.name} — {it.calories} kcal</Text>
                            ))}
                        </View>
                    )}
                    ListEmptyComponent={
                        <Text style={styles.empty}>No entries yet.</Text>
                    }
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#f7f7f7" },
    container: { flex: 1 },
    title: { textAlign: "center", fontWeight: "700", fontSize: 18, marginBottom: 8 },
    card: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#E5E7EB",
        borderRadius: 12, padding: 12, marginBottom: 12 },
    date: { fontWeight: "700" },
    kcal: { color: "#111827", marginBottom: 6 },
    line: { color: "#374151", fontSize: 14 },
    empty: { textAlign: "center", color: "#6B7280", marginTop: 32 },
});