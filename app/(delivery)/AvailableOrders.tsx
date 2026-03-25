import AvailableOrderCard from "@/components/delivery/AvailableCard";
import SafeView from "@/components/SafeView";
import api from "@/utils/client";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from "react-native";

export type AvailableOrder = {
    id: string;
    created_at: string;
    order_status: string;
};

export default function AvailableOrders() {
    const [orders, setOrders] = useState<AvailableOrder[]>([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const fetchOrders = async (pageNumber = 1, replace = false) => {
        if ((!hasMore && !replace) || loading) return;

        setLoading(true);
        try {
            const res = await api.get("/delivery/available", {
                params: { page: pageNumber, limit: 10 },
            });

            const newOrders: AvailableOrder[] = res.data.data ?? [];

            setHasMore(res.data.has_more);

            if (replace) {
                setOrders(newOrders);
                setPage(2);
            } else {
                setOrders(prev => [...prev, ...newOrders]);
                setPage(pageNumber + 1);
            }
        } catch (e) {
            if (__DEV__) console.error("Failed to fetch orders", e);
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
                    <Text className="text-gray-500 text-lg">No available orders</Text>
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
                    <AvailableOrderCard
                        order={item}
                        onActionComplete={handleRefresh}
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