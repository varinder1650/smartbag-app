export interface Address {
    _id: string;
    label: string;
    name?: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
    mobile_number: string;
    is_default: boolean;
    latitude?: number;
    longitude?: number;
}

export interface AddressEdit {
    _id?: string;
    label: string;
    name?: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
    mobile_number: string;
    is_default: boolean;
    latitude?: number;
    longitude?: number;
}