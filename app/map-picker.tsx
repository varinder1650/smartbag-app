import { setMapPickerResult } from "@/slices/mapPickerSlice";
import { useAppDispatch } from "@/store/hooks";
import { debouncedReverseGeocode, GeocodedAddress } from "@/utils/geocoding";
import { Ionicons } from "@expo/vector-icons";
import MapLibreGL from "@maplibre/maplibre-react-native";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
    Pressable,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const OLA_MAPS_API_KEY = process.env.EXPO_PUBLIC_OLA_MAPS_API_KEY;
const OLA_STYLE_URL = `https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json`;

// Default center (New Delhi) used when location permission is denied
const DEFAULT_CENTER: [number, number] = [77.209, 28.6139];
const DEFAULT_ZOOM = 15;

export default function MapPickerScreen() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams<{
        initialLat?: string;
        initialLng?: string;
    }>();

    const cameraRef = useRef<MapLibreGL.CameraRef>(null);

    const [center, setCenter] = useState<[number, number]>(() => {
        if (params.initialLat && params.initialLng) {
            return [parseFloat(params.initialLng), parseFloat(params.initialLat)];
        }
        return DEFAULT_CENTER;
    });
    const [geocodedAddress, setGeocodedAddress] = useState<GeocodedAddress | null>(null);
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [locationLoading, setLocationLoading] = useState(!params.initialLat);

    useEffect(() => {
        if (params.initialLat && params.initialLng) {
            // Already have initial coordinates, just geocode them
            handleRegionChange(parseFloat(params.initialLng), parseFloat(params.initialLat));
            return;
        }
        requestLocationAndCenter();
    }, []);

    const requestLocationAndCenter = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                Alert.alert(
                    "Location Permission",
                    "Location permission is needed to center the map on your current position. You can still pick a location manually.",
                    [{ text: "OK" }]
                );
                setLocationLoading(false);
                return;
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            const newCenter: [number, number] = [location.coords.longitude, location.coords.latitude];
            setCenter(newCenter);
            cameraRef.current?.setCamera({
                centerCoordinate: newCenter,
                zoomLevel: DEFAULT_ZOOM,
                animationDuration: 500,
            });
            handleRegionChange(newCenter[0], newCenter[1]);
        } catch (error) {
            if (__DEV__) console.error("Error getting location:", error);
        } finally {
            setLocationLoading(false);
        }
    };

    const handleRegionChange = useCallback((lng: number, lat: number) => {
        setIsGeocoding(true);
        debouncedReverseGeocode(lat, lng, (result) => {
            setGeocodedAddress(result);
            setIsGeocoding(false);
        });
    }, []);

    const handleConfirm = () => {
        dispatch(
            setMapPickerResult({
                latitude: center[1],
                longitude: center[0],
                geocodedAddress,
            })
        );
        router.back();
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

            const newCenter: [number, number] = [location.coords.longitude, location.coords.latitude];
            cameraRef.current?.setCamera({
                centerCoordinate: newCenter,
                zoomLevel: DEFAULT_ZOOM,
                animationDuration: 800,
            });
        } catch (error) {
            if (__DEV__) console.error("Error getting location:", error);
        }
    };

    const transformRequest: MapLibreGL.RequestTransformer = (url) => {
        if (url.includes("api.olamaps.io")) {
            const separator = url.includes("?") ? "&" : "?";
            return { url: `${url}${separator}api_key=${OLA_MAPS_API_KEY}` };
        }
        return { url };
    };

    return (
        <View className="flex-1 bg-white">
            {/* Map */}
            <MapLibreGL.MapView
                style={{ flex: 1 }}
                styleURL={OLA_STYLE_URL}
                mapViewTransformRequest={transformRequest}
                onRegionDidChange={(feature) => {
                    const coords = (feature as any).geometry?.coordinates ||
                        (feature as any).properties?.center;
                    if (coords) {
                        setCenter([coords[0], coords[1]]);
                        handleRegionChange(coords[0], coords[1]);
                    }
                }}
                attributionEnabled={false}
                logoEnabled={false}
            >
                <MapLibreGL.Camera
                    ref={cameraRef}
                    defaultSettings={{
                        centerCoordinate: center,
                        zoomLevel: DEFAULT_ZOOM,
                    }}
                />
            </MapLibreGL.MapView>

            {/* Fixed Center Pin */}
            <View
                className="absolute items-center justify-center"
                style={{
                    top: "50%",
                    left: "50%",
                    marginLeft: -20,
                    marginTop: -40,
                }}
                pointerEvents="none"
            >
                <Ionicons name="location" size={40} color="#007AFF" />
            </View>

            {/* Back Button */}
            <Pressable
                onPress={() => router.back()}
                className="absolute bg-white rounded-full w-10 h-10 items-center justify-center shadow-md"
                style={{ top: insets.top + 10, left: 16 }}
            >
                <Ionicons name="arrow-back" size={22} color="#111827" />
            </Pressable>

            {/* My Location Button */}
            <Pressable
                onPress={goToMyLocation}
                className="absolute bg-white rounded-full w-10 h-10 items-center justify-center shadow-md"
                style={{ top: insets.top + 10, right: 16 }}
            >
                <Ionicons name="locate" size={22} color="#007AFF" />
            </Pressable>

            {/* Bottom Card */}
            <View
                className="absolute left-0 right-0 bg-white rounded-t-3xl shadow-lg"
                style={{
                    bottom: 0,
                    paddingBottom: insets.bottom || 20,
                }}
            >
                <View className="px-5 pt-5 pb-4">
                    {/* Address Display */}
                    <View className="flex-row items-start mb-4">
                        <Ionicons name="location" size={22} color="#007AFF" style={{ marginTop: 2 }} />
                        <View className="flex-1 ml-3">
                            {locationLoading || isGeocoding ? (
                                <View className="flex-row items-center">
                                    <ActivityIndicator size="small" color="#007AFF" />
                                    <Text className="text-sm text-gray-500 ml-2">
                                        Finding address...
                                    </Text>
                                </View>
                            ) : geocodedAddress ? (
                                <>
                                    <Text className="text-base font-semibold text-gray-900" numberOfLines={1}>
                                        {geocodedAddress.city || "Selected Location"}
                                    </Text>
                                    <Text className="text-sm text-gray-500 mt-0.5" numberOfLines={2}>
                                        {geocodedAddress.formattedAddress || geocodedAddress.street}
                                    </Text>
                                </>
                            ) : (
                                <Text className="text-sm text-gray-500">
                                    Move the map to select an address
                                </Text>
                            )}
                        </View>
                    </View>

                    {/* Confirm Button */}
                    <Pressable
                        onPress={handleConfirm}
                        className="bg-primary py-4 rounded-xl items-center"
                    >
                        <Text className="text-white font-bold text-base">
                            Confirm Location
                        </Text>
                    </Pressable>
                </View>
            </View>
        </View>
    );
}
