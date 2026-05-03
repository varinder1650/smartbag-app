// smartbag-app/slices/marketingSlice.ts
import api from "@/utils/client";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface MarketingContainer {
  title: string;
  image_url: string;
  bg_color: string;
  link_type: "category" | "product" | "url" | "none";
  link_value: string;
}

export interface MarketingBanner {
  id: string;
  _id?: string;
  title: string;
  subtitle: string;
  image_url: string;
  bg_color: string;
  is_active: boolean;
  order: number;
  auto_rotate_interval: number;
  containers: MarketingContainer[];
}

interface MarketingState {
  banners: MarketingBanner[];
  loading: boolean;
  error: string | null;
}

const initialState: MarketingState = {
  banners: [],
  loading: false,
  error: null,
};

export const fetchMarketingBanners = createAsyncThunk(
  "marketing/fetchBanners",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<MarketingBanner[]>("/marketing/banners");
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.detail || "Failed to fetch marketing banners"
      );
    }
  }
);

const marketingSlice = createSlice({
  name: "marketing",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMarketingBanners.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchMarketingBanners.fulfilled,
        (state, action: PayloadAction<MarketingBanner[]>) => {
          state.loading = false;
          state.banners = action.payload;
        }
      )
      .addCase(fetchMarketingBanners.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default marketingSlice.reducer;
