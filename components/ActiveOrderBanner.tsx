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
            damping: 12,
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
                className="overflow-hidden rounded-2xl shadow-lg mb-2"
            >
                <View className={`${config.color} px-5 py-4`}>
                    <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center flex-1">
                            <Animated.View
                                style={{
                                    transform: [{ scale: pulseAnim }],
                                }}
                            >
                                <View className="bg-white/20 p-2 rounded-full mr-3">
                                    <Ionicons name={config.icon as any} size={24} color="white" />
                                </View>
                            </Animated.View>

                            <View className="flex-1">
                                <Text className="text-white font-bold text-base">
                                    {config.label}
                                </Text>
                                <Text className="text-white/90 text-sm mt-0.5" numberOfLines={1}>
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
                                className="bg-white/20 p-1.5 rounded-full mb-1 self-end"
                            >
                                <Ionicons name="close" size={14} color="white" />
                            </Pressable>

                            <View className="flex-row items-center">
                                <Text className="text-white/80 text-xs mr-1">
                                    Track
                                </Text>
                                <Ionicons name="chevron-forward" size={16} color="white" />
                            </View>
                        </View>
                    </View>
                </View>

                {/* Static Progress Line */}
                <View className="bg-white/20 h-1">
                    <View
                        style={{ width: `${config.progress}%` }}
                        className="bg-white h-full"
                    />
                </View>
            </Pressable>
        );
    };



    const { width: SCREEN_WIDTH } = Dimensions.get('window');
    const BANNER_WIDTH = SCREEN_WIDTH - 32; // 32 = mx-4 margin (16*2)

    return (
        <Animated.View
            style={{
                transform: [{ translateY: slideAnim }],
            }}
            className="mx-4 mt-4"
        >
            <View>
                {/* Horizontal Scroll for multiple orders, or single view */}
                {orders.length > 1 ? (
                    <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        snapToInterval={BANNER_WIDTH}
                        decelerationRate="fast"
                        onScroll={(e: any) => {
                            const offset = e.nativeEvent.contentOffset.x;
                            const width = e.nativeEvent.layoutMeasurement.width;
                            setCurrentIndex(Math.round(offset / width));
                        }}
                        scrollEventThrottle={16}
                    >
                        {orders.map(order => (
                            <View key={order.id} style={{ width: BANNER_WIDTH }}>
                                {renderBanner(order)}
                            </View>
                        ))}
                    </ScrollView>
                ) : (
                    renderBanner(orders[0])
                )}

                {/* Pagination Dots */}
                {orders.length > 1 && (
                    <View className="flex-row justify-center mt-2 space-x-1">
                        {orders.map((_, idx) => (
                            <View
                                key={idx}
                                className={`w-1.5 h-1.5 rounded-full ${currentIndex === idx ? 'bg-primary' : 'bg-gray-300'}`}
                            />
                        ))}
                    </View>
                )}
            </View>
        </Animated.View>
    );
}