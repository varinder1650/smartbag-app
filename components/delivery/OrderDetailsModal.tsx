import api from "@/utils/client";
import { useEffect, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from "react-native";

type OrderDetails = {
    id: string;
    created_at: string;
    order_status: string;
    payment_method: string;
    order_type: string;
    payment_amount?: number;
    customer: {
        name: string;
        phone: string;
    };
    delivery_address?: any;

    porter?: {
        pickup: string;
        drop: string;
        recipient_name?: string;
        phone?: string;
        distance?: number;
    };
    items: {
        type: string;
        name?: string;
        quantity?: number;
    }[];
};

type Props = {
    orderId: string | null;
    visible: boolean;
    onClose: () => void;
};

export default function OrderDetailsModal({ orderId, visible, onClose }: Props) {
    const [loading, setLoading] = useState(false);
    const [order, setOrder] = useState<OrderDetails | null>(null);

    useEffect(() => {
        if (!visible || !orderId) return;

        const fetchDetails = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/delivery/order/${orderId}`);
                setOrder(res.data);
            } catch {
                setOrder(null);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [visible, orderId]);

    return (
        <Modal transparent visible={visible} animationType="slide">
            <View className="flex-1 bg-black/50 justify-end">
                <View className="bg-white rounded-t-3xl max-h-[85%]">

                    {/* Header */}
                    <View className="px-5 py-4 border-b border-gray-200 flex-row justify-between">
                        <Text className="text-lg font-bold">Order Details</Text>
                        <Pressable onPress={onClose}>
                            <Text className="text-red-500 font-semibold">Close</Text>
                        </Pressable>
                    </View>

                    {/* Content */}
                    <ScrollView className="px-5 py-4">
                        {loading && (
                            <ActivityIndicator size="large" className="mt-10" />
                        )}

                        {!loading && order && (
                            <View className="space-y-3">

                                <Text className="text-sm text-gray-500">
                                    Order ID: <Text className="text-gray-900">{order.id}</Text>
                                </Text>

                                <Text className="text-sm text-gray-500">
                                    Date: <Text className="text-gray-900">
                                        {new Date(order.created_at).toLocaleString()}
                                    </Text>
                                </Text>

                                <Text className="text-sm">
                                    Status: <Text className="font-semibold capitalize">
                                        {order.order_status.replace("_", " ")}
                                    </Text>
                                </Text>

                                <Text className="text-sm">
                                    Order Type: <Text className="font-semibold capitalize">
                                        {order.order_type}
                                    </Text>
                                </Text>

                                <View className="border-t pt-3">
                                    <Text className="font-semibold">Customer</Text>
                                    <Text>{order.customer.name}</Text>
                                    <Text>{order.customer.phone}</Text>
                                </View>

                                {order.delivery_address && (
                                    <View className="border-t pt-3">
                                        <Text className="font-semibold">Delivery Address: {order.delivery_address.street}, {order.delivery_address.city}, {order.delivery_address.state} - {order.delivery_address.pincode}</Text>
                                    </View>
                                )}

                                {order.porter && (
                                    <View className="border-t pt-3">
                                        <Text className="font-semibold">Porter Details</Text>
                                        {order.porter.recipient_name && (
                                            <Text>Recipient: {order.porter.recipient_name}</Text>
                                        )}
                                        {order.porter.phone && (
                                            <Text>Recipient Phone: {order.porter.phone}</Text>
                                        )}
                                        {order.porter.distance != null && (
                                            <Text>Distance: {order.porter.distance} km</Text>
                                        )}
                                        <Text>Pickup: {order.porter.pickup}</Text>
                                        <Text>Drop: {order.porter.drop}</Text>
                                    </View>
                                )}

                                {/* Items */}
                                {order.items && order.items.length > 0 && (
                                    <View className="border-t pt-3">
                                        {order.items.map((item, idx) => (
                                            <View
                                                key={idx}
                                                className="mb-2 border p-2 rounded-lg"
                                            >
                                                <Text className="font-semibold text-gray-700 mb-1">Items: {item.type}</Text>
                                                {item.type === "product" && (
                                                    <Text className="text-gray-900">{item.name} x {item.quantity}</Text>
                                                )}
                                            </View>
                                        ))}
                                    </View>
                                )}

                                {order.payment_method && (
                                    <View className="border-t pt-3">
                                        <Text className="font-semibold">
                                            Payment Method - {order.payment_method}
                                        </Text>
                                        {order.payment_method === "cod" && (
                                            <Text className="text-lg font-bold">
                                                ₹{order.payment_amount}
                                            </Text>
                                        )}
                                    </View>
                                )}
                            </View>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}
