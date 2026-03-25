import { ProductsResponse } from "@/types/products.types";
import api from "./client";

type FetchProductsParams = {
    search?: string;
    category?: string | null;
    brand?: string | null;
    page?: number;
    limit?: number;
};

const fetchProducts = async (params: FetchProductsParams = {}) => {
    const response = await api.get<ProductsResponse>("/products", {
        params: {
            search: params.search || undefined,
            category: params.category || undefined,
            page: params.page ?? 1,
            limit: params.limit ?? 10,
        }
    });
    return response.data;
}

export const loadProductDetails = async (id: string) => {
    try {
        const response = await api.get(`/products/${id}`);
        return response.data;
    } catch (err) {
        if (__DEV__) console.log("Failed to get the product details: ", { err });
    }
};

export default fetchProducts;