import { setMapPickerResult } from "@/slices/mapPickerSlice";
import { useAppDispatch } from "@/store/hooks";
import { debouncedReverseGeocode, GeocodedAddress } from "@/utils/geocoding";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView, WebViewMessageEvent } from "react-native-webview";

const OLA_MAPS_API_KEY = process.env.EXPO_PUBLIC_OLA_MAPS_API_KEY;

const DEFAULT_CENTER = { lng: 77.209, lat: 28.6139 };
const DEFAULT_ZOOM = 15;

function getMapHTML(lat: number, lng: number, zoom: number) {
    return `
<!DOCTYPE html>
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
    zoom: ${zoom},
    attributionControl: false,
    transformRequest: (url, resourceType) => {
        if (url.includes("api.olamaps.io") && !url.includes("api_key=")) {
            const sep = url.includes("?") ? "&" : "?";
            return { url: url + sep + "api_key=" + API_KEY };
        }
        return { url };
    }
});

map.on("moveend", () => {
    const center = map.getCenter();
    window.ReactNativeWebView.postMessage(JSON.stringify({
        type: "regionChange",
        lat: center.lat,
        lng: center.lng,
    }));
});

// Expose flyTo for React Native to call
window.flyToLocation = (lat, lng) => {
    map.flyTo({ center: [lng, lat], zoom: ${zoom}, duration: 800 });
};
</script>
</body>
</html>`;
}

export default function MapPickerScreen() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams<{
        initialLat?: string;
        initialLng?: string;
    }>();
    const webViewRef = useRef<WebView>(null);

    const initialCenter = {
        lat: params.initialLat ? parseFloat(params.initialLat) : DEFAULT_CENTER.lat,
        lng: params.initialLng ? parseFloat(params.initialLng) : DEFAULT_CENTER.lng,
    };

    const [center, setCenter] = useState(initialCenter);
    const [geocodedAddress, setGeocodedAddress] = useState<GeocodedAddress | null>(null);
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [locationLoading, setLocationLoading] = useState(!params.initialLat);
    const [mapReady, setMapReady] = useState(false);

    useEffect(() => {
        if (params.initialLat && params.initialLng) {
            handleRegionChange(parseFloat(params.initialLat), parseFloat(params.initialLng));
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
                // Still geocode the default center
                handleRegionChange(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng);
                return;
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            const lat = location.coords.latitude;
            const lng = location.coords.longitude;
            setCenter({ lat, lng });

            // Fly map to GPS location once WebView is ready
            if (mapReady) {
                webViewRef.current?.injectJavaScript(`window.flyToLocation(${lat}, ${lng}); true;`);
            }
            handleRegionChange(lat, lng);
        } catch (error) {
            if (__DEV__) console.error("Error getting location:", error);
        } finally {
            setLocationLoading(false);
        }
    };

    // Once map is ready and we got GPS location before map loaded, fly there
    useEffect(() => {
        if (mapReady && !params.initialLat && center.lat !== DEFAULT_CENTER.lat) {
            webViewRef.current?.injectJavaScript(`window.flyToLocation(${center.lat}, ${center.lng}); true;`);
        }
    }, [mapReady]);

    const handleRegionChange = useCallback((lat: number, lng: number) => {
        setIsGeocoding(true);
        debouncedReverseGeocode(lat, lng, (result) => {
            setGeocodedAddress(result);
            setIsGeocoding(false);
        });
    }, []);

    const onWebViewMessage = (event: WebViewMessageEvent) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === "regionChange") {
                setCenter({ lat: data.lat, lng: data.lng });
                handleRegionChange(data.lat, data.lng);
            }
        } catch (e) {
            // ignore parse errors
        }
    };

    const handleConfirm = () => {
        dispatch(
            setMapPickerResult({
                latitude: center.lat,
                longitude: center.lng,
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

            const lat = location.coords.latitude;
            const lng = location.coords.longitude;
            webViewRef.current?.injectJavaScript(`window.flyToLocation(${lat}, ${lng}); true;`);
        } catch (error) {
            if (__DEV__) console.error("Error getting location:", error);
        }
    };

    return (
        <View className="flex-1 bg-white">
            {/* Map WebView */}
            <WebView
                ref={webViewRef}
                source={{ html: getMapHTML(initialCenter.lat, initialCenter.lng, DEFAULT_ZOOM) }}
                style={{ flex: 1 }}
                onMessage={onWebViewMessage}
                onLoadEnd={() => setMapReady(true)}
                javaScriptEnabled
                domStorageEnabled
                scrollEnabled={false}
                bounces={false}
                overScrollMode="never"
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
            />

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
