import { useCartActions } from "@/hooks/useCartActions";
import { Product } from "@/types/products.types";
import { router } from "expo-router";
import { Image, Pressable, Text, View } from "react-native";

export interface CartActionItem {
    id: string;
    name: string;
    actual_price: number;
    selling_price: number;
    discount: number;
    images?: string[];
    quantity?: number;
    stock: number;
    allow_user_images?: boolean;
    allow_user_description?: boolean;
}

export default function ProductCard({ id, images, name, actual_price, selling_price, discount, stock, allow_user_images, allow_user_description }: Product) {
    const cartItem: Product = { id, name, actual_price, selling_price, discount, images, stock, allow_user_images, allow_user_description };
    const { quantity, add, increase, decrease } = useCartActions(cartItem);

    const fallbackImage = require("../../assets/prod.webp");
    const imageSource = images && images.length > 0 ? { uri: images[0] } : fallbackImage;
    // console.log("allow_user_images", cartItem);
    const in_stock = stock > 0;
    return (
        <View className="w-28 mr-3">
            <Pressable
                disabled={!in_stock}
                onPress={() => in_stock && router.push(`/product/${id}`)}
                className={`bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden ${!stock ? "opacity-60" : ""
                    }`}
            >
                <View className="relative bg-gray-50">
                    <Image
                        source={imageSource}
                        className="w-full h-28"
                        resizeMode="contain"
                    />

                    {!in_stock && (
                        <View className="absolute inset-0 bg-white/70 items-center justify-center">
                            <Text className="text-gray-700 font-bold text-xs">
                                OUT OF STOCK
                            </Text>
                        </View>
                    )}

                    {in_stock && (
                        quantity === 0 ? (
                            <Pressable
                                onPress={add}
                                className="absolute bottom-2 right-2 bg-white border border-primary rounded-md px-3 py-1 shadow"
                            >
                                <Text className="text-primary font-bold text-[10px]">
                                    ADD
                                </Text>
                            </Pressable>
                        ) : (
                            <View className="absolute bottom-2 right-2 flex-row items-center bg-white border border-primary rounded-md shadow">
                                <Pressable onPress={decrease} className="px-2 py-1">
                                    <Text className="text-primary font-bold text-xs">−</Text>
                                </Pressable>

                                <Text className="text-primary font-bold text-xs">
                                    {quantity}
                                </Text>

                                <Pressable onPress={increase} className="px-2 py-1">
                                    <Text className="text-primary font-bold text-xs">+</Text>
                                </Pressable>
                            </View>
                        ))}
                </View>

                {/* Info (Very Compact) */}
                <View className="p-2">
                    <Text
                        numberOfLines={2}
                        className="text-gray-900 font-medium text-xs leading-4"
                    >
                        {name}
                    </Text>

                    <View className="mt-1">
                        <View className="flex-row items-center">
                            <Text className="text-gray-400 text-[10px] line-through">
                                ₹{actual_price || 0}
                            </Text>
                            <Text className="ml-1 text-green-600 text-[10px] font-bold">
                                {Math.floor(discount || 0)}% OFF
                            </Text>
                        </View>

                        <Text className="text-gray-900 font-bold text-sm">
                            ₹{selling_price || 0}
                        </Text>
                    </View>
                </View>
            </Pressable>
        </View>


    );
}