export interface GeocodedAddress {
    street: string;
    city: string;
    state: string;
    pincode: string;
    formattedAddress: string;
}

const OLA_MAPS_API_KEY = process.env.EXPO_PUBLIC_OLA_MAPS_API_KEY;

export async function reverseGeocode(
    latitude: number,
    longitude: number
): Promise<GeocodedAddress | null> {
    if (!OLA_MAPS_API_KEY) {
        if (__DEV__) console.warn("OLA_MAPS_API_KEY is not set");
        return null;
    }

    try {
        const response = await fetch(
            `https://api.olamaps.io/places/v1/reverse-geocode?latlng=${latitude},${longitude}&api_key=${OLA_MAPS_API_KEY}`
        );

        if (!response.ok) return null;

        const data = await response.json();

        if (!data.results || data.results.length === 0) return null;

        const result = data.results[0];
        const components = result.address_components || [];

        let street = "";
        let city = "";
        let state = "";
        let pincode = "";

        for (const component of components) {
            const types: string[] = component.types || [];

            if (types.includes("route") || types.includes("sublocality") || types.includes("sublocality_level_1")) {
                street = street ? `${street}, ${component.long_name}` : component.long_name;
            }
            if (types.includes("locality")) {
                city = component.long_name;
            }
            if (types.includes("administrative_area_level_1")) {
                state = component.long_name;
            }
            if (types.includes("postal_code")) {
                pincode = component.long_name;
            }
        }

        // Fallback: use formatted_address for street if no route/sublocality found
        if (!street && result.formatted_address) {
            const parts = result.formatted_address.split(",");
            street = parts.slice(0, 2).join(",").trim();
        }

        return {
            street,
            city,
            state,
            pincode,
            formattedAddress: result.formatted_address || "",
        };
    } catch (error) {
        if (__DEV__) console.error("Reverse geocoding error:", error);
        return null;
    }
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export function debouncedReverseGeocode(
    latitude: number,
    longitude: number,
    callback: (result: GeocodedAddress | null) => void,
    delay = 300
) {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
        const result = await reverseGeocode(latitude, longitude);
        callback(result);
    }, delay);
}
