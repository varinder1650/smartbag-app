export type OrderStatus =
    | "confirmed"
    | "preparing"
    | "assigning"
    | "assigned"
    | "out_for_delivery"
    | "arrived"
    | "delivered"
    | "cancelled"
    | "unknown";

export interface StatusConfig {
    color: string;
    icon: string;
    label: string;
    progress: number;
}

export const STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
    confirmed:        { color: "bg-blue-500",   icon: "checkmark-circle", label: "Confirmed",       progress: 14 },
    preparing:        { color: "bg-orange-500",  icon: "restaurant",       label: "Preparing",       progress: 28 },
    assigning:        { color: "bg-yellow-500",  icon: "search",           label: "Finding Partner", progress: 42 },
    assigned:         { color: "bg-purple-500",  icon: "person",           label: "Assigned",        progress: 57 },
    out_for_delivery: { color: "bg-green-500",   icon: "bicycle",          label: "On the Way",      progress: 71 },
    arrived:          { color: "bg-indigo-500",  icon: "location",         label: "Arrived",         progress: 85 },
    delivered:        { color: "bg-gray-500",    icon: "checkmark-done",   label: "Delivered",       progress: 100 },
    cancelled:        { color: "bg-red-500",     icon: "close-circle",     label: "Cancelled",       progress: 0 },
    unknown:          { color: "bg-gray-300",    icon: "help-circle",      label: "Unknown",         progress: 0 },
};

/** Ordered steps for progress stepper (excludes cancelled/unknown) */
export const STATUS_STEPS = [
    "confirmed",
    "preparing",
    "assigning",
    "assigned",
    "out_for_delivery",
    "arrived",
    "delivered",
] as const;

/** Helper to get config for any status string, with fallback */
export function getStatusConfig(status: string): StatusConfig {
    return STATUS_CONFIG[status as OrderStatus] || STATUS_CONFIG.unknown;
}
