import { Address } from "./address.types";

// Base type for all cart items
export interface CartItemBase {
    id: string;
    cartItemId?: string;
    name: string;
    selling_price: number;
    quantity: number;
    images?: string[];
    serviceType: "product" | "porter" | "printout";
}

// Porter service details
export interface PorterServiceDetails {
    pickupAddress: Address;
    deliveryAddress: Address;
    distance: number;
    weight: string;
    phone: string;
    recipientName: string;
    dimensions: {
        length: string;
        width: string;
        height: string;
    };
    notes?: string;
    isUrgent?: boolean;
}

// Printout service details
export interface PrintoutServiceDetails {
    printType: "document" | "photo";
    documents?: Array<{
        id: string;
        name: string;
        pages: number;
        cloudUrl?: string;
    }>;
    photos?: Array<{
        id: string;
        cloudUrl?: string;
        name: string;
    }>;
    numberOfPages: number;
    copies: number;
    paperSize?: "A4" | "A3" | "Legal";
    photoSize?: "Passport" | "4x6" | "5x7";
    colorPrinting: boolean;
    notes?: string;
}

// Specific cart item types
export interface ProductCartItem extends CartItemBase {
    serviceType: "product";
    stock: number;
    actual_price: number;
    discount: number;
    user_custom_image?: string | null;
}

export interface PorterCartItem extends CartItemBase {
    serviceType: "porter";
    serviceDetails: PorterServiceDetails;
}

export interface PrintoutCartItem extends CartItemBase {
    serviceType: "printout";
    serviceDetails: PrintoutServiceDetails;
}

// Union type for all cart items
export type CartItem = ProductCartItem | PorterCartItem | PrintoutCartItem;

// Type guards
export const isProductItem = (item: CartItem): item is ProductCartItem => {
    return item.serviceType === "product";
};

export const isPorterItem = (item: CartItem): item is PorterCartItem => {
    return item.serviceType === "porter";
};

export const isPrintoutItem = (item: CartItem): item is PrintoutCartItem => {
    return item.serviceType === "printout";
};