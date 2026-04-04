import React from "react";
import { Pressable, Text, View } from "react-native";

interface PricingFooterProps {
    price: number;
    isUploading: boolean;
    onAddToCart: () => void;
    label?: string;
}

function PricingFooter({ price, isUploading, onAddToCart, label }: PricingFooterProps) {
    return (
        <View className="absolute bottom-0 w-full px-4 pb-6 bg-white border-t border-gray-200">
            <Pressable
                onPress={onAddToCart}
                disabled={isUploading}
                className={`py-4 rounded-2xl items-center ${isUploading ? "bg-gray-400" : "bg-primary"}`}
            >
                <Text className="text-white font-bold text-lg">
                    {isUploading ? "Uploading..." : `${label || "Add to Cart"} • ₹${price}`}
                </Text>
            </Pressable>
        </View>
    );
}

export default React.memo(PricingFooter);
