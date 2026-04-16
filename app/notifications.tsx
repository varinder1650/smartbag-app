import SafeView from "@/components/SafeView";
import TitleBar from "@/components/TitleBar";
import { useNotifications } from "@/context/NotificationContext";
import api from "@/utils/client";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';

type Notification = {
    id: string;
    title: string;
    message: string;
    type: string;
    created_at: string;
    read: boolean;
    order_id?: string;
}

// Normalise a raw item from any backend shape so it always has an `id` string
function normalise(item: any): Notification {
    return {
        ...item,
        id: item.id ?? item._id ?? String(Math.random()),
    };
}

// Extract the notification array regardless of the envelope the backend uses
function extractList(data: any): Notification[] {
    const raw: any[] = Array.isArray(data)
        ? data
        : (data?.notifications ?? data?.data ?? data?.items ?? data?.results ?? []);
    return raw.map(normalise);
}

export default function Notifications() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const { refreshUnreadCount } = useNotifications();

    const getNotifications = async () => {
        try {
            const res = await api.get("/notifications/");
            if (__DEV__) console.log("[Notifications] status:", res.status, "data:", JSON.stringify(res.data).slice(0, 400));
            setNotifications(extractList(res.data));
        } catch (error: any) {
            const status = error?.response?.status;
            const url = error?.config?.url;
            if (__DEV__) console.log("[Notifications] fetch error:", status, "url:", url, error?.message);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId: string) => {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        try {
            await api.put(`/notifications/${notificationId}/read`);
            refreshUnreadCount();
        } catch (error: any) {
            if (__DEV__) console.log("[Notifications] markAsRead error:", error?.response?.status);
            getNotifications();
        }
    };

    const clearAll = async () => {
        if (notifications.length === 0) return;
        setNotifications([]);
        try {
            await api.patch('/notifications/mark-all-read');
            refreshUnreadCount();
        } catch (error: any) {
            if (__DEV__) console.log("[Notifications] clearAll error:", error?.response?.status);
            getNotifications();
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await getNotifications();
        setRefreshing(false);
    };

    useEffect(() => {
        getNotifications();
    }, []);

    const renderRightActions = () => (
        <View className="bg-red-500 justify-center items-end rounded-xl mb-3 px-6 h-full w-full">
            <Ionicons name="trash-outline" size={24} color="white" />
        </View>
    );

    if (loading) {
        return (
            <SafeView className="flex-1 bg-white">
                <TitleBar title="Notifications" subtitle="" />
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#007AFF" />
                </View>
            </SafeView>
        );
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeView className="flex-1 bg-white">
                <TitleBar
                    title="Notifications"
                    subtitle=""
                    rightAction={
                        notifications.length > 0 && (
                            <Pressable
                                onPress={clearAll}
                                className="bg-gray-100 px-3 py-1.5 rounded-lg active:bg-gray-200"
                            >
                                <Text className="text-gray-600 font-medium text-xs">Clear All</Text>
                            </Pressable>
                        )
                    }
                />

                <FlatList
                    data={notifications}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{
                        paddingHorizontal: 16,
                        paddingTop: 16,
                        paddingBottom: 24,
                        flexGrow: 1,
                    }}
                    className="flex-1 bg-gray-50"
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    ListEmptyComponent={
                        <View className="flex-1 items-center justify-center py-20">
                            <Ionicons name="notifications-off-outline" size={48} color="#D1D5DB" />
                            <Text className="text-gray-400 text-sm mt-4">No notifications yet</Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <Swipeable
                            renderRightActions={renderRightActions}
                            onSwipeableOpen={() => markAsRead(item.id)}
                            containerStyle={{ overflow: 'visible' }}
                        >
                            <Pressable
                                onPress={() => {
                                    if (!item.read) markAsRead(item.id);
                                    if (item.type === "support_chat" || item.type === "support") {
                                        router.push("/chat");
                                    } else if (item.order_id) {
                                        router.push({
                                            pathname: "/order-tracking",
                                            params: { orderId: item.order_id },
                                        });
                                    }
                                }}
                            >
                                <View className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-200">
                                    <View className="flex-row items-center justify-between mb-2">
                                        <Text className="text-gray-900 font-semibold text-base flex-1 mr-2">
                                            {item.title}
                                        </Text>
                                        {!item.read && (
                                            <View className="w-2 h-2 bg-primary rounded-full" />
                                        )}
                                    </View>

                                    <Text className="text-gray-600 text-sm leading-5 mb-2">
                                        {item.message}
                                    </Text>

                                    <View className="flex-row items-center justify-between mt-2">
                                        <Text className="text-gray-400 text-xs">
                                            {new Date(item.created_at).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </Text>
                                        {item.order_id && (
                                            <Text className="text-gray-400 text-xs font-medium">
                                                #{item.order_id.substring(0, 8)}...
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            </Pressable>
                        </Swipeable>
                    )}
                />
            </SafeView>
        </GestureHandlerRootView>
    );
}
