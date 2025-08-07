import { View, Text, Button, Image, StyleSheet } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useState, useRef } from "react";
import { detectDishWithClarifai, DetectionResult } from "./services/clarifai";

export default function HomeScreen() {
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const cameraRef = useRef<CameraView>(null);

    // State to hold food detection results
    const [detections, setDetections] = useState<DetectionResult[]>([]);

    // Camera permission hook
    const [permission, requestPermission] = useCameraPermissions();

    // Handle the three permission states
    if (!permission) {
        return (
            <View style={styles.center}>
                <Text>Requesting camera access…</Text>
            </View>
        );
    }
    if (!permission.granted) {
        return (
            <View style={styles.center}>
                <Text>Camera permission denied.</Text>
                <Button title="Grant permission" onPress={requestPermission} />
            </View>
        );
    }

    // Take a photo, send base64 to Clarifai, and store the results
    const takePhoto = async () => {
        if (!cameraRef.current) return;

        // Clear previous detections
        setDetections([]);

        // Capture with base64
        const photo = await cameraRef.current.takePictureAsync({
            quality: 0.8,
            base64: true,
        });
        setPhotoUri(photo.uri);

        // Send to Clarifai
        try {
            const results = await detectDishWithClarifai(photo.base64!);
            setDetections(results);
        } catch (error) {
            console.error("Clarifai detection error:", error);
        }
    };

    // Pick an image, send base64 to Clarifai, and store the results
    const pickImage = async () => {
        // Clear previous detections
        setDetections([]);

        const result = await ImagePicker.launchImageLibraryAsync({
            quality: 0.8,
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            base64: true,
        });

        if (!result.canceled && result.assets.length > 0) {
            const asset = result.assets[0];
            setPhotoUri(asset.uri);

            try {
                const results = await detectDishWithClarifai(asset.base64!);
                setDetections(results);
            } catch (error) {
                console.error("Clarifai detection error:", error);
            }
        }
    };

    return (
        <View style={styles.container}>
            <CameraView ref={cameraRef} style={styles.preview} />
            <View style={styles.buttons}>
                <Button title="Take Photo" onPress={takePhoto} />
                <Button title="Pick From Gallery" onPress={pickImage} />
            </View>
            {photoUri && <Image source={{ uri: photoUri }} style={styles.preview} />}

            {detections.length > 0 && (
              <View style={styles.detections}>
                {detections
                  .filter(d => d.confidence > 0.6)            // show 60 %+ only
                  .map((d, i) => (
                    <Text key={i}>
                      {d.name} — {(d.confidence * 100).toFixed(0)}%
                    </Text>
                  ))}
              </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, justifyContent: "flex-start" },
    preview: { width: "100%", height: 300, marginVertical: 16 },
    buttons: { flexDirection: "row", justifyContent: "space-around" },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    detections: { padding: 16, backgroundColor: "#f9f9f9" },
});