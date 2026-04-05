import FormCard from "@/components/FormCard";
import SafeView from "@/components/SafeView";
import TitleBar from "@/components/TitleBar";
import fetchCategories from "@/utils/categories";
import api from "@/utils/client";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, FlatList, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";

type Category = {
    name: string;
    image?: string;
    id: string;
};

export default function RequestProductScreen() {
    const [name, setName] = useState("");
    const [brand, setBrand] = useState("");
    const [category, setCategory] = useState("");
    const [description, setDescription] = useState("");
    const [categories, setCategories] = useState<Category[]>([]);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [customCategory, setCustomCategory] = useState("");

    useEffect(() => {
        let cancelled = false;
        const loadCategories = async () => {
            try {
                const data = await fetchCategories();
                if (!cancelled) {
                    setCategories(data);
                }
            } catch (err) {
                if (!cancelled) {
                    if (__DEV__) console.log("Failed to load categories:", err);
                }
            }
        };
        loadCategories();

        return () => {
            cancelled = true;
        };
    }, []);

    const handleCategorySelect = (selectedCategory: string) => {
        if (selectedCategory !== "Other") {
            setCustomCategory("");
        }
        setCategory(selectedCategory);
        setShowCategoryModal(false);
    };

    const handleSubmitRequest = async () => {
        const finalCategory = category === "Other" ? customCategory : category;

        if (!name || !finalCategory || !description) {
            Alert.alert("Error", "Please fill in all required fields");
            return;
        }

        try {
            const res = await api.post(
                "/support/product-requests",
                {
                    product_name: name,
                    brand: brand,
                    category: finalCategory,
                    description: description
                }
            );

            if (res.status === 200) {
                router.push("/")
                // Alert.alert("Success", "Request submitted successfully",
                //     [
                //         {
                //             text: "OK",
                //             onPress: () => {
                //                 setName("");
                //                 setBrand("");
                //                 setCategory("");
                //                 setCustomCategory("");
                //                 setDescription("");
                //                 router.back();
                //             }
                //         }
                //     ]
                // );
            }
        } catch (error) {
            Alert.alert("Error", "Failed to submit request. Please try again.");
            if (__DEV__) console.error("Product request error:", error);
        }
    };

    return (
        <SafeView className="flex-1 bg-gray-50">
            <TitleBar
                title="Request Product"
                subtitle=""
            />
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
            >
                <View className="px-4 mt-6">
                    <View className="bg-blue-50 p-4 rounded-2xl flex-row items-start border border-blue-100">
                        <Ionicons name="information-circle" size={24} color="#3b82f6" />
                        <View className="flex-1 ml-3">
                            <Text className="text-blue-900 font-semibold mb-1">
                                Didn't find the product you want?
                            </Text>
                            <Text className="text-blue-800/80 text-sm leading-5 text-gray-700">
                                Let us know the details of the product you're looking for, and we'll do our best to make it available.
                            </Text>
                        </View>
                    </View>
                </View>

                {/* FORM */}
                <View className="px-4 mt-8 space-y-6">
                    {/* Product Name */}
                    <FormCard title="Product Name *">
                        <TextInput
                            placeholder="Enter product name"
                            placeholderTextColor="#9CA3AF"
                            className="border border-gray-200 rounded-xl px-4 py-3 text-gray-800 bg-white"
                            value={name}
                            onChangeText={setName}
                        />
                    </FormCard>

                    {/* Brand */}
                    <FormCard title="Brand (Optional)">
                        <TextInput
                            placeholder="Enter brand"
                            placeholderTextColor="#9CA3AF"
                            className="border border-gray-200 rounded-xl px-4 py-3 text-gray-800 bg-white"
                            value={brand}
                            onChangeText={setBrand}
                        />
                    </FormCard>

                    {/* Category Dropdown */}
                    <FormCard title="Category *">
                        <Pressable
                            onPress={() => setShowCategoryModal(true)}
                            className="border border-gray-200 rounded-xl px-4 py-3 bg-white flex-row items-center justify-between"
                        >
                            <Text className={category ? "text-gray-800" : "text-gray-400"}>
                                {category || "Select category"}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                        </Pressable>

                        {/* Custom Category Input (shows when "Other" is selected) */}
                        {category === "Other" && (
                            <TextInput
                                placeholder="Enter custom category"
                                placeholderTextColor="#9CA3AF"
                                className="border border-gray-200 rounded-xl px-4 py-3 text-gray-800 bg-white mt-3"
                                value={customCategory}
                                onChangeText={setCustomCategory}
                            />
                        )}
                    </FormCard>

                    {/* Description */}
                    <FormCard title="Description *">
                        <TextInput
                            placeholder="Describe the product in detail..."
                            placeholderTextColor="#9CA3AF"
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            className="border border-gray-200 rounded-xl px-4 py-3 h-28 text-gray-800 bg-white"
                            value={description}
                            onChangeText={setDescription}
                        />
                    </FormCard>
                </View>
            </ScrollView>

            {/* SUBMIT BUTTON */}
            <View className="absolute bottom-0 w-full px-4 pb-6 bg-white border-t border-gray-200">
                <Pressable
                    onPress={handleSubmitRequest}
                    className="bg-primary py-4 rounded-2xl items-center"
                >
                    <Text className="text-white font-bold text-lg">
                        Submit Request
                    </Text>
                </Pressable>
            </View>

            {/* Category Selection Modal */}
            <Modal
                visible={showCategoryModal}
                animationType="slide"
                transparent
            >
                <View style={{ flex: 1, justifyContent: 'flex-end' }} className="bg-black/40">
                    <Pressable
                        style={{ flex: 1 }}
                        onPress={() => setShowCategoryModal(false)}
                    />

                    <View className="bg-white rounded-t-3xl" style={{ maxHeight: '70%' }}>
                        {/* Handle Bar */}
                        <View className="items-center pt-3 pb-2">
                            <View className="w-12 h-1 bg-gray-300 rounded-full" />
                        </View>

                        {/* Header */}
                        <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
                            <Text className="text-xl font-bold text-gray-900">
                                Select Category
                            </Text>
                            <Pressable
                                onPress={() => setShowCategoryModal(false)}
                                className="w-9 h-9 items-center justify-center rounded-full bg-gray-100"
                            >
                                <Ionicons name="close" size={20} color="#6B7280" />
                            </Pressable>
                        </View>

                        {/* Categories List */}
                        <FlatList
                            data={[...categories, { name: "Other", id: "other" }]}
                            keyExtractor={(item) => item.id || item.name}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 0 }} // ✅ Changed from 20 to 0
                            renderItem={({ item }) => (
                                <Pressable
                                    onPress={() => handleCategorySelect(item.name)}
                                    className={`px-5 py-4 border-b border-gray-100 flex-row items-center justify-between ${category === item.name ? "bg-blue-50" : ""
                                        }`}
                                >
                                    <Text className={`text-base ${category === item.name ? "font-semibold text-primary" : "text-gray-700"
                                        }`}>
                                        {item.name}
                                    </Text>
                                    {category === item.name && (
                                        <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                                    )}
                                </Pressable>
                            )}
                            ListEmptyComponent={
                                <View className="py-10 items-center">
                                    <Text className="text-gray-400">No categories available</Text>
                                </View>
                            }
                        />
                    </View>
                </View>
            </Modal>
        </SafeView>
    );
}