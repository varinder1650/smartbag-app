import { getStatusConfig } from "@/constants/statusConfig";
import api from "@/utils/client";
import React, { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";

export type AvailableOrder = {
    id: string;
    created_at: string;
    order_status: string;
};

type Props = {
    order: AvailableOrder;
    onActionComplete?: () => void;
};


function AvailableOrderCard({ order, onActionComplete }: Props) {
    const [isAccepted, setIsAccepted] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const formattedDate = new Date(order.created_at).toLocaleString();

    const handlePress = () => {
        // Prevent double submission
        if (isAccepted || isProcessing) return;

        Alert.alert(
            "Accept Order",
            `Do you want to accept order ${order.id}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Accept",
                    onPress: async () => {
                        setIsProcessing(true);
                        try {
                            await api.post(`/delivery/${order.id}/accept`);
                            setIsAccepted(true);
                            Alert.alert("Success", "Order accepted successfully!");
                            onActionComplete?.();
                        } catch (error) {
                            if (__DEV__) console.error(error);
                            Alert.alert("Error", "Failed to accept order");
                            setIsProcessing(false);
                        }
                    },
                },
            ]
        );
    };

    const config = getStatusConfig(order.order_status);
    const displayStatus = isAccepted ? "Accepted" : config.label;
    const displayColor = isAccepted ? "bg-green-600" : config.color;

    return (
        <Pressable
            onPress={handlePress}
            className={`bg-white rounded-2xl p-4 mb-4 shadow-md ${isAccepted ? "opacity-75" : ""}`}
        >
            <View className="flex-row justify-between items-center mb-2">
                <Text className="font-bold text-gray-900 text-base">Order ID: {order.id}</Text>
                <View className={`${displayColor} px-3 py-1 rounded-full`}>
                    <Text className="text-white font-semibold text-xs capitalize">
                        {displayStatus}
                    </Text>
                </View>
            </View>

            <View className="mb-2">
                <Text className="text-gray-500 text-sm">
                    Date: <Text className="text-gray-900">{formattedDate}</Text>
                </Text>
            </View>

            {isProcessing && !isAccepted && (
                <Text className="text-blue-500 text-xs mt-1">Processing...</Text>
            )}
        </Pressable>
    );
}

export default React.memo(AvailableOrderCard);
