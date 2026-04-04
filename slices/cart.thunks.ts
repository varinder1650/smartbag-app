import { CartItem, ProductCartItem } from "@/types/cart.types";
import api from "@/utils/client";
import { createAsyncThunk } from "@reduxjs/toolkit";

type BackendCartResponse = {
    items: any[];
    total_items: number;
    total_price: number;
};

type BackendCartItem = {
    _id: string;
    productId?: string;
    quantity: number;
    product: {
        id: string;
        name: string;
        price?: number;
        selling_price?: number;
        actual_price?: number;
        discount?: number;
        stock?: number;
        images?: string[];
        serviceType?: "product" | "porter" | "printout";
    };
    serviceDetails?: any;
};

// Helper function to convert backend item to CartItem
function convertToCartItem(backendItem: BackendCartItem): CartItem {
    const product = backendItem.product;
    const serviceType = product?.serviceType || 'product';

    // Base properties common to all cart items
    const baseItem = {
        id: product?.id || backendItem.productId || '',
        cartItemId: backendItem._id,
        name: product?.name || '',
        quantity: backendItem.quantity || 1,
        images: product?.images,
    };

    // Return appropriate type based on serviceType
    if (serviceType === 'product') {
        const productItem: ProductCartItem = {
            ...baseItem,
            serviceType: 'product' as const,
            selling_price: product?.selling_price || product?.price || 0,
            actual_price: product?.actual_price || product?.price || 0,
            discount: product?.discount || 0,
            stock: product?.stock || 0,
        };
        return productItem;
    } else if (serviceType === 'porter') {
        // For porter service - use 'as CartItem' to satisfy discriminated union
        return {
            ...baseItem,
            serviceType: 'porter' as const,
            selling_price: product?.selling_price || product?.price || 0,
            serviceDetails: backendItem.serviceDetails || {
                pickupAddress: null,
                deliveryAddress: null,
                distance: 0,
            },
        } as CartItem;
    } else if (serviceType === 'printout') {
        // For printout service
        return {
            ...baseItem,
            serviceType: 'printout' as const,
            selling_price: product?.selling_price || product?.price || 0,
            serviceDetails: backendItem.serviceDetails || {
                numberOfPages: 0,
                colorPrinting: false,
                paperSize: 'A4',
                copies: 1,
            },
        } as CartItem;
    }

    // Default fallback to product
    const defaultItem: ProductCartItem = {
        ...baseItem,
        serviceType: 'product' as const,
        selling_price: product?.selling_price || product?.price || 0,
        actual_price: product?.actual_price || product?.price || 0,
        discount: product?.discount || 0,
        stock: product?.stock || 0,
    };
    return defaultItem;
}

export const syncAddToCart = createAsyncThunk<CartItem, string>(
    "cart/syncAdd",
    async (id: string) => {
        const { data } = await api.post<any>("/cart/add", { id, quantity: 1 });
        return convertToCartItem(data.cart_item);
    }
);

export const syncAddServiceToCart = createAsyncThunk<CartItem, CartItem, { rejectValue: string }>(
    "cart/syncAddService",
    async (item: CartItem, { rejectWithValue }) => {
        try {
            const payload = {
                serviceType: item.serviceType,
                serviceName: item.name,
                servicePrice: item.selling_price,
                serviceDetails: (item as any).serviceDetails,
            };
            if (__DEV__) console.log("[syncAddServiceToCart] sending:", JSON.stringify(payload).slice(0, 500));
            const { data } = await api.post<any>("/cart/add", payload);
            if (__DEV__) console.log("[syncAddServiceToCart] response:", JSON.stringify(data).slice(0, 500));

            // Ensure the ID maps back to the database _id so removals work
            return {
                ...item,
                id: data.cart_item._id || item.id,
                cartItemId: data.cart_item._id,
            };
        } catch (error: any) {
            const message = error?.response?.data?.detail || error?.response?.data?.message || error.message || "Failed to add service to cart";
            if (__DEV__) console.error("[syncAddServiceToCart] FAILED:", error?.response?.status, error?.response?.data || error.message);
            return rejectWithValue(message);
        }
    }
);

export const syncUpdateQty = createAsyncThunk<CartItem, { id: string; quantity: number }>(
    "cart/syncUpdateQty",
    async ({ id, quantity }) => {
        const { data } = await api.put<BackendCartItem>("/cart/update", { itemId: id, quantity });
        return convertToCartItem(data);
    }
);

export const syncRemoveItem = createAsyncThunk<{ itemId: string }, string>(
    "cart/syncRemoveItem",
    async (id) => {
        const { data } = await api.delete("/cart/remove", { data: { itemId: id } });
        return data;
    }
);

export const syncClearCart = createAsyncThunk<void, void, { rejectValue: string }>(
    "cart/syncClearCart",
    async (_, { rejectWithValue }) => {
        try {
            await api.delete("/cart/clear");
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "Failed to clear cart");
        }
    }
);

export const syncUserCart = createAsyncThunk<CartItem[]>(
    "cart/syncUserCart",
    async () => {
        const { data } = await api.get<BackendCartResponse>("/cart");

        const backendItems = data.items || [];

        const cartItems: CartItem[] = backendItems.map((item: any) => {
            // Convert backend format to BackendCartItem format
            // Determine service type: check multiple sources
            const resolvedServiceType =
                item.product?.serviceType ||
                item.serviceType ||
                (item.serviceDetails?.pickupAddress ? 'porter' :
                 item.serviceDetails?.printType ? 'printout' : 'product');

            const backendItem: BackendCartItem = {
                _id: item._id,
                productId: item.productId,
                quantity: item.quantity,
                product: {
                    id: item.product?.id || item.id || item._id,
                    name: item.product?.name || item.name || item.serviceName,
                    price: item.product?.price || item.price || item.servicePrice,
                    selling_price: item.product?.selling_price || item.selling_price || item.servicePrice,
                    actual_price: item.product?.actual_price || item.actual_price || item.servicePrice,
                    discount: item.product?.discount || item.discount || 0,
                    stock: item.product?.stock || item.stock,
                    images: item.product?.images || item.images,
                    serviceType: resolvedServiceType,
                },
                serviceDetails: item.serviceDetails,
            };

            return convertToCartItem(backendItem);
        });

        return cartItems;
    }
);

export const mergeGuestCart = createAsyncThunk<void, CartItem[], { dispatch: any }>(
    "cart/mergeGuestCart",
    async (items, { dispatch }) => {
        if (!items || items.length === 0) return;

        const products = items.filter(i => i.serviceType === 'product');
        if (products.length > 0) {
            const payload = products.map((i) => ({
                id: i.id, // backend CartRequest uses id
                productId: i.id, 
                quantity: i.quantity ?? 1,
                serviceType: i.serviceType,
            }));
            await api.post("/cart/batch-add", payload);
        }

        const services = items.filter(i => i.serviceType !== 'product');
        if (services.length > 0) {
            const results = await Promise.allSettled(
                services.map((item) => {
                    const payload = {
                        serviceType: item.serviceType,
                        serviceName: item.name,
                        servicePrice: item.selling_price || (item as any).price || 0,
                        serviceDetails: (item as any).serviceDetails || {},
                    };
                    return api.post("/cart/add", payload);
                })
            );

            const failures = results
                .map((r, i) => (r.status === "rejected" ? services[i].name : null))
                .filter(Boolean);

            if (failures.length > 0 && __DEV__) {
                console.warn(`Failed to merge ${failures.length} service(s):`, failures);
            }
        }

        // Clear guest cart after merge
        dispatch({ type: "cart/clearCartLocal", payload: "guest" });
    }
);