import FormCard from "@/components/FormCard";
import DimensionSelector from "@/components/Porter/DimensionSelector";
import PorterFooter from "@/components/Porter/PorterFooter";
import PorterPricingCard from "@/components/Porter/PorterPricingCard";
import WeightSelector from "@/components/Porter/WeightSelector";
import SafeView from "@/components/SafeView";
import TitleBar from "@/components/TitleBar";
import { usePorterForm } from "@/hooks/usePorterForm";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";

export default function PorterScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ editData?: string }>();

    const editDetails = useMemo(() => {
        if (!params.editData) return undefined;
        try { return JSON.parse(params.editData); } catch { return undefined; }
    }, [params.editData]);

    const {
        pickupAddress,
        deliveryAddress,
        distance, setDistance,
        weight, setWeight,
        phone, setPhone,
        length, setLength,
        width, setWidth,
        height, setHeight,
        notes, setNotes,
        isUrgent, setIsUrgent,
        calculatedPrice,
        handleAddToCart,
        renderAddress,
    } = usePorterForm(editDetails);

    return (
        <SafeView className="flex-1 bg-white">
            <TitleBar title="Porter Service" subtitle="Fast delivery for your packages" />

            <ScrollView contentContainerStyle={{ paddingBottom: 180 }}>
                <View className="px-3 mt-6 space-y-6">

                    <FormCard title="Pickup Address *">
                        <Pressable
                            onPress={() => router.push({ pathname: "/address", params: { mode: "select", addressType: "pickup" } })}
                            className="border rounded-xl px-4 py-3"
                        >
                            <Text>{renderAddress(pickupAddress)}</Text>
                        </Pressable>
                    </FormCard>

                    <FormCard title="Delivery Address *">
                        <Pressable
                            onPress={() => router.push({ pathname: "/address", params: { mode: "select", addressType: "delivery" } })}
                            className="border rounded-xl px-4 py-3"
                        >
                            <Text>{renderAddress(deliveryAddress)}</Text>
                        </Pressable>
                    </FormCard>

                    <FormCard title="Estimated Distance (km) *">
                        <TextInput
                            value={distance}
                            onChangeText={setDistance}
                            onBlur={() => {
                                const d = parseFloat(distance);
                                if (!isNaN(d) && d < 1) {
                                    setDistance("1");
                                }
                            }}
                            keyboardType="numeric"
                            placeholder="Min 1 km"
                            className="border rounded-xl px-4 py-3"
                        />
                    </FormCard>

                    <FormCard title="Package Dimensions (cm) *">
                        <DimensionSelector label="Length" selected={length} onSelect={setLength} />
                        <DimensionSelector label="Width" selected={width} onSelect={setWidth} />
                        <DimensionSelector label="Height" selected={height} onSelect={setHeight} />
                    </FormCard>

                    <FormCard title="Weight (kg) *">
                        <WeightSelector selected={weight} onSelect={setWeight} label="" />
                    </FormCard>

                    <FormCard title="Phone Number *">
                        <TextInput
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                            placeholder="Enter contact number"
                            className="border rounded-xl px-4 py-3"
                        />
                    </FormCard>

                    <FormCard title="Delivery Priority">
                        <View className="flex-row items-center justify-between border rounded-xl px-4 py-3 bg-gray-50">
                            <View className="flex-1 mr-4">
                                <View className="flex-row items-center mb-1">
                                    <Ionicons name="flash" size={20} color={isUrgent ? "#FF6B00" : "#666"} />
                                    <Text className="text-base font-semibold ml-2">Urgent Delivery</Text>
                                </View>
                                <Text className="text-sm text-gray-600">
                                    Priority delivery within 15 mins (+20 surcharge)
                                </Text>
                            </View>
                            <Switch
                                value={isUrgent}
                                onValueChange={setIsUrgent}
                                trackColor={{ false: "#D1D5DB", true: "#FED7AA" }}
                                thumbColor={isUrgent ? "#FF6B00" : "#f4f3f4"}
                                ios_backgroundColor="#D1D5DB"
                            />
                        </View>
                    </FormCard>

                    <FormCard title="Additional Notes">
                        <TextInput
                            value={notes}
                            onChangeText={setNotes}
                            multiline
                            placeholder="Any special instructions..."
                            className="border rounded-xl px-4 py-3 h-28"
                            textAlignVertical="top"
                        />
                    </FormCard>

                    <PorterPricingCard price={calculatedPrice} isUrgent={isUrgent} />
                </View>
            </ScrollView>

            <PorterFooter price={calculatedPrice} isUrgent={isUrgent} onAddToCart={handleAddToCart} isEditMode={!!editDetails} />
        </SafeView>
    );
}
