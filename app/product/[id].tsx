
import Cartbutton from "@/components/CartButton";
import SafeView from "@/components/SafeView";
import { Product } from "@/types/products.types";
import { loadProductDetails } from "@/utils/products";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from "react-native";

export default function ProductsDetails() {
    const navigation = useNavigation();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { id } = useLocalSearchParams<{ id: string }>();

    useEffect(() => {
        let cancelled = false;

        const loadProduct = async () => {
            if (!id) return;
            try {
                setLoading(true);
                setError(null);
                const data = await loadProductDetails(id);
                setProduct(data);
                if (!cancelled) {
                    setLoading(false);
                }
            } catch (err) {
                if (!cancelled) {
                    setError("Failed to load product details");
                    if (__DEV__) console.log(err);
                }
            } finally {
                setLoading(false);
            }
        };
        loadProduct();
        return () => {
            cancelled = true;
        };
    }, [id]);

    if (loading) {
        return (
            <View className="flex-1 bg-white">
                <View className="px-6 justify-center items-center">
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text className="mt-4 text-gray-500">Loading product...</Text>
                </View>
            </View>
        );
    }

    // Add error state
    if (error || !product) {
        return (
            <View className="flex-1 bg-white">
                <View className="px-6 justify-center items-center">
                    <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
                    <Text className="text-gray-900 text-lg font-bold mt-4">
                        {error || 'Product not found'}
                    </Text>
                    <Pressable
                        onPress={() => navigation.goBack()}
                        className="mt-6 bg-primary px-6 py-3 rounded-xl"
                    >
                        <Text className="text-white font-semibold">Go Back</Text>
                    </Pressable>
                </View>
            </View>
        );
    }

    const images = product?.images || [];

    return (
        <SafeView className="flex-1 bg-white">
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* IMAGE SECTION */}
                <View className="relative">
                    <Image
                        source={{ uri: images[0] }}
                        className="w-full h-96"
                        resizeMode="cover"
                    />

                    {/* Back Button */}
                    <Pressable
                        onPress={() => navigation.goBack()}
                        className="absolute top-4 left-4 bg-black/40 p-3 rounded-full"
                    >
                        <Ionicons name="arrow-back" size={22} color="white" />
                    </Pressable>
                </View>

                {/* CONTENT SHEET */}
                <View className="-mt-12 bg-white rounded-t-[40px] pt-6 pb-10">
                    <View className="px-5">
                        {/* Title */}
                        <Text className="text-2xl font-bold text-gray-900">
                            {product?.name}
                        </Text>

                        {/* Rating / Reviews */}
                        {/* <View className="flex-row items-center mt-2">
                            <Ionicons name="star" size={16} color="#FACC15" />
                            <Text className="ml-1 text-gray-700 font-medium">
                                4.5
                            </Text>
                            <Text className="ml-2 text-gray-500 text-sm">
                                (120 reviews)
                            </Text>
                        </View> */}
                        {/* Price */}
                        <View className="flex-row items-center mt-4">
                            <Text className="text-2xl font-extrabold text-primary">
                                ₹{product?.selling_price}
                            </Text>
                            <Text className="ml-3 text-gray-400 line-through">
                                ₹{product?.actual_price}
                            </Text>
                            <View className="ml-3 bg-green-100 px-2 py-1 rounded-full">
                                <Text className="text-green-700 text-xs font-semibold">
                                    {Math.floor(product?.discount)}% OFF
                                </Text>
                            </View>
                        </View>

                        {/* Description */}
                        <Text className="mt-4 text-gray-600 leading-6">
                            {product?.description}
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/*CART BUTTON */}
            {product && <Cartbutton product={product} />}
        </SafeView>
    );
}