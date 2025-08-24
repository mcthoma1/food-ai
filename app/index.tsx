import { track, timeSince } from "./services/analytics";
import {
    View, Text, StyleSheet, Pressable,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useRef, useState, useCallback } from "react";
import { useRouter, useFocusEffect } from "expo-router";

import { detectDishWithClarifai, type DetectionResult } from "../services/clarifai";
import { consumeCaloriesDelta, setDetections } from "../services/session";
import { getTodayTotal } from "../services/storage";
import * as Sentry from "@sentry/react-native";

export default function HomeScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const cameraRef = useRef<CameraView>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [permission, requestPermission] = useCameraPermissions();
    const [dailyCalories, setDailyCalories] = useState(0);

    // when returning from Review, add the calories delta
    useFocusEffect(
        useCallback(() => {
            track("home_view");
            (async () => {
                const d = new Date();
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, "0");
                const dd = String(d.getDate()).padStart(2, "0");
                const base = await getTodayTotal(`${yyyy}-${mm}-${dd}`);
                const delta = consumeCaloriesDelta(); // usually 0 since we saved before closing
                setDailyCalories(Math.round(base + delta));
            })();
        }, [])
    );

    const openSearch = () => {
        track("add_search_tap");
        router.push("/search");
    };

    const openCamera = async () => {
        if (!permission?.granted) {
            const { granted } = await requestPermission();
            if (!granted) return;
        }
        track("add_photo_tap");
        setIsCameraOpen(true);
    };

    const cancelCamera = () => setIsCameraOpen(false);

    const capture = async () => {
        if (!cameraRef.current) return;
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, base64: true });
        setIsCameraOpen(false);
        await detectAndGo(photo.base64!);
    };

    const pickImage = async () => {
        try {
            track("add_gallery_tap");
            const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (perm.status !== "granted") {
                alert("Please allow Photos permission.");
                return;
            }
            const MediaEnum: any =
                (ImagePicker as any).MediaType || (ImagePicker as any).MediaTypeOptions;

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: MediaEnum?.Images ?? ImagePicker.MediaTypeOptions.Images,
                quality: 0.8,
                base64: true,
                selectionLimit: 1,
            });
            if (result.canceled) return;
            const asset = (result as any).assets?.[0];
            if (!asset?.base64) {
                alert("Couldn’t read that image—pick another.");
                return;
            }
            await detectAndGo(asset.base64);
        } catch (e) {
            console.error("pickImage error:", e);
            alert("Could not open gallery.");
        }
    };

    async function detectAndGo(base64: string) {
        try {
            const stop = timeSince("image_to_predictions");
            const preds: DetectionResult[] = await detectDishWithClarifai(base64);
            const avg = preds.length ? preds.reduce((s, p) => s + p.confidence, 0) / preds.length : 0;
            stop({ top_k: preds.length, avg_confidence: Number((avg * 100).toFixed(1)) });
            setDetections(preds);        // store for next screen
            router.push("/select");      // go to selection modal
        } catch (e) {
            console.error("Clarifai error:", e);
            alert("Couldn’t detect food in that photo.");
        }
    }

    return (
        <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
            <View style={styles.screen}>
                {/* TOP: total calories */}
                <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                    <Text style={styles.caloriesNumber}>{dailyCalories}</Text>
                    <Text style={styles.caloriesLabel}>cals</Text>
                </View>

                {/* MIDDLE intentionally empty */}

                {/* BOTTOM: actions (stacked) */}
                <View style={[styles.bottomActions, { paddingBottom: insets.bottom + 10 }]}>
                    {/* NEW: Search comes first */}
                    <Pressable onPress={openSearch} style={styles.outlineBtn}>
                        <Text style={styles.outlineBtnText}>Search Food</Text>
                    </Pressable>

                    <Pressable onPress={openCamera} style={styles.outlineBtn}>
                        <Text style={styles.outlineBtnText}>Take Photo</Text>
                    </Pressable>

                    <Pressable onPress={pickImage} style={styles.outlineBtn}>
                        <Text style={styles.outlineBtnText}>Pick From Gallery</Text>
                    </Pressable>
                    <Pressable onPress={() => router.push("./history")} style={styles.outlineBtn}>
                        <Text style={styles.outlineBtnText}>History</Text>
                    </Pressable>
                    <Pressable
                        onPress={() => Sentry.captureException(new Error("Sentry test error"))}
                        style={styles.outlineBtn}
                    >
                        <Text style={styles.outlineBtnText}>Send Sentry Test</Text>
                    </Pressable>
                </View>

                {/* Full-screen camera modal */}
                {isCameraOpen && (
                    <View style={styles.cameraModal}>
                        <CameraView ref={cameraRef} style={styles.cameraFill} />
                        <View style={styles.cameraControls}>
                            <Pressable onPress={cancelCamera} style={styles.secondaryBtn}>
                                <Text style={styles.secondaryBtnText}>Cancel</Text>
                            </Pressable>
                            <Pressable onPress={capture} style={styles.secondaryBtn}>
                                <Text style={styles.secondaryBtnText}>Snap</Text>
                            </Pressable>
                        </View>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#f7f7f7" },
    screen: { flex: 1 },

    header: {
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 16,
        height: "45%",
    },
    caloriesNumber: { fontSize: 64, fontWeight: "800", color: "#111827" },
    caloriesLabel: { fontSize: 18, color: "#6B7280", marginTop: -6 },

    bottomActions: { paddingHorizontal: 16, gap: 10 },
    outlineBtn: {
        borderWidth: 2,
        borderColor: "#000",
        backgroundColor: "#fff",
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: "center",
    },
    outlineBtnText: { color: "#000", fontWeight: "700", fontSize: 16 },

    cameraModal: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "#000",
        justifyContent: "flex-end",
    },
    cameraFill: { ...StyleSheet.absoluteFillObject },
    cameraControls: {
        padding: 16,
        backgroundColor: "rgba(0,0,0,0.5)",
        flexDirection: "row",
        justifyContent: "space-between",
    },
    secondaryBtn: {
        backgroundColor: "#FFFFFF",
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 10,
    },
    secondaryBtnText: { color: "#111827", fontWeight: "700" },
});