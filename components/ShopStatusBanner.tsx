import { fetchShopStatus } from "@/slices/Shopstatusslice";
import { AppDispatch, RootState } from "@/store/store";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";

interface ShopStatus {
    is_open: boolean;
    reopen_time: string | null;
    reason: string | null;
    // updated_at: string;
    // updated_by: string;
}

export default function ShopStatusBanner() {
    const dispatch = useDispatch<AppDispatch>();
    const shopStatus = useSelector((state: RootState) => state.shopStatus.status);
    const [isVisible, setIsVisible] = useState(false);
    const [slideAnim] = useState(new Animated.Value(-100));

    useEffect(() => {
        if (shopStatus && !shopStatus.is_open) {
            setIsVisible(true);
            animateIn();
        } else {
            setIsVisible(false);
            animateOut();
        }
    }, [shopStatus]);

    const animateIn = () => {
        Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            damping: 15,
            stiffness: 100,
        }).start();
    };

    const animateOut = () => {
        Animated.timing(slideAnim, {
            toValue: -100,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            // Optional: setIsVisible(false) here after animation
        });
    };

    const formatReopenTime = (reopenTime: string | null) => {
        if (!reopenTime) return "soon";

        try {
            const date = new Date(reopenTime);
            const now = new Date();

            // Check if it's today
            const isToday = date.toDateString() === now.toDateString();

            // Check if it's tomorrow
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const isTomorrow = date.toDateString() === tomorrow.toDateString();

            const timeStr = date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });

            if (isToday) {
                return `today at ${timeStr}`;
            } else if (isTomorrow) {
                return `tomorrow at ${timeStr}`;
            } else {
                return date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                });
            }
        } catch (error) {
            return "soon";
        }
    };

    const getMessage = () => {
        if (!shopStatus || shopStatus.is_open) return null;

        const reopenText = formatReopenTime(shopStatus.reopen_time);
        const reason = shopStatus.reason || "We're currently closed";

        return {
            title: "🚫 Delivery Temporarily Unavailable",
            message: `${reason}. We'll be back ${reopenText}.`,
            icon: "time-outline" as const
        };
    };

    if (!isVisible || !shopStatus || shopStatus.is_open) {
        return null;
    }

    const message = getMessage();
    if (!message) return null;

    return (
        <Animated.View
            style={{
                transform: [{ translateY: slideAnim }],
            }}
            className="mx-4 mt-4"
        >
            <View className="bg-red-50 border border-red-200 rounded-2xl p-4 shadow-sm">
                <View className="flex-row items-start">
                    <View className="bg-red-100 p-2 rounded-full mr-3">
                        <Ionicons name={message.icon} size={24} color="#DC2626" />
                    </View>

                    <View className="flex-1">
                        <Text className="text-red-900 font-bold text-base mb-1">
                            {message.title}
                        </Text>
                        <Text className="text-red-700 text-sm leading-5">
                            {message.message}
                        </Text>

                        <Pressable
                            onPress={() => dispatch(fetchShopStatus())}
                            className="mt-3 bg-red-100 py-2 px-4 rounded-lg self-start"
                        >
                            <Text className="text-red-700 font-semibold text-xs">
                                Refresh Status
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Animated.View>
    );
}