import RequestDetailsModal from "@/components/RequestDetailsModal";
import api from "@/utils/client";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";

type Requests = {
    _id: string;
    product_name: string;
    brand: string;
    category: string;
    created_at: string;
    status: string;
    description?: string; // optional
};

export default function MyRequests() {
    const [requests, setRequests] = useState<Requests[]>([]);
    const [page, setPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(true);
    const [loading, setLoading] = useState(false);

    const [selectedRequest, setSelectedRequest] = useState<Requests | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    const fetchRequests = async (pageNum = 1) => {
        setLoading(true);
        try {
            const res = await api.get(`/support/product-requests?page=${pageNum}&limit=10`);
            if (pageNum === 1) setRequests(res.data);
            else setRequests((prev) => [...prev, ...res.data]);
            setHasNextPage(res.data.length === 10);
        } catch (e) {
            if (__DEV__) console.error("Failed to fetch requests", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRequests(); }, []);

    const loadMore = () => {
        if (hasNextPage && !loading) {
            setPage((prev) => {
                const next = prev + 1;
                fetchRequests(next);
                return next;
            });
        }
    };

    const handleRequestPress = (request: Requests) => {
        setSelectedRequest(request);
        setShowDetailsModal(true);
    };

    const formattedDate = (date: string) => new Date(date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });

    const statusColors: Record<string, string> = {
        preparing: "bg-yellow-400",
        out_for_delivery: "bg-blue-500",
        delivered: "bg-green-500",
        cancelled: "bg-red-500",
        assigning: "bg-orange-500",
    };

    if (loading && requests.length === 0)
        return (
            <View className="flex-1 justify-center items-center mt-10">
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );

    if (requests.length === 0)
        return (
            <View className="flex-1 justify-center items-center mt-10">
                <Text className="text-gray-500 text-lg">No requests found</Text>
            </View>
        );

    return (
        <>
            <FlatList
                data={requests}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                    <Pressable onPress={() => handleRequestPress(item)}>
                        <View className="bg-white rounded-2xl p-4 mb-3 shadow">
                            <View className="flex-row justify-between items-center mb-2">
                                <Text className="font-bold text-gray-900 text-base">#{item._id}</Text>
                                <View className={`${statusColors[item.status] || "bg-gray-300"} px-3 py-1 rounded-full`}>
                                    <Text className="text-white font-semibold text-xs capitalize">{item.status.replace("_", " ")}</Text>
                                </View>
                            </View>
                            <Text className="font-bold text-gray-900 mb-1">{item.product_name}</Text>
                            <Text className="text-gray-600">{item.brand} • {item.category}</Text>
                            <Text className="text-gray-500 text-sm mt-1">{formattedDate(item.created_at)}</Text>
                        </View>
                    </Pressable>
                )}
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: 16 }}
            />

            {/* Modal */}
            <RequestDetailsModal
                visible={showDetailsModal}
                request={selectedRequest}
                onClose={() => setShowDetailsModal(false)}
            />
        </>
    );
}