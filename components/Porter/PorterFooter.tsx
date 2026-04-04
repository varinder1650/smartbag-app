import React from "react";
import { Pressable, Text, View } from "react-native";

interface PorterFooterProps {
    price: number;
    isUrgent: boolean;
    onAddToCart: () => void;
    isEditMode?: boolean;
}

function PorterFooter({ price, isUrgent, onAddToCart, isEditMode }: PorterFooterProps) {
    const label = isEditMode
        ? (isUrgent ? '⚡ Update Urgent Delivery' : 'Update Cart')
        : (isUrgent ? '⚡ Add Urgent Delivery' : 'Add to Cart');

    return (
        <View className="absolute bottom-0 w-full p-4 bg-white border-t">
            <Pressable
                onPress={onAddToCart}
                className={`py-4 rounded-xl items-center ${isUrgent ? 'bg-orange-500' : 'bg-primary'}`}
            >
                <Text className="text-white font-bold">
                    {label} • ₹{price}
                </Text>
            </Pressable>
        </View>
    );
}

export default React.memo(PorterFooter);
