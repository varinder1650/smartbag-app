import { getStatusConfig } from "@/constants/statusConfig";
import api from "@/utils/client";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Animated, Dimensions, Pressable, ScrollView, Text, View } from "react-native";

interface ActiveOrderBanner {
    id: string;
    order_status: string;
    status_message: string;
    total_amount: number;
}


export default function ActiveOrderBanner() {
    const [orders, setOrders] = useState<ActiveOrderBanner[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [slideAnim] = useState(new Animated.Value(-100));
    const [pulseAnim] = useState(new Animated.Value(1));

    const fetchActiveOrder = useCallback(async () => {
        try {
            const response = await api.get("/orders/active");

            if (response.data && Array.isArray(response.data) && response.data.length > 0) {
                // Filter out dismissed orders
                const activeOrders = response.data.filter(o => o.order_status !== 'delivered');

                const validOrders = [];
                for (const order of activeOrders) {
                    const dismissedKey = `dismissed_${order.id}_${order.order_status}`;
                    const isDismissed = await AsyncStorage.getItem(dismissedKey);

                    if (isDismissed !== 'true') {
                        validOrders.push(order);
                    }
                }

                if (validOrders.length > 0) {
                    setOrders(validOrders);
                    setIsVisible(true);
                    animateIn();
                    startPulse();
                } else {
                    setIsVisible(false);
                    setOrders([]);
                }
            } else {
                setIsVisible(false);
                setOrders([]);
            }
        } catch (error) {
            if (__DEV__) console.error("Failed to fetch active orders:", error);
            setIsVisible(false);
        }
    }, []);

    useEffect(() => {
        fetchActiveOrder();

        // Poll every 30 seconds for active orders
        const interval = setInterval(fetchActiveOrder, 30000);

        return () => clearInterval(interval);
    }, [fetchActiveOrder]);

    const animateIn = () => {
        Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            damping: 14,
            stiffness: 100,
        }).start();
    };

    const handleClose = useCallback(async (orderId: string, status: string) => {
        const dismissedKey = `dismissed_${orderId}_${status}`;
        await AsyncStorage.setItem(dismissedKey, 'true');

        setOrders(prev => {
            const newOrders = prev.filter(o => o.id !== orderId);
            if (newOrders.length === 0) {
                setIsVisible(false);
            }
            return newOrders;
        });
    }, []);

    const startPulse = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.05,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    };

    if (!isVisible || orders.length === 0) return null;

    const renderBanner = (order: ActiveOrderBanner) => {
        const config = getStatusConfig(order.order_status);

        return (
            <Pressable
                key={order.id}
                onPress={() => router.push({ pathname: "/order-tracking", params: { orderId: order.id } })}
                className={`overflow-hidden rounded-2xl shadow-xl border border-white/10 ${config.color}`}
            >
                <View className="px-5 py-4">
                    <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center flex-1">
                            <Animated.View
                                style={{
                                    transform: [{ scale: pulseAnim }],
                                }}
                            >
                                <View className="bg-white/25 p-2 rounded-full mr-3 shadow-sm">
                                    <Ionicons name={config.icon as any} size={24} color="white" />
                                </View>
                            </Animated.View>

                            <View className="flex-1">
                                <Text className="text-white font-black text-lg">
                                    {config.label}
                                </Text>
                                <Text className="text-white/90 font-medium text-sm mt-0.5" numberOfLines={1}>
                                    {order.status_message}
                                </Text>
                            </View>
                        </View>

                        <View className="items-end ml-3">
                            <Pressable
                                onPress={(e) => {
                                    e.stopPropagation();
                                    handleClose(order.id, order.order_status);
                                }}
                                className="bg-black/20 p-1.5 rounded-full mb-1 self-end"
                            >
                                <Ionicons name="close" size={14} color="white" />
                            </Pressable>
                        </View>
                    </View>
                </View>

            </Pressable>
        );
    };

    const { width: SCREEN_WIDTH } = Dimensions.get('window');

    return (
        <Animated.View
            style={{
                transform: [{ translateY: slideAnim }],
            }}
            className="absolute bottom-2 left-0 right-0 z-50"
        >
            <View>
                {/* Horizontal Scroll for multiple orders, or single view */}
                {orders.length > 1 ? (
                    <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        snapToInterval={SCREEN_WIDTH}
                        decelerationRate="fast"
                        onScroll={(e: any) => {
                            const offset = e.nativeEvent.contentOffset.x;
                            const width = e.nativeEvent.layoutMeasurement.width;
                            setCurrentIndex(Math.round(offset / width));
                        }}
                        scrollEventThrottle={16}
                    >
                        {orders.map(order => (
                            <View key={order.id} style={{ width: SCREEN_WIDTH }} className="px-4">
                                {renderBanner(order)}
                            </View>
                        ))}
                    </ScrollView>
                ) : (
                    <View style={{ width: SCREEN_WIDTH }} className="px-4">
                        {renderBanner(orders[0])}
                    </View>
                )}

                {/* Pagination Dots */}
                {orders.length > 1 && (
                    <View className="flex-row justify-center mt-2">
                        {orders.map((_, idx) => (
                            <View
                                key={idx}
                                className={`w-1.5 h-1.5 rounded-full mx-1 ${currentIndex === idx ? 'bg-primary' : 'bg-gray-300'}`}
                            />
                        ))}
                    </View>
                )}
            </View>
        </Animated.View>
    );
}