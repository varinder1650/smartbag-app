import { PrintoutFee } from "@/slices/priceSlice";
import api from "@/utils/client";

export const pricing = async () => {
    const prices = await api.get("/settings/public")
    return prices.data
}

export const calculateDocumentPrice = (
    pages: number,
    copies: number,
    color: boolean,
    size: 'A4' | 'A3' | 'Legal',
    pricing: PrintoutFee
) => {
    const docPricing = pricing.doc;
    let pricePerPage = 0;

    if (size === 'A4') {
        pricePerPage = color ? docPricing.A4_color : docPricing.A4_black;
    } else if (size === 'A3') {
        pricePerPage = color ? docPricing.A3_color : docPricing.A3_black;
    } else if (size === 'Legal') {
        pricePerPage = color ? docPricing.legal_color : docPricing.legal_black;
    }

    return pages * copies * pricePerPage;
};

export const calculatePhotoPrice = (
    size: 'Passport' | '4x6' | '5x7',
    copies: number,
    pricing: PrintoutFee
) => {
    let pricePerPhoto = 0;
    if (size === 'Passport') {
        pricePerPhoto = pricing.photo.passport;
    } else {
        pricePerPhoto = pricing.photo.other;
    }
    return pricePerPhoto * copies;
};

const getDimensionValue = (dim: string): number => {
    switch (dim) {
        case "<10": return 10;
        case "10-20": return 20;
        case "20-50": return 50;
        case "50+": return 60; // Assumed max
        default: return 10;
    }
}

/** Flat surcharge added for urgent porter deliveries (₹) */
export const PORTER_URGENCY_FEE = 20;

export const calculatePorterPrice = (
    distance: number,
    dimensions: { length: string; width: string; height: string },
    pricing: number
): number => {
    const l = getDimensionValue(dimensions.length);
    const w = getDimensionValue(dimensions.width);
    const h = getDimensionValue(dimensions.height);
    const volume = l * w * h;
    const volumetricWeight = volume / 5000;
    return Math.round(volumetricWeight * distance * pricing);
};