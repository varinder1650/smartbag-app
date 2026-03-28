export interface DeliveryPartner {
    name: string;
    phone: string;
    rating: number;
    deliveries: number;
}

export interface ProductOrderItem {
    type: "product";
    product: string;
    product_name?: string;
    product_image?: string[];
    quantity: number;
    price: number;
}

export interface PorterOrderItem {
    type: "porter";
    service_data: {
        pickup_address: { street: string; city: string; state: string; pincode: string; mobile_number: string };
        delivery_address: { street: string; city: string; state: string; pincode: string; mobile_number: string };
        dimensions?: { length: string; width: string; height: string };
        weight_category: number | string;
        estimated_distance: number;
        estimated_cost?: number;
        notes?: string;
        is_urgent?: boolean;
    };
}

export interface PrintoutOrderItem {
    type: "printout";
    service_data: {
        print_type: "document" | "photo";
        pages: number;
        copies: number;
        color: boolean;
        paper_size: string;
        notes?: string;
        document_urls?: string[];
        photo_urls?: string[];
    };
}

export type OrderItem = ProductOrderItem | PorterOrderItem | PrintoutOrderItem;

export interface ActiveOrder {
    id: string;
    order_status: string;
    status_message: string;
    items: OrderItem[];
    total_amount: number;
    delivery_address: any;
    delivery_partner?: DeliveryPartner;
    created_at: string;
    estimated_delivery_time?: number;
    tip_amount?: number;
    rating?: number;
    review?: string;
    assigned_at?: string;
    delivered_at?: string;
}

// Re-export from shared constants for backward compatibility
export { STATUS_CONFIG, STATUS_STEPS, getStatusConfig } from "@/constants/statusConfig";
