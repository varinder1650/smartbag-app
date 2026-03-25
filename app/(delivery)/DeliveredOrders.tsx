import DeliveredOrderCard, { DeliveredOrder } from "@/components/delivery/DeliveredCardDetails";
import SafeView from "@/components/SafeView";
import api from "@/utils/client";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from "react-native";

export default function DeliveredOrders() {
    const [orders, setOrders] = useState<DeliveredOrder[]>([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const fetchOrders = async (pageNumber = 1, replace = false) => {
        if ((!hasMore && !replace) || loading) return;

        setLoading(true);
        try {
            const res = await api.get("/delivery/delivered", { params: { page: pageNumber, limit: 10 } });
            const newOrders: DeliveredOrder[] = Array.isArray(res.data) ? res.data : [];

            if (replace) {
                setOrders(newOrders);
                setPage(2);
            } else {
                setOrders(prev => [...prev, ...newOrders]);
                setPage(pageNumber + 1);
            }

            setHasMore(newOrders.length === 10);
        } catch (error) {
            if (__DEV__) console.error("Failed to fetch delivered orders:", error);
        } finally {
            setLoading(false);
            if (replace) setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchOrders(1, true);
    };

    const renderFooter = () =>
        loading && !refreshing ? (
            <View className="py-4">
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        ) : null;

    if (!loading && orders.length === 0) {
        return (
            <View className="flex-1 bg-white">
                <View className="px-6 justify-center items-center">
                    <Text className="text-gray-500 text-lg">No delivered orders</Text>
                </View>
            </View>
        );
    }

    return (
        <SafeView className="flex-1 bg-white">
            <FlatList
                data={orders}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <DeliveredOrderCard
                        order={item}
                    />
                )}
                showsVerticalScrollIndicator={false}
                onEndReached={() => fetchOrders(page)}
                onEndReachedThreshold={0.5}
                ListFooterComponent={renderFooter}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor="#2563EB"
                    />
                }
                contentContainerStyle={{ paddingBottom: 32 }}
            />
        </SafeView>
    );
}
