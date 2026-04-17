
import Cartbutton from "@/components/CartButton";
import MockupPreview from "@/components/MockupPreview";
import SafeView from "@/components/SafeView";
import { Product } from "@/types/products.types";
import { uploadToCloudinary } from "@/utils/fileupload";
import { loadProductDetails } from "@/utils/products";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from "react-native";

export default function ProductsDetails() {
    const navigation = useNavigation();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { id } = useLocalSearchParams<{ id: string }>();
    const [customImageUri, setCustomImageUri] = useState<string | null>(null);
    const [customImageUrl, setCustomImageUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

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

    const pickAndUploadImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
        });

        if (result.canceled || !result.assets?.[0]) return;

        const asset = result.assets[0];
        setCustomImageUri(asset.uri);
        setUploading(true);

        try {
            const url = await uploadToCloudinary(asset.uri, "image/jpeg");
            setCustomImageUrl(url);
        } catch (err) {
            if (__DEV__) console.error("Upload failed:", err);
            setCustomImageUri(null);
            setCustomImageUrl(null);
        } finally {
            setUploading(false);
        }
    };

    const removeCustomImage = () => {
        setCustomImageUri(null);
        setCustomImageUrl(null);
    };

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

                        {/* Custom Image Upload Section */}
                        {product.allow_user_images && product.mockup_template_url && (
                            <View className="mt-6 mb-4">
                                <Text className="text-lg font-bold text-gray-900 mb-3">
                                    Customize Your Product
                                </Text>

                                {customImageUrl && product.printable_area ? (
                                    <View>
                                        <MockupPreview
                                            templateUrl={product.mockup_template_url}
                                            userImageUrl={customImageUrl}
                                            printableArea={product.printable_area}
                                            size={300}
                                        />
                                        <View className="flex-row justify-center mt-4 gap-3">
                                            <Pressable
                                                onPress={pickAndUploadImage}
                                                className="bg-gray-100 px-5 py-3 rounded-xl flex-row items-center"
                                            >
                                                <Ionicons name="swap-horizontal" size={18} color="#111" />
                                                <Text className="ml-2 font-semibold text-gray-900">Change Image</Text>
                                            </Pressable>
                                            <Pressable
                                                onPress={removeCustomImage}
                                                className="bg-red-50 px-5 py-3 rounded-xl flex-row items-center"
                                            >
                                                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                                <Text className="ml-2 font-semibold text-red-500">Remove</Text>
                                            </Pressable>
                                        </View>
                                    </View>
                                ) : (
                                    <View>
                                        {uploading ? (
                                            <View className="items-center py-8">
                                                <ActivityIndicator size="large" color="#007AFF" />
                                                <Text className="mt-3 text-gray-500">Uploading your image...</Text>
                                            </View>
                                        ) : (
                                            <Pressable
                                                onPress={pickAndUploadImage}
                                                className="border-2 border-dashed border-gray-300 rounded-2xl py-10 items-center"
                                            >
                                                <Ionicons name="cloud-upload-outline" size={40} color="#9CA3AF" />
                                                <Text className="mt-3 text-gray-600 font-semibold">Upload Your Image</Text>
                                                <Text className="mt-1 text-gray-400 text-sm">Tap to select from gallery</Text>
                                            </Pressable>
                                        )}
                                    </View>
                                )}

                                {product.allow_user_images && !customImageUrl && !uploading && (
                                    <Text className="text-orange-500 text-sm mt-2 text-center">
                                        Please upload your image to add this product to cart
                                    </Text>
                                )}
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>

            {/*CART BUTTON */}
            {product && (
                <Cartbutton
                    product={product}
                    customImageUrl={customImageUrl}
                    requiresCustomImage={product.allow_user_images && !!product.mockup_template_url}
                />
            )}
        </SafeView>
    );
}