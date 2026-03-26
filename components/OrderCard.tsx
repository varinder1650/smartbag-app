import { getStatusConfig } from "@/constants/statusConfig";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";

export type Order = {
    order_id: string;
    id: string;
    created_at: string;
    delivered_at?: string | null;
    order_status?: string | null;
    total_amount: number;
    order_type: string;
};

type Props = {
    order: Order;
    onPress?: (order: Order) => void;
};


function OrderCard({ order, onPress }: Props) {
    if (!order) return null;
    const { order_id, id, created_at, delivered_at, order_status, total_amount, order_type } = order;

    const formattedCreated = created_at ? new Date(created_at).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }) : "Date not available";

    const formattedDelivered = delivered_at
        ? new Date(delivered_at).toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
        : null;

    const config = getStatusConfig(order_status || "unknown");
    const displayStatus = config.label;
    const statusColor = config.color;
    const statusIcon = config.icon;
    const isActive = order_status && !["delivered", "cancelled"].includes(order_status);

    const handlePress = () => {
        if (onPress) {
            onPress(order);
        } else {
            // Navigate to order tracking page with order ID
            router.push({
                pathname: "/order-tracking",
                params: { orderId: id || order_id }
            });
        }
    };

    return (
        <Pressable
            onPress={handlePress}
            className={`bg-white rounded-2xl p-5 mb-4 shadow-sm border ${isActive ? "border-blue-200" : "border-gray-100"
                }`}
        >
            {/* Header */}
            <View className="flex-row justify-between items-center mb-3">
                <View className="flex-1">
                    <Text className="font-bold text-gray-900 text-base">
                        Order #{(id || order_id || "").toUpperCase()}
                    </Text>
                    <Text className="text-gray-500 text-xs mt-0.5">
                        {order_type ? (order_type.charAt(0).toUpperCase() + order_type.slice(1)) : "Order"} Order
                    </Text>
                </View>

                <View className={`${statusColor} px-3 py-1.5 rounded-full flex-row items-center`}>
                    <Ionicons name={statusIcon as any} size={12} color="white" />
                    <Text className="text-white font-semibold text-xs ml-1 capitalize">
                        {displayStatus}
                    </Text>
                </View>
            </View>

            {/* Dates */}
            <View className="bg-gray-50 rounded-xl p-3 mb-3">
                <View className="flex-row items-center mb-1">
                    <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                    <Text className="text-gray-600 text-xs ml-2">
                        Ordered: <Text className="text-gray-900 font-medium">{formattedCreated}</Text>
                    </Text>
                </View>
                {formattedDelivered && (
                    <View className="flex-row items-center">
                        <Ionicons name="checkmark-done-outline" size={14} color="#22C55E" />
                        <Text className="text-gray-600 text-xs ml-2">
                            Delivered: <Text className="text-gray-900 font-medium">{formattedDelivered}</Text>
                        </Text>
                    </View>
                )}
            </View>

            {/* Footer */}
            <View className="flex-row justify-between items-center">
                <View>
                    <Text className="text-gray-500 text-xs">Total Amount</Text>
                    <Text className="text-blue-600 font-bold text-xl">₹{total_amount}</Text>
                </View>

                <View className="flex-row items-center">
                    <Text className="text-blue-600 font-semibold text-sm mr-1">
                        {isActive ? "Track Order" : "View Details"}
                    </Text>
                    <Ionicons name="chevron-forward" size={18} color="#3B82F6" />
                </View>
            </View>

            {/* Active Order Badge */}
            {isActive && (
                <View className="absolute -top-2 -right-2 bg-blue-500 px-3 py-1 rounded-full shadow-md">
                    <Text className="text-white text-xs font-bold">ACTIVE</Text>
                </View>
            )}
        </Pressable>
    );
}

export default React.memo(OrderCard);