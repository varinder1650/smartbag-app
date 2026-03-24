import { Address } from "@/types/address.types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type CheckoutAddressState = {
    selectedAddress: Address | null;
};

const initialState: CheckoutAddressState = {
    selectedAddress: null,
};

const checkoutAddressSlice = createSlice({
    name: "checkoutAddress",
    initialState,
    reducers: {
        setCheckoutAddress(state, action: PayloadAction<Address>) {
            state.selectedAddress = action.payload;
        },
        clearCheckoutAddress(state) {
            state.selectedAddress = null;
        },
    },
});

export const { setCheckoutAddress, clearCheckoutAddress } = checkoutAddressSlice.actions;

export default checkoutAddressSlice.reducer;
