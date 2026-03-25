import { useCartActions } from "@/hooks/useCartActions";
import { ProductCartItem } from "@/types/cart.types";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, Pressable, Text, View } from "react-native";

function CartProductItemInner({ item }: { item: ProductCartItem }) {
    const { quantity, increase, decrease } = useCartActions(item);

    return (
        <View className="bg-white rounded-xl p-4 mb-3 flex-row">
            <Image
                source={{ uri: item.images?.[0] }}
                className="w-20 h-20 rounded-lg bg-gray-100"
            />

            <View className="flex-1 ml-3">
                <Text className="font-semibold text-gray-900" numberOfLines={2}>
                    {item.name}
                </Text>

                <Text className="text-primary font-bold text-lg mt-1">
                    ₹{item.selling_price || (item as any).price}
                </Text>

                {/* Quantity Controls */}
                <View className="flex-row items-center mt-2">
                    <Pressable
                        onPress={decrease}
                        className="bg-gray-100 w-8 h-8 rounded-full items-center justify-center"
                    >
                        <Ionicons name="remove" size={16} color="#111" />
                    </Pressable>

                    <Text className="mx-4 font-semibold text-lg">{quantity}</Text>

                    <Pressable
                        onPress={increase}
                        className="bg-primary w-8 h-8 rounded-full items-center justify-center"
                    >
                        <Ionicons name="add" size={16} color="white" />
                    </Pressable>
                </View>
            </View>
        </View>
    );
}

export const CartProductItem = React.memo(CartProductItemInner);