import { AddressCard } from "@/components/AddressCard";
import AddressModal from "@/components/AddressModel";
import { RootState } from "@/store/store";
import { Address } from "@/types/address.types";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useSelector } from "react-redux";

export default function AddressScreen() {
    const params = useLocalSearchParams<{
        mode?: "select";
        addressType?: "pickup" | "delivery" | "checkout";
    }>();
    const router = useRouter();

    const isSelectMode = params.mode === "select";
    const addresses = useSelector((state: RootState) => state.address.items);

    const [modalVisible, setModalVisible] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);

    const title = isSelectMode
        ? params.addressType === "checkout"
            ? "Select delivery address"
            : `Select ${params.addressType} address`
        : "My Addresses";

    return (
        <View className="flex-1 justify-end bg-black/40">
            <Pressable className="absolute inset-0" onPress={() => router.back()} />
            
            <View className="bg-gray-50 h-[80%] rounded-t-3xl overflow-hidden">
                {/* Header with X button */}
                <View className="flex-row items-center justify-between px-5 py-4 bg-white shadow-sm z-10">
                    <Text className="text-xl font-extrabold text-gray-900">{title}</Text>
                    <Pressable 
                        onPress={() => router.back()} 
                        className="bg-gray-100 p-1.5 rounded-full"
                    >
                        <Ionicons name="close" size={22} color="#374151" />
                    </Pressable>
                </View>

                <FlatList
                    data={addresses}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
                    renderItem={({ item }) => (
                        <AddressCard
                            {...item}
                            mode={isSelectMode}
                            addressType={params.addressType}
                            onEdit={() => {
                                setEditingAddress(item);
                                setModalVisible(true);
                            }}
                        />
                    )}
                    ListEmptyComponent={
                        <View className="items-center mt-24">
                            <Ionicons name="location-outline" size={48} color="#9CA3AF" />
                            <Text className="mt-4 text-gray-500">
                                No addresses added yet
                            </Text>
                        </View>
                    }
                />

                {!isSelectMode && (
                    <Pressable
                        onPress={() => setModalVisible(true)}
                        className="absolute bottom-6 left-4 right-4 bg-primary flex-row py-4 rounded-xl items-center justify-center shadow-md"
                    >
                        <Ionicons name="add" size={24} color="white" />
                        <Text className="text-white font-semibold text-lg ml-2">Add Address</Text>
                    </Pressable>
                )}

                <AddressModal
                    visible={modalVisible}
                    initialData={editingAddress}
                    onClose={() => {
                        setModalVisible(false);
                        setEditingAddress(null);
                    }}
                />
            </View>
        </View>
    );
}
