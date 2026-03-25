import api from "@/utils/client";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Animated, Pressable, Text, TextInput, View } from "react-native";

export interface AppliedPromo {
    code: string;
    discount_type: "percentage" | "fixed";
    discount_value: number;
    max_discount_amount?: number;
}

interface PromoCodeSectionProps {
    promo: string;
    setPromo: (text: string) => void;
    appliedPromo: AppliedPromo | null;
    setAppliedPromo: (p: AppliedPromo | null) => void;
    setDiscount: (v: number) => void;
    orderAmount: number;
    cartVersion: number; // For auto-remove when cart changes
}

export default function PromoCodeSection({
    promo,
    setPromo,
    appliedPromo,
    setAppliedPromo,
    setDiscount,
    orderAmount,
    cartVersion,
}: PromoCodeSectionProps) {
    const [loading, setLoading] = useState(false);
    const [fadeAnim] = useState(new Animated.Value(0));
    const [discountAmount, setDiscountAmount] = useState(0);
    const isDisabled = promo.trim().length === 0 || loading || appliedPromo !== null;

    // Auto-remove promo if cart changes
    useEffect(() => {
        if (appliedPromo) {
            handleRemovePromo();
        }
    }, [cartVersion]);

    const handleApplyPromo = async () => {
        if (!promo.trim()) return;

        try {
            setLoading(true);
            const res = await api.post("/promocodes/validate", {
                code: promo,
                order_amount: orderAmount,
            });

            if (!res.data.valid) {
                alert("Promo code not applicable");
                return;
            }

            const promoData: AppliedPromo = res.data.promocode;

            // Compute discount immediately
            let computedDiscount =
                promoData.discount_type === "percentage"
                    ? (orderAmount * promoData.discount_value) / 100
                    : promoData.discount_value;

            // Apply max discount cap if set
            if (promoData.max_discount_amount) {
                computedDiscount = Math.min(computedDiscount, promoData.max_discount_amount);
            }

            // Round to 2 decimal places to avoid floating-point artifacts
            computedDiscount = Math.round(computedDiscount * 100) / 100;

            // Set both local and parent state
            setDiscountAmount(computedDiscount);
            setDiscount(computedDiscount);
            setAppliedPromo(promoData);

            // Animate applied promo
            fadeAnim.setValue(0);
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }).start();

        } catch (e) {
            alert("Failed to apply promo");
        } finally {
            setLoading(false);
        }
    };

    const handleRemovePromo = () => {
        setAppliedPromo(null);
        setPromo("");
        setDiscount(0);
    };

    return (
        <View className="p-2 mt-4">
            <View className="flex-row items-center mb-3">
                <Ionicons name="pricetag-outline" size={22} color="#2563EB" />
                <Text className="font-bold text-lg ml-2">Promo Code</Text>
            </View>

            {appliedPromo ? (
                <Animated.View
                    style={{ opacity: fadeAnim }}
                    className="flex-row justify-between items-center bg-green-50 p-3 rounded-xl"
                >
                    <View className="flex-row items-center">
                        <Ionicons name="checkmark-circle" size={22} color="#16A34A" />
                        <View className="ml-2">
                            <Text className="font-bold text-green-700">{appliedPromo.code}</Text>
                            <Text className="text-green-600 text-sm">
                                You saved ₹{discountAmount}
                            </Text>
                        </View>
                    </View>

                    <Pressable onPress={handleRemovePromo}>
                        <Ionicons name="close-circle" size={22} color="#EF4444" />
                    </Pressable>
                </Animated.View>
            ) : (
                <View className="flex-row items-center border border-gray-200 rounded-xl overflow-hidden">
                    <TextInput
                        value={promo}
                        onChangeText={setPromo}
                        placeholder="Enter promo code"
                        autoCapitalize="characters"
                        className="flex-1 px-4 py-3 text-base"
                    />

                    <Pressable
                        disabled={isDisabled}
                        onPress={handleApplyPromo}
                        className={`px-6 py-3 ${isDisabled ? "bg-gray-200" : "bg-primary"}`}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text className={`font-bold ${isDisabled ? "text-gray-400" : "text-white"}`}>
                                Apply
                            </Text>
                        )}
                    </Pressable>
                </View>
            )}
        </View>
    );
}
