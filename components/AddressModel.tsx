import { saveAddress } from "@/slices/addressSlice";
import { useAppDispatch } from "@/store/hooks";
import { AddressEdit } from "@/types/address.types";
import api from "@/utils/client";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface PincodeValidation {
    isValid: boolean;
    isActive: boolean;
    city: string;
    state: string;
    isLoading: boolean;
    error: string | null;
}

export default function AddressModal({
    visible,
    onClose,
    initialData,
}: {
    visible: boolean;
    onClose: () => void;
    initialData?: AddressEdit | null;
}) {
    const dispatch = useAppDispatch();
    const insets = useSafeAreaInsets();

    const [form, setForm] = useState<AddressEdit>({
        label: "",
        name: "",
        street: "",
        city: "",
        state: "",
        pincode: "",
        mobile_number: "",
        is_default: false,
    });

    const [pincodeValidation, setPincodeValidation] = useState<PincodeValidation>({
        isValid: false,
        isActive: false,
        city: "",
        state: "",
        isLoading: false,
        error: null,
    });

    useEffect(() => {
        if (initialData) {
            setForm(initialData);
            // If editing an existing address, validate the pincode
            if (initialData.pincode) {
                validatePincode(initialData.pincode);
            }
        } else {
            setForm({
                label: "",
                name: "",
                street: "",
                city: "",
                state: "",
                pincode: "",
                mobile_number: "",
                is_default: false,
            });
            setPincodeValidation({
                isValid: false,
                isActive: false,
                city: "",
                state: "",
                isLoading: false,
                error: null,
            });
        }
    }, [initialData, visible]);

    const validatePincode = async (pincode: string) => {
        // Only validate if pincode is 6 digits
        if (pincode.length !== 6) {
            setPincodeValidation({
                isValid: false,
                isActive: false,
                city: "",
                state: "",
                isLoading: false,
                error: null,
            });
            // Clear city and state if pincode is invalid
            setForm(prev => ({ ...prev, city: "", state: "" }));
            return;
        }

        setPincodeValidation(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            // Replace YOUR_API_URL with your actual backend URL
            const response = await api.get(`/address/validate-pincode/${pincode}`)
            const result = response.data;

            // Check if status is true (service available)
            if (result.status === true && result.data) {
                const { city, state, pincode: validatedPincode } = result.data;

                setPincodeValidation({
                    isValid: true,
                    isActive: true,
                    city,
                    state,
                    isLoading: false,
                    error: null,
                });

                // Auto-fill city and state
                setForm(prev => ({ ...prev, city, state }));
            } else {
                // Service not available (status is false or missing)
                setPincodeValidation({
                    isValid: false,
                    isActive: false,
                    city: "",
                    state: "",
                    isLoading: false,
                    error: result.message || "Pincode not found",
                });

                // Clear city and state
                setForm(prev => ({ ...prev, city: "", state: "" }));

                Alert.alert(
                    "Service Unavailable",
                    result.message || "We're sorry, but delivery service is not available in your area yet. We're working to expand our coverage!",
                    [{ text: "OK" }]
                );
            }
        } catch (error) {
            console.error("Error validating pincode:", error);
            setPincodeValidation({
                isValid: false,
                isActive: false,
                city: "",
                state: "",
                isLoading: false,
                error: "Failed to validate pincode",
            });

            Alert.alert(
                "Error",
                "Failed to validate pincode. Please check your internet connection.",
                [{ text: "OK" }]
            );
        }
    };

    const handleChange = (key: keyof AddressEdit, value: string) => {
        setForm({ ...form, [key]: value });

        // Trigger validation when pincode changes
        if (key === "pincode" && value.length === 6) {
            validatePincode(value);
        } else if (key === "pincode" && value.length < 6) {
            // Reset validation if pincode is incomplete
            setPincodeValidation({
                isValid: false,
                isActive: false,
                city: "",
                state: "",
                isLoading: false,
                error: null,
            });
            // Clear city and state
            setForm(prev => ({ ...prev, city: "", state: "" }));
        }
    };

    const handleSave = () => {
        if (!form.label || !form.name || !form.street || !form.city || !form.state || !form.pincode || !form.mobile_number) {
            Alert.alert("Missing Information", "Please fill all the fields");
            return;
        }

        if (!pincodeValidation.isActive) {
            Alert.alert(
                "Service Unavailable",
                "Cannot save address as delivery service is not available in this area."
            );
            return;
        }

        dispatch(saveAddress(form));
        onClose();
    };

    const isSubmitDisabled =
        !form.label ||
        !form.name ||
        !form.street ||
        !form.city ||
        !form.state ||
        !form.pincode ||
        !form.mobile_number ||
        pincodeValidation.isLoading ||
        !pincodeValidation.isActive;

    const fieldConfigs = [
        { key: "name", placeholder: "Full Name", icon: "person-outline", keyboard: "default" },
        { key: "street", placeholder: "Street Address", icon: "home-outline", keyboard: "default" },
        {
            key: "pincode",
            placeholder: "Pincode",
            icon: "pin-outline",
            keyboard: "numeric",
            maxLength: 6,
            autoComplete: true // Flag to show this field has autocomplete
        },
        {
            key: "city",
            placeholder: "City",
            icon: "business-outline",
            keyboard: "default",
            disabled: pincodeValidation.isValid // Disable if auto-filled
        },
        {
            key: "state",
            placeholder: "State",
            icon: "location-outline",
            keyboard: "default",
            disabled: pincodeValidation.isValid // Disable if auto-filled
        },
        { key: "mobile_number", placeholder: "Mobile Number", icon: "call-outline", keyboard: "phone-pad", maxLength: 10 },
    ];

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
            >
                <Pressable
                    className="flex-1 bg-black/40"
                    onPress={onClose}
                >
                    <View style={{ flex: 1 }} />

                    <Pressable
                        onPress={(e) => e.stopPropagation()}
                        style={{ maxHeight: '90%' }}
                    >
                        <View className="bg-white rounded-t-3xl">
                            {/* Handle Bar */}
                            <View className="items-center pt-3 pb-2">
                                <View className="w-12 h-1 bg-gray-300 rounded-full" />
                            </View>

                            {/* Header */}
                            <View className="flex-row items-center justify-between px-5 pb-4">
                                <Text className="text-xl font-bold text-gray-900">
                                    {form._id ? "Edit Address" : "Add Address"}
                                </Text>
                                <Pressable
                                    onPress={onClose}
                                    className="w-9 h-9 items-center justify-center rounded-full bg-gray-100"
                                >
                                    <Ionicons name="close" size={20} color="#6B7280" />
                                </Pressable>
                            </View>

                            <ScrollView
                                className="px-5"
                                showsVerticalScrollIndicator={false}
                                keyboardShouldPersistTaps="handled"
                                contentContainerStyle={{ paddingBottom: insets.bottom || 20 }}
                            >
                                {/* Label Selection */}
                                <View className="mb-5">
                                    <Text className="text-sm font-semibold text-gray-700 mb-2">
                                        Address Type
                                    </Text>
                                    <View className="flex-row">
                                        {["Home", "Office", "Other"].map((field) => {
                                            const isSelected = form.label === field;
                                            return (
                                                <Pressable
                                                    key={field}
                                                    onPress={() => handleChange("label", field)}
                                                    className={`rounded-xl px-5 py-2.5 items-center mr-2 border ${isSelected
                                                        ? "bg-primary border-primary"
                                                        : "bg-gray-50 border-gray-200"
                                                        }`}
                                                >
                                                    <Text className={`font-semibold ${isSelected ? "text-white" : "text-gray-700"
                                                        }`}>
                                                        {field}
                                                    </Text>
                                                </Pressable>
                                            );
                                        })}
                                    </View>
                                </View>

                                {/* Input Fields */}
                                <View className="space-y-3">
                                    {fieldConfigs.map(({ key, placeholder, icon, keyboard, maxLength, disabled, autoComplete }) => (
                                        <View key={key} className="mb-4">
                                            <Text className="text-sm font-semibold text-gray-700 mb-2">
                                                {placeholder}
                                                {autoComplete && (
                                                    <Text className="text-xs font-normal text-gray-500">
                                                        {" "}(Auto-fills city & state)
                                                    </Text>
                                                )}
                                            </Text>
                                            <View className={`flex-row items-center border rounded-xl px-4 ${disabled
                                                ? "bg-gray-50 border-gray-200"
                                                : pincodeValidation.isActive && key === "pincode"
                                                    ? "bg-green-50 border-green-500"
                                                    : pincodeValidation.error && key === "pincode"
                                                        ? "bg-red-50 border-red-500"
                                                        : "bg-white border-gray-300"
                                                }`}>
                                                <Ionicons
                                                    name={icon as any}
                                                    size={20}
                                                    color={
                                                        pincodeValidation.isActive && key === "pincode"
                                                            ? "#22C55E"
                                                            : pincodeValidation.error && key === "pincode"
                                                                ? "#EF4444"
                                                                : "#9CA3AF"
                                                    }
                                                />
                                                <TextInput
                                                    placeholder={`Enter ${placeholder.toLowerCase()}`}
                                                    placeholderTextColor="#9CA3AF"
                                                    value={(form as any)[key]}
                                                    onChangeText={(v) => handleChange(key as any, v)}
                                                    keyboardType={keyboard as any}
                                                    maxLength={maxLength}
                                                    editable={!disabled}
                                                    className={`flex-1 py-3.5 px-3 ${disabled ? "text-gray-500" : "text-gray-900"
                                                        }`}
                                                    style={{
                                                        color: disabled ? '#6B7280' : '#111827'
                                                    }}
                                                />
                                                {/* Loading indicator for pincode validation */}
                                                {key === "pincode" && pincodeValidation.isLoading && (
                                                    <ActivityIndicator size="small" color="#3B82F6" />
                                                )}
                                                {/* Success checkmark */}
                                                {key === "pincode" && pincodeValidation.isActive && !pincodeValidation.isLoading && (
                                                    <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                                                )}
                                                {/* Error icon */}
                                                {key === "pincode" && pincodeValidation.error && !pincodeValidation.isLoading && (
                                                    <Ionicons name="close-circle" size={20} color="#EF4444" />
                                                )}
                                            </View>

                                            {/* Helper text for pincode */}
                                            {key === "pincode" && pincodeValidation.isActive && !pincodeValidation.isLoading && (
                                                <Text className="text-xs text-green-600 mt-1 ml-1">
                                                    ✓ Delivery available in your area
                                                </Text>
                                            )}
                                            {key === "pincode" && pincodeValidation.error && !pincodeValidation.isLoading && (
                                                <Text className="text-xs text-red-600 mt-1 ml-1">
                                                    ✗ Delivery not available in this area
                                                </Text>
                                            )}

                                            {/* Helper text for disabled fields */}
                                            {disabled && (form as any)[key] && (
                                                <Text className="text-xs text-gray-500 mt-1 ml-1">
                                                    Auto-filled from pincode
                                                </Text>
                                            )}
                                        </View>
                                    ))}
                                </View>

                                {/* Service unavailable warning */}
                                {!pincodeValidation.isActive && form.pincode.length === 6 && !pincodeValidation.isLoading && (
                                    <View className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                                        <View className="flex-row items-center mb-2">
                                            <Ionicons name="alert-circle" size={20} color="#EF4444" />
                                            <Text className="text-sm font-semibold text-red-800 ml-2">
                                                Service Unavailable
                                            </Text>
                                        </View>
                                        <Text className="text-xs text-red-700">
                                            We're sorry, but delivery service is not available in your area yet.
                                            We're working to expand our coverage!
                                        </Text>
                                    </View>
                                )}

                                {/* Save Button */}
                                <Pressable
                                    onPress={handleSave}
                                    disabled={isSubmitDisabled}
                                    className={`py-4 rounded-xl items-center mt-2 mb-6 shadow-sm ${isSubmitDisabled
                                        ? "bg-gray-300"
                                        : "bg-primary"
                                        }`}
                                >
                                    <Text className={`font-bold text-base ${isSubmitDisabled
                                        ? "text-gray-500"
                                        : "text-white"
                                        }`}>
                                        {pincodeValidation.isLoading
                                            ? "Validating..."
                                            : "Save Address"
                                        }
                                    </Text>
                                </Pressable>
                            </ScrollView>
                        </View>
                    </Pressable>
                </Pressable>
            </KeyboardAvoidingView>
        </Modal>
    );
}