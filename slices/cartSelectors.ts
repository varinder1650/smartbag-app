import { RootState } from "@/store/store";
import { isPorterItem, isPrintoutItem, isProductItem } from "@/types/cart.types";
import { createSelector } from "@reduxjs/toolkit";

// Base selectors
export const selectAuth = (state: RootState) => state.auth.isAuthenticated;
export const selectUserCart = (state: RootState) => state.cart.user.items;
export const selectGuestCart = (state: RootState) => state.cart.guest.items;

// Memoized selectors
export const selectCartItems = createSelector(
    [selectAuth, selectUserCart, selectGuestCart],
    (isAuthenticated, userItems, guestItems) => {
        const items = isAuthenticated ? userItems : guestItems;
        return Object.values(items).filter(item => item && item.id && item.name);
    }
);

export const selectCartTotal = createSelector(
    [selectCartItems],
    (items) => items.reduce((sum, item) => sum + (item.quantity || 0), 0)
);

export const selectCartSubtotal = createSelector(
    [selectCartItems],
    (items) => items.reduce((sum, item) => {
        return sum + ((item.selling_price || (item as any).price || 0) * (item.quantity || 1));
    }, 0)
);

// Separate product and service selectors
export const selectProductItems = createSelector(
    [selectCartItems],
    (items) => items.filter(isProductItem)
);

export const selectServiceItems = createSelector(
    [selectCartItems],
    (items) => items.filter(item => !isProductItem(item))
);

export const selectPorterServices = createSelector(
    [selectCartItems],
    (items) => items.filter(isPorterItem)
);

export const selectPrintoutServices = createSelector(
    [selectCartItems],
    (items) => items.filter(isPrintoutItem)
);

// Count selectors
export const selectProductCount = createSelector(
    [selectProductItems],
    (items) => items.reduce((sum, item) => sum + item.quantity, 0)
);

export const selectServiceCount = createSelector(
    [selectServiceItems],
    (items) => items.length
);

// Check if specific item is in cart
export const makeSelectIsItemInCart = () => createSelector(
    [selectCartItems, (_: RootState, itemId: string) => itemId],
    (items, itemId) => items.some(item => item.id === itemId)
);

// Get specific item quantity
export const makeSelectItemQuantity = () => createSelector(
    [selectCartItems, (_: RootState, itemId: string) => itemId],
    (items, itemId) => {
        const item = items.find(i => i.id === itemId);
        return item?.quantity || 0;
    }
);