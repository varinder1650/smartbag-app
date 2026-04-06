import AddressModal from "@/components/AddressModel";
import { Address } from "@/types/address.types";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

export default function AddressSection({
    defaultAddress,
}: {
    defaultAddress: Address | null;
}) {
    const [showAddModal, setShowAddModal] = useState(false);

    return (
        <View className="p-2 mt-4">
            <View className="flex-row justify-between items-center mb-3">
                <Text className="font-bold text-lg">Delivery Address</Text>

                <View className="flex-row gap-2">
                    <Pressable
                        onPress={() => setShowAddModal(true)}
                        className="px-3 py-1.5 bg-green-50 rounded-full flex-row items-center"
                    >
                        <Ionicons name="add-circle-outline" size={14} color="#16A34A" />
                        <Text className="text-green-700 text-sm font-semibold ml-1">New</Text>
                    </Pressable>

                    <Pressable
                        onPress={() => router.push("/address?mode=select&addressType=checkout")}
                        className="px-3 py-1.5 bg-primary/10 rounded-full"
                    >
                        <Text className="text-primary text-sm font-semibold">
                            {defaultAddress ? "Change" : "Select"}
                        </Text>
                    </Pressable>
                </View>
            </View>

            <AddressModal
                visible={showAddModal}
                onClose={() => setShowAddModal(false)}
            />

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
