import SafeView from "@/components/SafeView";
import TitleBar from "@/components/TitleBar";
import { useNotifications } from "@/context/NotificationContext";
import api from "@/utils/client";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
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

export default function Notifications() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const { refreshUnreadCount } = useNotifications();

    const markAsRead = async (notificationId: string) => {
        try {
            // Optimistically remove from list
            setNotifications(prev => prev.filter(n => n.id !== notificationId));

            // API call
            await api.put(`/notifications/${notificationId}/read`);
            refreshUnreadCount();
        } catch (error) {
            console.error("Failed to mark as read:", error);
            // Revert on error? Or just silent fail for better UX since it's just 'read' status
            getNotifications(); // Refresh to ensure sync
        }
    };

    const clearAll = async () => {
        if (notifications.length === 0) return;

        try {
            // Optimistic update
            setNotifications([]);

            // API call
            await api.patch('/notifications/mark-all-read');
            refreshUnreadCount();
        } catch (error) {
            console.error("Failed to mark all as read:", error);
            getNotifications();
        }
    };

    const renderRightActions = (id: string) => {
        return (
            <View className="bg-red-500 justify-center items-end rounded-xl mb-3 px-6 h-full w-full">
                <Ionicons name="trash-outline" size={24} color="white" />
            </View>
        );
    };

    // useEffect(() => {
    //     const markAllAsRead = async () => {
    //         try {
    //             await api.patch('/notifications/mark-all-read');
    //             refreshUnreadCount();
    //         } catch (error) {
    //             console.error("Failed to mark all as read:", error);
    //         }
    //     };

    //     markAllAsRead();
    // }, []);

    const getNotifications = async () => {
        try {
            const res = await api.get("/notifications");
            // console.log("API Response:", res.data);

            if (res.data && res.data.notifications) {
                setNotifications(res.data.notifications);
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
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
                        flexGrow: 1
                    }}
                    className="flex-1 bg-gray-50"
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    ListEmptyComponent={
                        <View className="flex-1 items-center justify-center py-20">
                            <Text className="text-gray-400 text-sm">
                                No notifications yet
                            </Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <Swipeable
                            renderRightActions={() => renderRightActions(item.id)}
                            onSwipeableOpen={() => markAsRead(item.id)}
                            containerStyle={{ overflow: 'visible' }}
                        >
                            <View className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-200">
                                {/* Header */}
                                <View className="flex-row items-center justify-between mb-2">
                                    <Text className="text-gray-900 font-semibold text-base flex-1 mr-2">
                                        {item.title}
                                    </Text>

                                    {!item.read && (
                                        <View className="w-2 h-2 bg-primary rounded-full" />
                                    )}
                                </View>

                                {/* Message */}
                                <Text className="text-gray-600 text-sm leading-5 mb-2">
                                    {item.message}
                                </Text>

                                {/* Footer */}
                                <View className="flex-row items-center justify-between">
                                    <Text className="text-gray-400 text-xs">
                                        {new Date(item.created_at).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </Text>

                                    {item.order_id && (
                                        <Text className="text-gray-400 text-xs">
                                            #{item.order_id}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        </Swipeable>
                    )}
                />
            </SafeView>
        </GestureHandlerRootView>
    );
}