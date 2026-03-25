import React from "react";
import { Pressable, Text, View } from "react-native";

interface PorterFooterProps {
    price: number;
    isUrgent: boolean;
    onAddToCart: () => void;
}

function PorterFooter({ price, isUrgent, onAddToCart }: PorterFooterProps) {
    return (
        <View className="absolute bottom-0 w-full p-4 bg-white border-t">
            <Pressable
                onPress={onAddToCart}
                className={`py-4 rounded-xl items-center ${isUrgent ? 'bg-orange-500' : 'bg-primary'}`}
            >
                <Text className="text-white font-bold">
                    {isUrgent ? '⚡ Add Urgent Delivery' : 'Add to Cart'} • ₹{price}
                </Text>
            </Pressable>
        </View>
    );
}

export default React.memo(PorterFooter);
