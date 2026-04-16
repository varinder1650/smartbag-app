import SafeView from "@/components/SafeView";
import { restoreAuth } from "@/slices/authSlice";
import { AppDispatch } from "@/store/store";
import api from "@/utils/client";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { useDispatch } from "react-redux";

export default function RequirePhoneScreen() {
    const dispatch = useDispatch<AppDispatch>();
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (phone.length < 10) {
            Alert.alert("Invalid phone number");
            return;
        }

        try {
            setLoading(true);
            await api.post("/auth/phone", { phone });

            // refresh user profile
            await dispatch(restoreAuth());

            router.replace("/");
        } catch (e: any) {
            Alert.alert("Error", e.response?.data?.detail || "Failed to update phone");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeView className="flex-1 bg-white">
            <View className="flex-1 justify-center px-8">
                <Text className="text-3xl font-extrabold text-gray-900 mb-2">
                    Add Phone Number
                </Text>
                <Text className="text-gray-500 mb-8">
                    Required to complete your account
                </Text>

                <TextInput
                    placeholder="Phone Number"
                    keyboardType="number-pad"
                    value={phone}
                    onChangeText={(text) => setPhone(text.replace(/[^0-9]/g, '').slice(0, 10))}
                    maxLength={10}
                    className="border border-gray-300 rounded-xl px-4 py-3 mb-6"
                />

                <Pressable
                    disabled={loading}
                    onPress={handleSubmit}
                    className="bg-primary py-4 rounded-xl"
                >
                    <Text className="text-white text-center font-bold text-lg">
                        {loading ? "Saving..." : "Continue"}
                    </Text>
                </Pressable>
            </View>
        </SafeView>
    );
}