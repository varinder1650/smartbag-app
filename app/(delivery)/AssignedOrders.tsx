import AssignedOrderCard, { AssignedOrder } from "@/components/delivery/AssignedOrderCard";
import SafeView from "@/components/SafeView";
import api from "@/utils/client";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from "react-native";

export default function AssignedOrders() {
    const [orders, setOrders] = useState<AssignedOrder[]>([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const fetchOrders = async (pageNumber = 1, replace = false) => {
        if ((!hasMore && !replace) || loading) return;

        setLoading(true);
        try {
            const res = await api.get("/delivery/assigned", { params: { page: pageNumber, limit: 10 } });
            const newOrders: AssignedOrder[] = Array.isArray(res.data) ? res.data : [];

            if (replace) {
                setOrders(newOrders);
                setPage(2);
            } else {
                setOrders(prev => {
                    const existingIds = new Set(prev.map(o => o.id));
                    const uniqueNewOrders = newOrders.filter(o => !existingIds.has(o.id));
                    return [...prev, ...uniqueNewOrders];
                });
                setPage(pageNumber + 1);
            }

            setHasMore(newOrders.length === 10);
        } catch (error) {
            if (__DEV__) console.error("Failed to fetch assigned orders:", error);
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


    return (
        <SafeView className="flex-1 bg-white">
            <FlatList
                data={orders}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <AssignedOrderCard
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
                ListEmptyComponent={
                    !loading ? (
                        <View className="flex-1 justify-center items-center px-6 mt-10">
                            <Text className="text-gray-500 text-lg">No assigned orders</Text>
                        </View>
                    ) : null
                }
                contentContainerStyle={{ paddingBottom: 32, flexGrow: 1 }}
            />
        </SafeView>
    );
}
