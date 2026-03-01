import { Category, Pagination, Product } from "@/types/products.types";
import fetchCategories from "@/utils/categories";
import fetchProducts from "@/utils/products";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export function useProducts(
    selectedCategory: string | null,
    searchQuery: string
) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<Pagination | null>(null);

    const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const loadCategories = useCallback(async () => {
        try {
            const data = await fetchCategories();
            setCategories(data);
        } catch (err) {
            console.log("Failed to load categories:", err);
        }
    }, []);

    useEffect(() => {
        loadCategories();
    }, [loadCategories]);

    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        searchTimeoutRef.current = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 300);

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchQuery]);

    const loadProducts = useCallback(
        async (pageToLoad = 1, reset = false) => {
            if (loading) return;
            try {
                setLoading(true);

                const data = await fetchProducts({
                    search: debouncedSearch,
                    category: selectedCategory,
                    page: pageToLoad,
                    limit: 10,
                });

                setProducts((prev) => {
                    const merged = reset
                        ? data.products
                        : [...prev, ...data.products];

                    return Array.from(
                        new Map(merged.map((p) => [p.id, p])).values()
                    );
                });
                setPagination(data.pagination);
                setPage(pageToLoad);
            } catch (err) {
                console.log("Failed to load products:", err);
            } finally {
                setLoading(false);
            }
        },
        [debouncedSearch, selectedCategory, loading]
    );

    useEffect(() => {
        setProducts([]);
        setPage(1);
        loadProducts(1, true);
    }, [selectedCategory, debouncedSearch]); // Using selectedCategory and debouncedSearch, loadProducts is called but we shouldn't pass it as dependency correctly without issues. Wait, loadProducts depends on loading, which changes. This might cause loops depending on the dependency.
    // In original code, loadProducts wasn't in dependency array.

    const loadMore = () => {
        if (!pagination?.hasNextPage || loading) return;
        loadProducts(page + 1);
    };

    const refresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await Promise.all([
                loadCategories(),
                loadProducts(1, true)
            ]);
        } finally {
            setRefreshing(false);
        }
    }, [loadCategories, loadProducts]);

    const ProductsByCategory = useMemo(() => {
        if (selectedCategory) {
            return [
                {
                    id: selectedCategory,
                    name:
                        categories.find((c) => c.id === selectedCategory)?.name ??
                        "Filtered",
                    products,
                },
            ];
        }

        return categories.map((category) => ({
            ...category,
            products: products.filter(
                (p) => p.category?.id === category.id
            ),
        }));
    }, [categories, products, selectedCategory]);

    return {
        categories,
        ProductsByCategory,
        loading,
        refreshing,
        refresh,
        loadMore,
        pagination,
    };
}
