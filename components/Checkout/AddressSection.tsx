import { Address } from "@/types/address.types";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function AddressSection({
    defaultAddress,
}: {
    defaultAddress: Address | null;
}) {
    return (
        <View className="p-2 mt-4">
            <View className="flex-row justify-between items-center mb-3">
                <Text className="font-bold text-lg">Delivery Address</Text>

                <Pressable
                    onPress={() => router.push("/address")}
                    className="px-4 py-1.5 bg-primary/10 rounded-full"
                >
                    <Text className="text-primary text-sm font-semibold">
                        {defaultAddress ? "Change" : "Add"}
                    </Text>
                </Pressable>
            </View>

            {defaultAddress ? (
                <View className="gap-1">
                    {defaultAddress.name ? (
                        <Text className="text-gray-900 font-bold mb-1">
                            {defaultAddress.name}
                        </Text>
                    ) : null}

                    <Text className="text-gray-900 font-medium">
                        {defaultAddress.street}
                    </Text>

                    <Text className="text-gray-600">
                        {defaultAddress.city}, {defaultAddress.state} (
                        {defaultAddress.pincode})
                    </Text>

                    <View className="flex-row items-center mt-1">
                        <Ionicons name="call-outline" size={14} color="#6B7280" />
                        <Text className="text-gray-600 ml-2">
                            {defaultAddress.mobile_number}
                        </Text>
                    </View>
                </View>
            ) : (
                <Text className="text-gray-500">
                    No address selected. Please add one.
                </Text>
            )}
        </View>
    );
}
