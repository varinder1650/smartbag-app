import api from "@/utils/client";
import { useState } from "react";
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

const statusColors: Record<string, string> = {
    preparing: "bg-yellow-400",
    out_for_delivery: "bg-blue-500",
    delivered: "bg-green-500",
    cancelled: "bg-red-500",
    assigning: "bg-orange-500",
};

export default function AvailableOrderCard({ order, onActionComplete }: Props) {
    const [isAccepted, setIsAccepted] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const formattedDate = new Date(order.created_at).toLocaleString();

    const handlePress = () => {
        // console.log("Card pressed", { id: order.id, isAccepted, isProcessing });
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
                            console.error(error);
                            Alert.alert("Error", "Failed to accept order");
                            setIsProcessing(false);
                        }
                    },
                },
            ]
        );
    };

    const displayStatus = isAccepted ? "Accepted" : order.order_status.replace("_", " ");
    const displayColor = isAccepted ? "bg-green-600" : (statusColors[order.order_status] || "bg-gray-300");

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
