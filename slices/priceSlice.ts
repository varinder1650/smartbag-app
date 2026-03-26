import api from "@/utils/client";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

export type DeliveryFee = {
    type: string;
    base_fee: number;
    per_km_rate: number;
    min_fee: number;
    max_fee: number;
    free_delivery_threshold: number;
};

export type AppFee = {
    type: string;
    value: number;
    // min_fee: number;
    // max_fee: number;
};

export type DocFee = {
    A4_black: number;
    A4_color: number;
    A3_black: number;
    A3_color: number;
    legal_black: number;
    legal_color: number;
};

export type PhotoFee = {
    passport: number;
    other: number;
};
export type PrintoutFee = {
    doc: DocFee;
    photo: PhotoFee;
};

type PriceResponse = {
    deliveryFee: DeliveryFee;
    appFee: AppFee;
    porterFee: number;
    printoutFee: PrintoutFee;
};

export const fetchPrices = createAsyncThunk<PriceResponse>(
    "pricing/get",
    async () => {
        const prices = await api.get("/settings/public")
        return {
            deliveryFee: prices.data.delivery_fee,
            appFee: prices.data.appFee,
            porterFee: prices.data.porterFee,
            printoutFee: prices.data.printoutFee,
        };
    }
)

const priceSlice = createSlice({
    name: "price",
    initialState: {
        deliveryFee: {
            type: "",
            base_fee: 0,
            per_km_rate: 0,
            min_fee: 0,
            max_fee: 0,
            free_delivery_threshold: 0,
        } as DeliveryFee,
        appFee: {
            type: "",
            value: 0,
            // min_fee: 0,
            // max_fee: 0,
        },
        porterFee: 0,
        printoutFee: {
            doc: {
                A4_black: 0,
                A4_color: 0,
                A3_black: 0,
                A3_color: 0,
                legal_black: 0,
                legal_color: 0,
            },
            photo: {
                passport: 0,
                other: 0,
            },
        } as PrintoutFee,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(fetchPrices.fulfilled, (state, action) => {
            state.deliveryFee = action.payload.deliveryFee;
            state.appFee = action.payload.appFee;
            state.porterFee = action.payload.porterFee;
            state.printoutFee = action.payload.printoutFee;
        })
    }
})

export default priceSlice.reducer;