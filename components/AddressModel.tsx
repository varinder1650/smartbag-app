import { saveAddress } from "@/slices/addressSlice";
import { useAppDispatch } from "@/store/hooks";
import { AddressEdit } from "@/types/address.types";
import api from "@/utils/client";
import { debouncedReverseGeocode, GeocodedAddress } from "@/utils/geocoding";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
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
import { WebView } from "react-native-webview";

const OLA_MAPS_API_KEY = process.env.EXPO_PUBLIC_OLA_MAPS_API_KEY;
const DEFAULT_CENTER = { lat: 28.6139, lng: 77.209 };

interface SearchPrediction {
    place_id: string;
    description: string;
    structured_formatting?: {
        main_text: string;
        secondary_text: string;
    };
}

interface PincodeValidation {
    isValid: boolean;
    isActive: boolean;
    city: string;
    state: string;
    isLoading: boolean;
    error: string | null;
}

function getMapHTML(lat: number, lng: number) {
    return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
<link href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css" rel="stylesheet" />
<style>
  * { margin: 0; padding: 0; }
  body, html, #map { width: 100%; height: 100%; overflow: hidden; }
  .maplibregl-ctrl-bottom-left, .maplibregl-ctrl-bottom-right { display: none !important; }
</style>
</head>
<body>
<div id="map"></div>
<script>
const API_KEY = "${OLA_MAPS_API_KEY}";
const STYLE_URL = "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json?api_key=" + API_KEY;
const map = new maplibregl.Map({
    container: "map",
    style: STYLE_URL,
    center: [${lng}, ${lat}],
    zoom: 15,
    attributionControl: false,
    transformRequest: (url, resourceType) => {
        if (url.includes("api.olamaps.io") && !url.includes("api_key=")) {
            const sep = url.includes("?") ? "&" : "?";
            return { url: url + sep + "api_key=" + API_KEY };
        }
        return { url };
    }
});
window.flyToLocation = (lat, lng) => {
    map.flyTo({ center: [lng, lat], zoom: 15, duration: 600 });
};
</script>
</body>
</html>`;
}

const MAP_HTML = getMapHTML(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng);

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

    // Form state
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

    // Map state
    const [mapReady, setMapReady] = useState(false);
    const [geocodedAddress, setGeocodedAddress] = useState<GeocodedAddress | null>(null);
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);

    // Search state
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchPrediction[]>([]);
    const [isSearchingAddress, setIsSearchingAddress] = useState(false);

    // Refs
    const webViewRef = useRef<WebView>(null);
    const pendingFlyTo = useRef<{ lat: number; lng: number } | null>(null);
    const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Form initialization
    useEffect(() => {
        if (initialData) {
            setForm(initialData);
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

    // Map initialization when modal opens
    useEffect(() => {
        if (visible) {
            setMapReady(false);
            setSearchQuery("");
            setSearchResults([]);
            setGeocodedAddress(null);

            if (initialData?.latitude && initialData?.longitude) {
                pendingFlyTo.current = { lat: initialData.latitude, lng: initialData.longitude };
                triggerReverseGeocode(initialData.latitude, initialData.longitude);
            } else {
                requestCurrentLocation();
            }
        }
    }, [visible]);

    // Fly to pending location once map is ready
    useEffect(() => {
        if (mapReady && pendingFlyTo.current) {
            const { lat, lng } = pendingFlyTo.current;
            webViewRef.current?.injectJavaScript(`window.flyToLocation(${lat}, ${lng}); true;`);
            pendingFlyTo.current = null;
        }
    }, [mapReady]);

    const flyToAndGeocode = (lat: number, lng: number) => {
        if (mapReady) {
            webViewRef.current?.injectJavaScript(`window.flyToLocation(${lat}, ${lng}); true;`);
        } else {
            pendingFlyTo.current = { lat, lng };
        }
        triggerReverseGeocode(lat, lng);
    };

    const triggerReverseGeocode = (lat: number, lng: number) => {
        setIsGeocoding(true);
        debouncedReverseGeocode(lat, lng, (result) => {
            setGeocodedAddress(result);
            if (result) {
                setForm(prev => ({
                    ...prev,
                    latitude: lat,
                    longitude: lng,
                    street: result.street || prev.street,
                    city: result.city || prev.city,
                    state: result.state || prev.state,
                    pincode: result.pincode || prev.pincode,
                }));
                if (result.pincode && result.pincode.length === 6) {
                    validatePincode(result.pincode);
                }
            }
            setIsGeocoding(false);
        });
    };

    const requestCurrentLocation = async () => {
        setLocationLoading(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                setLocationLoading(false);
                return;
            }
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });
            const { latitude: lat, longitude: lng } = location.coords;
            flyToAndGeocode(lat, lng);
        } catch (e) {
            if (__DEV__) console.error("Location error:", e);
        } finally {
            setLocationLoading(false);
        }
    };

    const goToMyLocation = async () => {
        try {
            const { status } = await Location.getForegroundPermissionsAsync();
            if (status !== "granted") {
                const result = await Location.requestForegroundPermissionsAsync();
                if (result.status !== "granted") return;
            }
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });
            flyToAndGeocode(location.coords.latitude, location.coords.longitude);
        } catch (e) {
            if (__DEV__) console.error("Location error:", e);
        }
    };

    const handleSearchChange = (text: string) => {
        setSearchQuery(text);
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        if (text.length < 3) {
            setSearchResults([]);
            return;
        }
        searchDebounceRef.current = setTimeout(() => {
            searchAddress(text);
        }, 400);
    };

    const searchAddress = async (query: string) => {
        if (!OLA_MAPS_API_KEY) return;
        setIsSearchingAddress(true);
        try {
            const response = await fetch(
                `https://api.olamaps.io/places/v1/autocomplete?input=${encodeURIComponent(query)}&api_key=${OLA_MAPS_API_KEY}`
            );
            if (!response.ok) return;
            const data = await response.json();
            setSearchResults(data.predictions || []);
        } catch (e) {
            if (__DEV__) console.error("Search error:", e);
        } finally {
            setIsSearchingAddress(false);
        }
    };

    const handleSelectSearchResult = async (prediction: SearchPrediction) => {
        setSearchQuery(prediction.structured_formatting?.main_text || prediction.description);
        setSearchResults([]);
        if (!OLA_MAPS_API_KEY) return;
        try {
            const response = await fetch(
                `https://api.olamaps.io/places/v1/details?place_id=${prediction.place_id}&api_key=${OLA_MAPS_API_KEY}`
            );
            if (!response.ok) return;
            const data = await response.json();
            const loc = data.result?.geometry?.location;
            if (loc?.lat && loc?.lng) {
                flyToAndGeocode(loc.lat, loc.lng);
            }
        } catch (e) {
            if (__DEV__) console.error("Place details error:", e);
        }
    };

    const validatePincode = async (pincode: string) => {
        if (pincode.length !== 6) {
            setPincodeValidation({
                isValid: false,
                isActive: false,
                city: "",
                state: "",
                isLoading: false,
                error: null,
            });
            setForm(prev => ({ ...prev, city: "", state: "" }));
            return;
        }

        setPincodeValidation(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const response = await api.get(`/address/validate-pincode/${pincode}`);
            const result = response.data;

            if (result.status === true && result.data) {
                const { city, state } = result.data;
                setPincodeValidation({
                    isValid: true,
                    isActive: true,
                    city,
                    state,
                    isLoading: false,
                    error: null,
                });
                setForm(prev => ({ ...prev, city, state }));
            } else {
                setPincodeValidation({
                    isValid: false,
                    isActive: false,
                    city: "",
                    state: "",
                    isLoading: false,
                    error: result.message || "Pincode not found",
                });
                setForm(prev => ({ ...prev, city: "", state: "" }));
                Alert.alert(
                    "Service Unavailable",
                    result.message || "We're sorry, but delivery service is not available in your area yet.",
                    [{ text: "OK" }]
                );
            }
        } catch (error) {
            if (__DEV__) console.error("Error validating pincode:", error);
            setPincodeValidation({
                isValid: false,
                isActive: false,
                city: "",
                state: "",
                isLoading: false,
                error: "Failed to validate pincode",
            });
            Alert.alert("Error", "Failed to validate pincode. Please check your internet connection.", [{ text: "OK" }]);
        }
    };

    const handleChange = (key: keyof AddressEdit, value: string) => {
        setForm({ ...form, [key]: value });
        if (key === "pincode" && value.length === 6) {
            validatePincode(value);
        } else if (key === "pincode" && value.length < 6) {
            setPincodeValidation({
                isValid: false,
                isActive: false,
                city: "",
                state: "",
                isLoading: false,
                error: null,
            });
            setForm(prev => ({ ...prev, city: "", state: "" }));
        }
    };

    const handleSave = () => {
        if (!form.label || !form.name || !form.street || !form.city || !form.state || !form.pincode || !form.mobile_number) {
            Alert.alert("Missing Information", "Please fill all the fields");
            return;
        }
        if (!pincodeValidation.isActive) {
            Alert.alert("Service Unavailable", "Cannot save address as delivery service is not available in this area.");
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
            autoComplete: true,
        },
        {
            key: "city",
            placeholder: "City",
            icon: "business-outline",
            keyboard: "default",
            disabled: pincodeValidation.isValid,
        },
        {
            key: "state",
            placeholder: "State",
            icon: "location-outline",
            keyboard: "default",
            disabled: pincodeValidation.isValid,
        },
        { key: "mobile_number", placeholder: "Mobile Number", icon: "call-outline", keyboard: "phone-pad", maxLength: 10 },
    ];

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                style={{ flex: 1 }}
            >
                <View className="flex-1 justify-end">
                    <Pressable
                        className="absolute top-0 bottom-0 left-0 right-0 bg-black/40"
                        onPress={onClose}
                    />

                    <View
                        className="bg-white rounded-t-3xl"
                        style={{ maxHeight: "95%", flexShrink: 1 }}
                    >
                        {/* Handle Bar */}
                        <View className="items-center pt-3 pb-2">
                            <View className="w-12 h-1 bg-gray-300 rounded-full" />
                        </View>

                        {/* Header */}
                        <View className="flex-row items-center justify-between px-5 pb-3">
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
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                            contentContainerStyle={{ paddingBottom: insets.bottom || 20 }}
                        >
                            {/* Map Section */}
                            <View style={{ height: 230, position: "relative", marginBottom: 4 }}>
                                {/* Non-interactive map layer */}
                                <View
                                    pointerEvents="none"
                                    style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
                                >
                                    <WebView
                                        ref={webViewRef}
                                        source={{ html: MAP_HTML }}
                                        style={{ flex: 1 }}
                                        onLoadEnd={() => setMapReady(true)}
                                        javaScriptEnabled
                                        domStorageEnabled
                                        scrollEnabled={false}
                                        bounces={false}
                                        overScrollMode="never"
                                        showsHorizontalScrollIndicator={false}
                                        showsVerticalScrollIndicator={false}
                                    />
                                </View>

                                {/* Center Pin */}
                                <View
                                    pointerEvents="none"
                                    style={{
                                        position: "absolute",
                                        top: "50%",
                                        left: "50%",
                                        marginLeft: -14,
                                        marginTop: -28,
                                    }}
                                >
                                    <Ionicons name="location" size={28} color="#007AFF" />
                                </View>

                                {/* My Location Button */}
                                <Pressable
                                    onPress={goToMyLocation}
                                    style={{
                                        position: "absolute",
                                        bottom: 8,
                                        right: 8,
                                        backgroundColor: "white",
                                        borderRadius: 18,
                                        width: 36,
                                        height: 36,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        shadowColor: "#000",
                                        shadowOffset: { width: 0, height: 1 },
                                        shadowOpacity: 0.15,
                                        shadowRadius: 3,
                                        elevation: 2,
                                    }}
                                >
                                    <Ionicons name="locate" size={18} color="#007AFF" />
                                </Pressable>

                                {/* Search Bar Overlay */}
                                <View style={{ position: "absolute", top: 8, left: 8, right: 8, zIndex: 20 }}>
                                    <View
                                        style={{
                                            backgroundColor: "white",
                                            borderRadius: 10,
                                            flexDirection: "row",
                                            alignItems: "center",
                                            paddingHorizontal: 10,
                                            height: 42,
                                            shadowColor: "#000",
                                            shadowOffset: { width: 0, height: 1 },
                                            shadowOpacity: 0.15,
                                            shadowRadius: 4,
                                            elevation: 4,
                                        }}
                                    >
                                        <Ionicons name="search-outline" size={16} color="#9CA3AF" />
                                        <TextInput
                                            placeholder="Search location..."
                                            placeholderTextColor="#9CA3AF"
                                            value={searchQuery}
                                            onChangeText={handleSearchChange}
                                            returnKeyType="search"
                                            style={{
                                                flex: 1,
                                                marginLeft: 8,
                                                fontSize: 13,
                                                color: "#111827",
                                                paddingVertical: 0,
                                            }}
                                        />
                                        {isSearchingAddress ? (
                                            <ActivityIndicator size="small" color="#007AFF" />
                                        ) : searchQuery.length > 0 ? (
                                            <Pressable
                                                onPress={() => {
                                                    setSearchQuery("");
                                                    setSearchResults([]);
                                                }}
                                            >
                                                <Ionicons name="close-circle" size={16} color="#9CA3AF" />
                                            </Pressable>
                                        ) : null}
                                    </View>

                                    {/* Search Results Dropdown */}
                                    {searchResults.length > 0 && (
                                        <View
                                            style={{
                                                backgroundColor: "white",
                                                borderRadius: 10,
                                                marginTop: 4,
                                                maxHeight: 170,
                                                shadowColor: "#000",
                                                shadowOffset: { width: 0, height: 2 },
                                                shadowOpacity: 0.12,
                                                shadowRadius: 4,
                                                elevation: 4,
                                                overflow: "hidden",
                                            }}
                                        >
                                            <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                                                {searchResults.map((item, index) => (
                                                    <Pressable
                                                        key={item.place_id}
                                                        onPress={() => handleSelectSearchResult(item)}
                                                        style={{
                                                            paddingHorizontal: 12,
                                                            paddingVertical: 10,
                                                            borderBottomWidth: index < searchResults.length - 1 ? 1 : 0,
                                                            borderBottomColor: "#F3F4F6",
                                                            flexDirection: "row",
                                                            alignItems: "center",
                                                        }}
                                                    >
                                                        <Ionicons
                                                            name="location-outline"
                                                            size={14}
                                                            color="#9CA3AF"
                                                            style={{ marginRight: 8 }}
                                                        />
                                                        <View style={{ flex: 1 }}>
                                                            <Text
                                                                style={{ fontSize: 13, fontWeight: "600", color: "#111827" }}
                                                                numberOfLines={1}
                                                            >
                                                                {item.structured_formatting?.main_text || item.description}
                                                            </Text>
                                                            {item.structured_formatting?.secondary_text ? (
                                                                <Text
                                                                    style={{ fontSize: 11, color: "#6B7280", marginTop: 1 }}
                                                                    numberOfLines={1}
                                                                >
                                                                    {item.structured_formatting.secondary_text}
                                                                </Text>
                                                            ) : null}
                                                        </View>
                                                    </Pressable>
                                                ))}
                                            </ScrollView>
                                        </View>
                                    )}
                                </View>

                                {/* Location Loading Overlay */}
                                {locationLoading && (
                                    <View
                                        style={{
                                            position: "absolute",
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            backgroundColor: "rgba(255,255,255,0.75)",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        <ActivityIndicator size="large" color="#007AFF" />
                                        <Text style={{ marginTop: 8, fontSize: 12, color: "#6B7280" }}>
                                            Detecting location...
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {/* Geocoded Address Display */}
                            <View className="px-5 py-2 mb-3 flex-row items-center">
                                <Ionicons
                                    name="location-outline"
                                    size={14}
                                    color={isGeocoding ? "#9CA3AF" : "#007AFF"}
                                />
                                <View className="flex-1 ml-2">
                                    {isGeocoding ? (
                                        <Text className="text-xs text-gray-400">Identifying address...</Text>
                                    ) : geocodedAddress?.formattedAddress ? (
                                        <Text className="text-xs text-gray-600" numberOfLines={2}>
                                            {geocodedAddress.formattedAddress}
                                        </Text>
                                    ) : (
                                        <Text className="text-xs text-gray-400">
                                            Search or use GPS to pick a location
                                        </Text>
                                    )}
                                </View>
                            </View>

                            <View className="px-5">
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
                                                    <Text className={`font-semibold ${isSelected ? "text-white" : "text-gray-700"}`}>
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
                                                    className={`flex-1 py-3.5 px-3 ${disabled ? "text-gray-500" : "text-gray-900"}`}
                                                    style={{ color: disabled ? "#6B7280" : "#111827" }}
                                                />
                                                {key === "pincode" && pincodeValidation.isLoading && (
                                                    <ActivityIndicator size="small" color="#3B82F6" />
                                                )}
                                                {key === "pincode" && pincodeValidation.isActive && !pincodeValidation.isLoading && (
                                                    <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                                                )}
                                                {key === "pincode" && pincodeValidation.error && !pincodeValidation.isLoading && (
                                                    <Ionicons name="close-circle" size={20} color="#EF4444" />
                                                )}
                                            </View>

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
                                    className={`py-4 rounded-xl items-center mt-2 mb-6 shadow-sm ${isSubmitDisabled ? "bg-gray-300" : "bg-primary"}`}
                                >
                                    <Text className={`font-bold text-base ${isSubmitDisabled ? "text-gray-500" : "text-white"}`}>
                                        {pincodeValidation.isLoading ? "Validating..." : "Save Address"}
                                    </Text>
                                </Pressable>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}
