import { GeocodedAddress } from "@/utils/geocoding";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface MapPickerResult {
    latitude: number;
    longitude: number;
    geocodedAddress: GeocodedAddress | null;
}

interface MapPickerState {
    result: MapPickerResult | null;
}

const initialState: MapPickerState = { result: null };

const mapPickerSlice = createSlice({
    name: "mapPicker",
    initialState,
    reducers: {
        setMapPickerResult(state, action: PayloadAction<MapPickerResult>) {
            state.result = action.payload;
        },
        clearMapPickerResult(state) {
            state.result = null;
        },
    },
});

export const { setMapPickerResult, clearMapPickerResult } = mapPickerSlice.actions;
export default mapPickerSlice.reducer;
