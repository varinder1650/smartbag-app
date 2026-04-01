import { AddressCard } from "@/components/AddressCard";
import AddressModal from "@/components/AddressModel";
import SafeView from "@/components/SafeView";
import TitleBar from "@/components/TitleBar";
import { RootState } from "@/store/store";
import { Address } from "@/types/address.types";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useSelector } from "react-redux";

export default function AddressScreen() {
    const params = useLocalSearchParams<{
        mode?: "select";
        addressType?: "pickup" | "delivery" | "checkout";
    }>();

    const isSelectMode = params.mode === "select";
    const addresses = useSelector((state: RootState) => state.address.items);

    const [modalVisible, setModalVisible] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    const mapPickerResult = useSelector((state: RootState) => state.mapPicker.result);

    // Auto-open modal when returning from map picker with results
    useFocusEffect(
        useCallback(() => {
            if (mapPickerResult) {
                setEditingAddress(null);
                setModalVisible(true);
            }
        }, [mapPickerResult])
    );

    return (
        <SafeView className="flex-1 bg-gray-50">
            <TitleBar
                title={
                    isSelectMode
                        ? params.addressType === "checkout"
                            ? "Select delivery address"
                            : `Select ${params.addressType} address`
                        : "My Addresses"
                }
                subtitle=""
            />

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
                    className="absolute bottom-6 right-6 bg-primary w-14 h-14 rounded-full items-center justify-center shadow-lg"
                >
                    <Ionicons name="add" size={26} color="white" />
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
        </SafeView>
    );
}
