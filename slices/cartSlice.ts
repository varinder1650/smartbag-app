import { CartItem } from "@/types/cart.types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Draft } from "immer";
import { mergeGuestCart, syncAddServiceToCart, syncClearCart, syncRemoveItem, syncUpdateQty, syncUserCart } from "./cart.thunks";

export interface CartState {
  user: { items: Record<string, CartItem> };
  guest: { items: Record<string, CartItem> };
  loading: boolean;
}

const initialState: CartState = {
  user: { items: {} },
  guest: { items: {} },
  loading: false,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<{ mode: "guest" | "user"; item: CartItem }>) => {
      const { mode, item } = action.payload;
      // Cast to Draft to work with Immer's proxy types
      const items = state[mode].items as Record<string, Draft<CartItem>>;
      items[item.id] = {
        ...item,
        quantity: item.quantity || 1,
      } as Draft<CartItem>;
    },
    increaseQty: (state, action: PayloadAction<{ mode: "guest" | "user"; id: string }>) => {
      const { mode, id } = action.payload;
      const item = state[mode]?.items[id];
      if (item) {
        item.quantity = (item.quantity || 0) + 1;
      }
    },
    decreaseQty: (state, action: PayloadAction<{ mode: "guest" | "user"; id: string }>) => {
      const { mode, id } = action.payload;
      const item = state[mode]?.items[id];
      if (item) {
        item.quantity = (item.quantity || 1) - 1;
        if (item.quantity <= 0) {
          delete state[mode].items[id];
        }
      }
    },
    // Local clear only (for guest)
    clearCartLocal: (state, action: PayloadAction<"guest" | "user">) => {
      state[action.payload].items = {};
    },
    addServiceToCart: (state, action: PayloadAction<{ mode: "guest" | "user"; item: CartItem }>) => {
      const { mode, item } = action.payload;
      const items = state[mode].items as Record<string, Draft<CartItem>>;
      items[item.id] = {
        ...item,
        quantity: 1
      } as Draft<CartItem>;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(syncUpdateQty.fulfilled, (state, action) => {
        const item = action.payload;
        if (state.user.items[item.id]) {
          state.user.items[item.id].quantity = item.quantity ?? 1;
        }
      })
      .addCase(syncRemoveItem.fulfilled, (state, action) => {
        const itemId = action.payload.itemId;
        delete state.user.items[itemId];
      })
      .addCase(syncUserCart.fulfilled, (state, action) => {
        const newItems: Record<string, Draft<CartItem>> = {};
        action.payload.forEach((item) => {
          newItems[item.id] = item as Draft<CartItem>;
        });
        state.user.items = newItems as any;
      })
      .addCase(syncAddServiceToCart.fulfilled, (state, action) => {
        const item = action.payload;
        state.user.items[item.id] = {
          ...item,
          quantity: 1,
        } as Draft<CartItem>;
      })
      .addCase(syncClearCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(syncClearCart.fulfilled, (state) => {
        state.user.items = {};
        state.loading = false;
      })
      .addCase(syncClearCart.rejected, (state) => {
        state.loading = false;
      });
  },
});

export const { addToCart, increaseQty, decreaseQty, clearCartLocal, addServiceToCart } = cartSlice.actions;
export { mergeGuestCart, syncAddServiceToCart, syncClearCart };
export default cartSlice.reducer;