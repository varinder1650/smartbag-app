import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

export default function UploadSuccessOverlay({ visible }: { visible: boolean }) {
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 4,
                    tension: 50,
                    useNativeDriver: true,
                })
            ]).start();
        } else {
            scaleAnim.setValue(0);
            opacityAnim.setValue(0);
        }
    }, [visible, scaleAnim, opacityAnim]);

    if (!visible) return null;

    return (
        <View style={styles.overlay}>
            <View style={styles.container}>
                <Animated.View style={{ transform: [{ scale: scaleAnim }], opacity: opacityAnim, alignItems: "center" }}>
                    <View className="bg-green-100 rounded-full p-6 mb-4">
                        <Ionicons name="checkmark-circle" size={100} color="#10B981" />
                    </View>
                    <Text className="text-2xl font-bold text-gray-800">Done!</Text>
                    <Text className="text-base text-gray-500 mt-2">Files uploaded successfully</Text>
                </Animated.View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
    },
    container: {
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
    }
});
