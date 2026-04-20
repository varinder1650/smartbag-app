import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, Text, View } from "react-native";
import { OrderItem } from "./types";

interface OrderDetailsSectionProps {
    items: OrderItem[];
}

function ProductItem({ item }: { item: Extract<OrderItem, { type: "product" }> }) {
    return (
        <View className="flex-row items-center mb-3 pb-3 border-b border-gray-100">
            {item.product_image?.[0] && typeof item.product_image[0] === 'string' && (
                <Image
                    source={{ uri: item.product_image[0] }}
                    className="w-16 h-16 rounded-lg"
                    resizeMode="cover"
                />
            )}
            <View className="flex-1 ml-3">
                <Text className="font-semibold text-gray-900">
                    {item.product_name || 'Product'}
                </Text>
                <Text className="text-gray-500 text-sm">
                    Qty: {item.quantity} x ₹{item.price}
                </Text>
                {item.user_custom_image && (
                    <View className="flex-row items-center mt-1">
                        <Ionicons name="image-outline" size={14} color="#3B82F6" />
                        <Text className="text-blue-500 text-xs ml-1">Custom image attached</Text>
                    </View>
                )}
            </View>
            <Text className="font-bold text-gray-900">
                ₹{item.quantity * item.price}
            </Text>
        </View>
    );
}

function PorterItem({ item }: { item: Extract<OrderItem, { type: "porter" }> }) {
    const serviceData = item.service_data;
    return (
        <View className="bg-green-50 rounded-xl p-4 mb-3 border border-green-200">
            <View className="flex-row items-center mb-3">
                <View className="bg-green-500 w-12 h-12 rounded-full items-center justify-center">
                    <Ionicons name="bicycle" size={24} color="white" />
                </View>
                <View className="flex-1 ml-3">
                    <Text className="font-bold text-gray-900">Porter Delivery Service</Text>
                    <Text className="text-green-700 text-sm font-semibold">
                        ₹{serviceData?.estimated_cost || 0}
                    </Text>
                </View>
                {serviceData?.is_urgent && (
                    <View className="bg-red-500 px-2 py-1 rounded-full">
                        <Text className="text-white text-xs font-bold">URGENT</Text>
                    </View>
                )}
            </View>

            <View className="bg-white rounded-lg p-3">
                <View className="flex-row items-start mb-3">
                    <Ionicons name="location-outline" size={16} color="#10B981" />
                    <View className="flex-1 ml-2">
                        <Text className="text-gray-600 text-xs">Pickup</Text>
                        <Text className="text-gray-900 text-sm">
                            {serviceData?.pickup_address?.street}, {serviceData?.pickup_address?.city}
                        </Text>
                    </View>
                </View>

                <View className="flex-row items-start mb-2">
                    <Ionicons name="location" size={16} color="#10B981" />
                    <View className="flex-1 ml-2">
                        <Text className="text-gray-600 text-xs">Delivery</Text>
                        <Text className="text-gray-900 text-sm">
                            {serviceData?.delivery_address?.street}, {serviceData?.delivery_address?.city}
                        </Text>
                    </View>
                </View>

                <View className="flex-row items-center pt-2 border-t border-gray-100">
                    <Ionicons name="navigate" size={14} color="#6B7280" />
                    <Text className="text-gray-600 text-sm ml-1">
                        {serviceData?.estimated_distance || 0} km distance
                    </Text>
                </View>

                {serviceData?.notes && (
                    <View className="bg-gray-50 rounded p-2 mt-2">
                        <Text className="text-gray-700 text-xs">
                            📝 {serviceData.notes}
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
}

function PrintoutItem({ item }: { item: Extract<OrderItem, { type: "printout" }> }) {
    const serviceData = item.service_data;
    const isPhoto = serviceData?.print_type === 'photo';

    return (
        <View className="bg-purple-50 rounded-xl p-4 mb-3 border border-purple-200">
            <View className="flex-row items-center mb-3">
                <View className="bg-purple-500 w-12 h-12 rounded-full items-center justify-center">
                    <Ionicons
                        name={isPhoto ? "images" : "document-text"}
                        size={24}
                        color="white"
                    />
                </View>
                <View className="flex-1 ml-3">
                    <Text className="font-bold text-gray-900">
                        {isPhoto ? 'Photo Print' : 'Document Print'}
                    </Text>
                    <Text className="text-purple-700 text-sm font-semibold">
                        {serviceData?.pages || 1} {isPhoto ? 'photos' : 'pages'} x {serviceData?.copies || 1} {serviceData?.copies === 1 ? 'copy' : 'copies'}
                    </Text>
                </View>
            </View>

            <View className="bg-white rounded-lg p-3">
                <View className="flex-row justify-between mb-2">
                    <Text className="text-gray-600 text-sm">Paper Size</Text>
                    <Text className="text-gray-900 text-sm font-semibold">
                        {serviceData?.paper_size || 'A4'}
                    </Text>
                </View>
                <View className="flex-row justify-between">
                    <Text className="text-gray-600 text-sm">Color</Text>
                    <Text className="text-gray-900 text-sm font-semibold">
                        {serviceData?.color ? 'Yes' : 'B&W'}
                    </Text>
                </View>
                {serviceData?.notes && (
                    <View className="pt-2 mt-2 border-t border-gray-100">
                        <Text className="text-gray-600 text-xs mb-1">Notes:</Text>
                        <Text className="text-gray-700 text-sm">{serviceData.notes}</Text>
                    </View>
                )}
            </View>
        </View>
    );
}

function OrderDetailsSection({ items }: OrderDetailsSectionProps) {
    return (
        <View className="bg-white px-6 py-5 mb-4">
            <Text className="font-bold text-gray-900 mb-4">
                Order Items ({items.length})
            </Text>
            {items.map((item, index) => {
                if (item.type === 'product') return <ProductItem key={index} item={item} />;
                if (item.type === 'porter') return <PorterItem key={index} item={item} />;
                if (item.type === 'printout') return <PrintoutItem key={index} item={item} />;
                return null;
            })}
        </View>
    );
}

export default React.memo(OrderDetailsSection);
