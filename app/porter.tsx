import FormCard from "@/components/FormCard";
import DimensionSelector from "@/components/Porter/DimensionSelector";
import WeightSelector from "@/components/Porter/WeightSelector";
import SafeView from "@/components/SafeView";
import TitleBar from "@/components/TitleBar";
import { calculatePorterPrice, PORTER_URGENCY_FEE } from "@/config/servicePricing";
import { useServiceCartActions } from "@/hooks/useServiceCartActions";
import { RootState } from "@/store/store";
import { Address } from "@/types/address.types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";
import { useSelector } from "react-redux";

export default function PorterScreen() {
    const router = useRouter();
    const { addPorterService } = useServiceCartActions();

    const [pickupAddress, setPickupAddress] = useState<Address | null>(null);
    const [deliveryAddress, setDeliveryAddress] = useState<Address | null>(null);

    const [distance, setDistance] = useState("");
    const [weight, setWeight] = useState("");
    const [phone, setPhone] = useState("");
    const [length, setLength] = useState<string | null>(null);
    const [width, setWidth] = useState<string | null>(null);
    const [height, setHeight] = useState<string | null>(null);
    const [notes, setNotes] = useState("");
    const [isUrgent, setIsUrgent] = useState(false); // ✅ New state

    const SelectedpickupAddress = useSelector((state: RootState) => state.addressSelection.pickup);
    const SelecteddeliveryAddress = useSelector((state: RootState) => state.addressSelection.delivery);
    const porterFee = useSelector((state: RootState) => state.price.porterFee);

    useEffect(() => {
        if (SelectedpickupAddress) {
            setPickupAddress(SelectedpickupAddress);
        }

        if (SelecteddeliveryAddress) {
            setDeliveryAddress(SelecteddeliveryAddress);
        }
    }, [SelectedpickupAddress, SelecteddeliveryAddress]);

    const calculatedPrice = useMemo(() => {
        if (!distance || !length || !width || !height) return 0;
        const d = parseFloat(distance);
        if (isNaN(d)) return 0;

        let price = calculatePorterPrice(d, { length, width, height }, porterFee);

        if (isUrgent) {
            price = price + PORTER_URGENCY_FEE;
        }

        return Math.round(price);
    }, [distance, length, width, height, isUrgent, porterFee]);

    const handleAddToCart = () => {
        if (
            !pickupAddress ||
            !deliveryAddress ||
            !distance ||
            !weight ||
            !phone ||
            !length ||
            !width ||
            !height
        ) {
            Alert.alert("Error", "All fields are required");
            return;
        }

        addPorterService(
            {
                pickupAddress,
                deliveryAddress,
                distance: parseFloat(distance),
                weight,
                phone,
                dimensions: { length, width, height },
                notes,
                isUrgent,
            },
            calculatedPrice
        );

        setPickupAddress(null);
        setDeliveryAddress(null);
        setDistance("");
        setWeight("");
        setPhone("");
        setLength(null);
        setWidth(null);
        setHeight(null);
        setNotes("");
        setIsUrgent(false);
        router.push("/cart");
    };

    const renderAddress = (address: Address | null) =>
        address
            ? `${address.street}, ${address.city}, ${address.state} (${address.pincode})`
            : "Select Address";

    return (
        <SafeView className="flex-1 bg-white">
            <TitleBar title="Porter Service" subtitle="Fast delivery for your packages" />

            <ScrollView contentContainerStyle={{ paddingBottom: 180 }}>
                <View className="px-3 mt-6 space-y-6">

                    <FormCard title="Pickup Address *">
                        <Pressable
                            onPress={() =>
                                router.push({
                                    pathname: "/address",
                                    params: { mode: "select", addressType: "pickup" },
                                })
                            }
                            className="border rounded-xl px-4 py-3"
                        >
                            <Text>{renderAddress(pickupAddress)}</Text>
                        </Pressable>
                    </FormCard>

                    <FormCard title="Delivery Address *">
                        <Pressable
                            onPress={() =>
                                router.push({
                                    pathname: "/address",
                                    params: { mode: "select", addressType: "delivery" },
                                })
                            }
                            className="border rounded-xl px-4 py-3"
                        >
                            <Text>{renderAddress(deliveryAddress)}</Text>
                        </Pressable>
                    </FormCard>

                    <FormCard title="Estimated Distance (km) *">
                        <TextInput
                            value={distance}
                            onChangeText={setDistance}
                            keyboardType="numeric"
                            placeholder="Enter distance in km"
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
                                    <Ionicons
                                        name="flash"
                                        size={20}
                                        color={isUrgent ? "#FF6B00" : "#666"}
                                    />
                                    <Text className="text-base font-semibold ml-2">
                                        Urgent Delivery
                                    </Text>
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

                    {calculatedPrice > 0 && (
                        <View className={`p-4 rounded-xl ${isUrgent ? 'bg-orange-50 border border-orange-200' : 'bg-blue-50'}`}>
                            <View className="flex-row items-center justify-between mb-1">
                                <Text className="text-sm text-gray-600">Estimated Price</Text>
                                {isUrgent && (
                                    <View className="flex-row items-center bg-orange-100 px-2 py-1 rounded-full">
                                        <Ionicons name="flash" size={12} color="#FF6B00" />
                                        <Text className="text-xs font-semibold text-orange-600 ml-1">
                                            URGENT
                                        </Text>
                                    </View>
                                )}
                            </View>
                            <Text className={`text-2xl font-bold ${isUrgent ? 'text-orange-600' : 'text-primary'}`}>
                                ₹{calculatedPrice}
                            </Text>
                            {isUrgent && (
                                <Text className="text-xs text-gray-500 mt-1">
                                    Includes 50% priority surcharge
                                </Text>
                            )}
                        </View>
                    )}
                </View>
            </ScrollView>

            <View className="absolute bottom-0 w-full p-4 bg-white border-t">
                <Pressable
                    onPress={handleAddToCart}
                    className={`py-4 rounded-xl items-center ${isUrgent ? 'bg-orange-500' : 'bg-primary'}`}
                >
                    <Text className="text-white font-bold">
                        {isUrgent ? '⚡ Add Urgent Delivery' : 'Add to Cart'} • ₹{calculatedPrice}
                    </Text>
                </Pressable>
            </View>
        </SafeView>
    );
}