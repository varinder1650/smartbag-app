import { useCartActions } from "@/hooks/useCartActions";
import { Product } from "@/types/products.types";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

interface Props {
    product: Product;
    customImageUrl?: string | null;
    requiresCustomImage?: boolean;
}

export default function CartButton({ product, customImageUrl, requiresCustomImage }: Props) {
    const { quantity, add, increase, decrease } = useCartActions(product, customImageUrl);

    const isAddDisabled = requiresCustomImage && !customImageUrl;

    return (
        <View className="absolute bottom-5 w-full z-50">
            {quantity === 0 ? (
                <Pressable
                    onPress={add}
                    disabled={isAddDisabled}
                    className={`flex-row justify-center items-center mx-5 rounded-full p-4 shadow-lg ${
                        isAddDisabled ? "bg-gray-400" : "bg-primary"
                    }`}
                >
                    <Text className="text-white font-extrabold text-lg">
                        Add to cart
                    </Text>
                </Pressable>
            ) : (
                <View className="flex-row justify-between items-center mx-5 rounded-full p-4 shadow-lg bg-white">
                    <Pressable onPress={decrease} className="bg-primary p-2 rounded-full">
                        <Ionicons name="remove" size={24} color="white" />
                    </Pressable>

                    <Pressable
                        onPress={() => router.push("/cart")}
                        className="flex-row items-center bg-primary rounded-full px-6 py-3"
                    >
                        <Text className="px-3 py-1 text-white font-extrabold text-lg bg-blue-300 rounded-full mr-2">
                            {quantity}
                        </Text>
                        <Text className="text-white font-extrabold">View Cart</Text>
                    </Pressable>

                    <Pressable onPress={increase} className="bg-primary p-2 rounded-full">
                        <Ionicons name="add" size={24} color="white" />
                    </Pressable>
                </View>
            )}
        </View>
    );
}