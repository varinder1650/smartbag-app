import api from "@/utils/client";
import { FontAwesome } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useState } from "react";
import { Alert, Modal, Pressable, Text, View } from "react-native";
import OrderDetailsModal from "./OrderDetailsModal";

export type AssignedOrder = {
    id: string;
    created_at: string;
    order_status: string;
    payment_method: string;
    payment_amount?: number;
    customer: {
        name: string;
        phone: string;
    };
    delivery?: {
        address: string;
    };
    porter?: {
        pickup: string;
        drop: string;
        recipient_name?: string;
        phone?: string;
        distance?: number;
    };
};

type Props = {
    order: AssignedOrder;
    onActionComplete?: () => void;
};

const statusColors: Record<string, string> = {
    preparing: "bg-yellow-400",
    out_for_delivery: "bg-blue-500",
    delivered: "bg-green-500",
    cancelled: "bg-red-500",
    assigning: "bg-orange-500",
};

export default function AssignedOrderCard({ order, onActionComplete }: Props) {
    const [showActions, setShowActions] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    const formattedDate = new Date(order.created_at).toLocaleString();

    const openWhatsApp = () => {
        Linking.openURL(`https://wa.me/${order.customer.phone}`);
    };

    const markDelivered = async () => {
        try {
            await api.post(`/delivery/${order.id}/mark-delivered`);
            Alert.alert("Success", "Order marked as delivered");
            onActionComplete?.();
        } catch {
            Alert.alert("Error", "Failed to mark delivered");
        }
    };

    return (
        <>
            <Pressable
                onPress={() => setShowActions(true)}
                className="bg-white rounded-2xl p-4 mb-4 shadow-md"
            >
                <View className="flex-row justify-between items-center">
                    <Text className="font-bold text-base">Order {order.id}</Text>
                    <View className={`${statusColors[order.order_status] || "bg-gray-300"} px-3 py-1 rounded-full`}>
                        <Text className="text-white font-semibold text-xs capitalize">
                            {order.order_status.replace("_", " ")}
                        </Text>
                    </View>
                    <Pressable onPress={openWhatsApp}>
                        <FontAwesome name="whatsapp" size={22} color="#25D366" />
                    </Pressable>
                </View>

                <Text className="text-gray-500 text-sm mt-1">{formattedDate}</Text>

                <Text className="text-sm mt-2">
                    Customer: <Text className="font-medium">{order.customer.name}</Text>
                </Text>

                <Text className="text-sm">
                    Phone: <Text className="font-medium">{order.customer.phone}</Text>
                </Text>

                {order.delivery && (
                    <Text className="text-sm mt-1">
                        Address: {order.delivery.address}
                    </Text>
                )}

                {order.porter && (
                    <View className="mt-1">
                        {order.porter.recipient_name && (
                            <Text className="text-sm">
                                Recipient: <Text className="font-medium">{order.porter.recipient_name}</Text>
                            </Text>
                        )}
                        {order.porter.phone && (
                            <Text className="text-sm">
                                Recipient Phone: <Text className="font-medium">{order.porter.phone}</Text>
                            </Text>
                        )}
                        {order.porter.distance != null && (
                            <Text className="text-sm">
                                Distance: <Text className="font-medium">{order.porter.distance} km</Text>
                            </Text>
                        )}
                        <Text className="text-sm">
                            Pickup: {order.porter.pickup}
                        </Text>
                        <Text className="text-sm">
                            Drop: {order.porter.drop}
                        </Text>
                    </View>
                )}

                {order.payment_method === "cod" && (
                    <Text className="text-sm mt-1 font-semibold">
                        Amount: ₹{order.payment_amount?.toFixed(2)}
                    </Text>
                )}
            </Pressable>

            {/* ACTION MODAL */}
            <Modal transparent visible={showActions} animationType="fade">
                <Pressable
                    onPress={() => setShowActions(false)}
                    className="flex-1 bg-black/50 justify-center items-center px-6"
                >
                    {/* Stop propagation */}
                    <Pressable className="w-full max-w-sm bg-white rounded-2xl overflow-hidden">

                        {/* Header */}
                        <View className="px-5 py-4 border-b border-gray-200">
                            <Text className="text-lg font-bold text-gray-900 text-center">
                                Order Actions
                            </Text>
                        </View>

                        {/* Actions */}
                        <View className="divide-y divide-gray-200">

                            {/* View Details */}
                            <Pressable
                                onPress={() => {
                                    setShowActions(false);
                                    setShowDetailsModal(true);
                                }}
                                className="py-4 active:bg-gray-100"
                            >
                                <Text className="text-center text-blue-600 font-semibold text-base">
                                    View Order Details
                                </Text>
                            </Pressable>

                            {/* Mark Delivered */}
                            <Pressable
                                onPress={markDelivered}
                                className="py-4 active:bg-gray-100"
                            >
                                <Text className="text-center text-green-600 font-semibold text-base">
                                    Mark as Delivered
                                </Text>
                            </Pressable>

                            {/* Cancel */}
                            <Pressable
                                onPress={() => setShowActions(false)}
                                className="py-4 active:bg-gray-100"
                            >
                                <Text className="text-center text-red-500 font-semibold text-base">
                                    Cancel
                                </Text>
                            </Pressable>

                        </View>
                    </Pressable>
                </Pressable>
            </Modal>

            <OrderDetailsModal orderId={order.id} visible={showDetailsModal} onClose={() => setShowDetailsModal(false)} />
        </>
    );
}
