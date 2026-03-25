import { AppDispatch } from "@/store/store";
import api from "@/utils/client";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { Address, AddressEdit } from "../types/address.types";

export const fetchAddresses = createAsyncThunk<Address[], void, { rejectValue: string }>(
    "address/fetch",
    async (_, { rejectWithValue }) => {
        try {
            const res = await api.get("/address/my/");
            const payload = res.data;
            if (__DEV__) console.log("[fetchAddresses] raw:", JSON.stringify(payload).slice(0, 200));
            const addresses = Array.isArray(payload)
                ? payload
                : (payload.data || payload.addresses || []);
            return addresses;
        } catch (error: any) {
            const message = error?.response?.data?.detail || error?.response?.data?.message || error.message || "Failed to fetch addresses";
            if (__DEV__) console.error("[fetchAddresses] error:", error?.response?.status, error?.response?.data || error.message);
            return rejectWithValue(message);
        }
    }
);

export const saveAddress = createAsyncThunk<void, AddressEdit, { rejectValue: string }>(
    "address/save",
    async (address: AddressEdit, { dispatch, rejectWithValue }) => {
        try {
            if (address._id) {
                await api.put(`/address/${address._id}`, address);
            } else {
                await api.post(`/address/`, address);
            }
            dispatch(fetchAddresses());
        } catch (error: any) {
            const message = error?.response?.data?.detail || error?.response?.data?.message || error.message || "Failed to save address";
            if (__DEV__) console.error("[saveAddress] error:", error?.response?.status, error?.response?.data || error.message);
            return rejectWithValue(message);
        }
    }
);

export const setDefaultAddress = createAsyncThunk<
    void,
    string,
    { dispatch: AppDispatch }
>(
    "address/setDefault",
    async (addressId, { dispatch, rejectWithValue }) => {
        try {
            await api.post(`/address/${addressId}/set-default`);
            dispatch(fetchAddresses());
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.detail || err.response?.data?.message || "Failed to set default address");
        }
    }
);

export const deleteAddress = createAsyncThunk<string, string>(
    "address/delete",
    async (addressId: string, { dispatch, rejectWithValue }) => {
        try {
            await api.delete(`/address/${addressId}`);
            dispatch(fetchAddresses());
            return addressId;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.detail || err.response?.data?.message || "Failed to delete address");
        }
    }
);

const addressSlice = createSlice({
    name: "address",
    initialState: {
        items: [] as Address[],
        loading: false,
        error: null as string | null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Fetch
            .addCase(fetchAddresses.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAddresses.fulfilled, (state, action) => {
                state.items = action.payload;
                state.loading = false;
                state.error = null;
            })
            .addCase(fetchAddresses.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Failed to fetch addresses";
            })
            // Save
            .addCase(saveAddress.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(saveAddress.fulfilled, (state) => {
                state.loading = false;
                state.error = null;
            })
            .addCase(saveAddress.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Failed to save address";
            })
            .addCase(setDefaultAddress.pending, (state) => {
                state.loading = true;
            })

            .addCase(setDefaultAddress.rejected, (state) => {
                state.loading = false;
            })

            // Delete
            .addCase(deleteAddress.fulfilled, (state, action) => {
                state.items = state.items.filter(
                    (address) => address._id !== action.payload
                );
            })
    }
});

export default addressSlice.reducer;