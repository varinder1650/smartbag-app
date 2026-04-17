
export type Category = {
    id: string;
    name: string;
    image: string;
};

export type Product = {
    id: string;
    name: string;
    description?: string;
    actual_price: number;
    selling_price: number;
    discount: number;
    stock: number;
    images?: string[];
    category?: Category;
    status?: string;
    allow_user_images?: boolean;
    allow_user_description?: boolean;
    mockup_template_url?: string;
    printable_area?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
};

export type ServiceType = 'porter' | 'printout' | 'product';

export type Pagination = {
    currentPage: number;
    totalPages: number;
    totalProducts: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
};

export type ProductsResponse = {
    products: Product[];
    pagination: Pagination;
};