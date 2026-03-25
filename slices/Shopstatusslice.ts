import api from "@/utils/client";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ShopStatus {
    is_open: boolean;
    reopen_time: string | null;
    reason: string | null;
}

interface ShopStatusState {
    status: ShopStatus | null;
    loading: boolean;
    error: string | null;
    lastFetched: number | null;
}

const initialState: ShopStatusState = {
    status: null,
    loading: false,
    error: null,
    lastFetched: null,
};

// Async thunk to fetch shop status
export const fetchShopStatus = createAsyncThunk(
    'shopStatus/fetch',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get<ShopStatus>('shop/status');
            return response.data;
        } catch (error: any) {
            if (__DEV__) console.error('Failed to fetch shop status:', error);
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch shop status');
        }
    }
);

const shopStatusSlice = createSlice({
    name: 'shopStatus',
    initialState,
    reducers: {
        clearShopStatus: (state) => {
            state.status = null;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchShopStatus.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchShopStatus.fulfilled, (state, action: PayloadAction<ShopStatus>) => {
                state.loading = false;
                state.status = action.payload;
                state.lastFetched = Date.now();
                state.error = null;
            })
            .addCase(fetchShopStatus.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
                // Default to open on error
                state.status = {
                    is_open: true,
                    reopen_time: null,
                    reason: null,
                };
            });
    },
});

export const { clearShopStatus } = shopStatusSlice.actions;
export default shopStatusSlice.reducer;