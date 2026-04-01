import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";

interface PorterPricingCardProps {
    price: number;
    isUrgent: boolean;
}

function PorterPricingCard({ price, isUrgent }: PorterPricingCardProps) {
    if (price <= 0) return null;

    return (
        <View className={`p-4 rounded-xl ${isUrgent ? 'bg-orange-50 border border-orange-200' : 'bg-blue-50'}`}>
            <View className="flex-row items-center justify-between mb-1">
                <Text className="text-sm text-gray-600">Estimated Price</Text>
                {isUrgent && (
                    <View className="flex-row items-center bg-orange-100 px-2 py-1 rounded-full">
                        <Ionicons name="flash" size={12} color="#FF6B00" />
                        <Text className="text-xs font-semibold text-orange-600 ml-1">URGENT</Text>
                    </View>
                )}
            </View>
            <Text className={`text-2xl font-bold ${isUrgent ? 'text-orange-600' : 'text-primary'}`}>
                ₹{price}
            </Text>
            {isUrgent && (
                <Text className="text-xs text-gray-500 mt-1">
                    Includes priority surcharge
                </Text>
            )}
        </View>
    );
}

export default React.memo(PorterPricingCard);
