import OrderCard, { Order } from "@/components/OrderCard";
import api from "@/utils/client";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from "react-native";

const ITEM_HEIGHT = 150;

export default function MyOrders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [page, setPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(true);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const fetchOrders = useCallback(async (pageNum = 1, refresh = false) => {
        if (loading || (!hasNextPage && !refresh)) return;

        setLoading(true);
        try {
            const res = await api.get(`/orders/my?page=${pageNum}&limit=10`);

            if (refresh || pageNum === 1) {
                setOrders(res.data.orders);
            } else {
                setOrders((prev) => [...prev, ...res.data.orders]);
            }

            setHasNextPage(res.data.pagination.hasNextPage);
            setPage(pageNum);
        } catch (e) {
            if (__DEV__) console.error("Failed to fetch orders", e);
        } finally {
            setLoading(false);
            if (refresh) setRefreshing(false);
        }
    }, [loading, hasNextPage]);

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        setPage(1);
        setHasNextPage(true);
        fetchOrders(1, true);
    }, [fetchOrders]);

    const handleLoadMore = useCallback(() => {
        if (!loading && hasNextPage) {
            fetchOrders(page + 1);
        }
    }, [loading, hasNextPage, page, fetchOrders]);

    const renderItem = useCallback(({ item }: { item: Order }) => (
        <OrderCard order={item} />
    ), []);

    const renderFooter = useCallback(() => {
        if (!loading) return null;
        return (
            <View className="py-4">
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );
    }, [loading]);

    const renderEmpty = useCallback(() => {
        if (loading) return null;
        return (
            <View className="flex-1 justify-center items-center mt-10">
                <Text className="text-gray-500 text-lg">No orders found</Text>
            </View>
        );
    }, [loading]);

    const keyExtractor = useCallback((item: Order) => item.id || item.order_id, []);

    const getItemLayout = useCallback(
        (data: any, index: number) => ({
            length: ITEM_HEIGHT,
            offset: ITEM_HEIGHT * index,
            index,
        }),
        []
    );

    return (
        <FlatList
            data={orders}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 16 }}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={renderEmpty}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    tintColor="#2563EB"
                />
            }
            // Performance optimizations
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={true}
            getItemLayout={getItemLayout}
        />
    );
}