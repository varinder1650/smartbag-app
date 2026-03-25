import CountdownTimer, { OvertimeWarning, TimerStatus } from "@/components/OrderTracking/CountdownTimer";
import OrderDetailsSection from "@/components/OrderTracking/OrderDetailsSection";
import OrderStatusStepper from "@/components/OrderTracking/OrderStatusStepper";
import RatingModal from "@/components/OrderTracking/RatingModal";
import TipSection from "@/components/OrderTracking/TipSection";
import { ActiveOrder, STATUS_STEPS } from "@/components/OrderTracking/types";
import SafeView from "@/components/SafeView";
import api from "@/utils/client";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    Linking,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";

export default function OrderTrackingScreen() {
    const params = useLocalSearchParams<{ orderId?: string }>();
    const [order, setOrder] = useState<ActiveOrder | null>(null);
    const [loading, setLoading] = useState(true);
    const [tipAmount, setTipAmount] = useState("");
    const [showTipInput, setShowTipInput] = useState(false);
    const [addingTip, setAddingTip] = useState(false);

    // Rating state
    const [showRating, setShowRating] = useState(false);
    const [rating, setRating] = useState(0);
    const [review, setReview] = useState("");
    const [submittingRating, setSubmittingRating] = useState(false);

    // Countdown timer state
    const [countdown, setCountdown] = useState<number | null>(null);
    const [timerStatus, setTimerStatus] = useState<TimerStatus>("waiting");

    // Animation
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;

    // --- Data fetching ---

    const fetchOrder = useCallback(async () => {
        try {
            let response;

            if (params.orderId) {
                if (__DEV__) console.log("Fetching order by ID:", params.orderId);
                response = await api.get<ActiveOrder>(`/orders/${params.orderId}`);
            } else {
                if (__DEV__) console.log("Fetching active order");
                response = await api.get<ActiveOrder>("/orders/active");
            }

            if (response.data) {
                setOrder(response.data);
                if (response.data.order_status === "delivered" && !response.data.rating) {
                    setShowRating(true);
                }
            } else {
                setOrder(null);
            }
        } catch (error: any) {
            if (__DEV__) console.error("Failed to fetch order:", error);
            if (error.response?.status === 404) {
                Alert.alert(
                    "Order Not Found",
                    "This order could not be found or you don't have access to it.",
                    [{ text: "OK", onPress: () => router.back() }]
                );
            }
        } finally {
            setLoading(false);
        }
    }, [params.orderId]);

    // Poll for updates every 10 seconds (only for active orders)
    useEffect(() => {
        fetchOrder();

        if (!order || ["delivered", "cancelled"].includes(order.order_status)) {
            return;
        }

        const interval = setInterval(fetchOrder, 10000);
        return () => clearInterval(interval);
    }, [fetchOrder, order?.order_status]);

    // --- Countdown timer ---

    useEffect(() => {
        if (!order) return;

        const isAssignedOrLater = ["assigned", "out_for_delivery", "arrived"].includes(order.order_status);
        const isDelivered = order.order_status === "delivered";

        if (isDelivered) {
            setTimerStatus("stopped");
            setCountdown(null);
            return;
        }

        if (!isAssignedOrLater) {
            setTimerStatus("waiting");
            setCountdown(null);
            return;
        }

        const assignedTime = order.assigned_at
            ? new Date(order.assigned_at).getTime()
            : new Date(order.created_at).getTime();

        const THIRTY_MINUTES = 30 * 60 * 1000;
        const targetTime = assignedTime + THIRTY_MINUTES;

        const timer = setInterval(() => {
            const remaining = targetTime - Date.now();
            if (remaining <= 0) {
                setCountdown(0);
                setTimerStatus("overtime");
            } else {
                setCountdown(Math.floor(remaining / 1000));
                setTimerStatus("active");
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [order?.order_status, order?.assigned_at, order?.created_at]);

    // --- Animations ---

    useEffect(() => {
        if (!order || order.order_status === "delivered") return;

        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, [order?.order_status]);

    useEffect(() => {
        if (!order) return;

        const currentIndex = STATUS_STEPS.findIndex(s => s.key === order.order_status);
        const progress = ((currentIndex + 1) / STATUS_STEPS.length) * 100;

        Animated.timing(progressAnim, {
            toValue: progress,
            duration: 500,
            useNativeDriver: false,
        }).start();
    }, [order?.order_status]);

    // --- Handlers ---

    const handleAddTip = useCallback(async () => {
        if (!order || !tipAmount) return;

        const amount = parseInt(tipAmount);
        if (isNaN(amount) || amount < 1 || amount > 500) {
            Alert.alert("Invalid Amount", "Tip must be between ₹1 and ₹500");
            return;
        }

        setAddingTip(true);
        try {
            await api.post(`/orders/${order.id}/add-tip`, {
                tip_amount: amount,
                order_id: order.id,
            });
            Alert.alert("Success", `₹${amount} tip added!`);
            setShowTipInput(false);
            setTipAmount("");
            await fetchOrder();
        } catch (error: any) {
            Alert.alert("Error", error.response?.data?.detail || "Failed to add tip");
        } finally {
            setAddingTip(false);
        }
    }, [order?.id, tipAmount, fetchOrder]);

    const handleQuickTip = useCallback((amount: number) => {
        setTipAmount(amount.toString());
        // Use setTimeout so tipAmount state updates before handleAddTip reads it
        setTimeout(() => {
            setTipAmount(prev => {
                // Trigger add tip with the amount directly
                if (!order) return prev;
                const amt = amount;
                setAddingTip(true);
                api.post(`/orders/${order.id}/add-tip`, {
                    tip_amount: amt,
                    order_id: order.id,
                }).then(() => {
                    Alert.alert("Success", `₹${amt} tip added!`);
                    setShowTipInput(false);
                    setTipAmount("");
                    fetchOrder();
                }).catch((error: any) => {
                    Alert.alert("Error", error.response?.data?.detail || "Failed to add tip");
                }).finally(() => {
                    setAddingTip(false);
                });
                return prev;
            });
        }, 100);
    }, [order?.id, fetchOrder]);

    const handleSubmitRating = useCallback(async () => {
        if (!order || rating === 0) {
            Alert.alert("Error", "Please select a rating");
            return;
        }

        setSubmittingRating(true);
        try {
            await api.post(`/orders/${order.id}/rate`, {
                rating,
                review: review.trim() || undefined,
                order_id: order.id,
            });
            Alert.alert("Thank You!", "Your rating has been submitted");
            setShowRating(false);
            await fetchOrder();
        } catch (error: any) {
            Alert.alert("Error", error.response?.data?.detail || "Failed to submit rating");
        } finally {
            setSubmittingRating(false);
        }
    }, [order?.id, rating, review, fetchOrder]);

    const handleCallPartner = useCallback(() => {
        if (order?.delivery_partner?.phone) {
            Linking.openURL(`tel:${order.delivery_partner.phone}`).catch(err => {
                if (__DEV__) console.error('Error opening dialer:', err);
            });
        }
    }, [order?.delivery_partner?.phone]);

    // --- Loading / Empty states ---

    if (loading) {
        return (
            <SafeView className="flex-1 bg-white items-center justify-center">
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text className="mt-4 text-gray-500">Loading order...</Text>
            </SafeView>
        );
    }

    if (!order) {
        return (
            <SafeView className="flex-1 bg-white items-center justify-center px-6">
                <Ionicons name="receipt-outline" size={80} color="#D1D5DB" />
                <Text className="text-2xl font-bold text-gray-900 mt-6">No Active Orders</Text>
                <Text className="text-gray-500 text-center mt-2">
                    You don't have any active orders at the moment
                </Text>
                <Pressable onPress={() => router.back()} className="bg-primary px-8 py-4 rounded-xl mt-6">
                    <Text className="text-white font-bold">Start Shopping</Text>
                </Pressable>
            </SafeView>
        );
    }

    // --- Derived values ---

    const currentStepIndex = STATUS_STEPS.findIndex(s => s.key === order.order_status.toLowerCase());
    const currentStepConfig = STATUS_STEPS[currentStepIndex] || STATUS_STEPS[0];
    const canAddTip = ["assigned", "out_for_delivery"].includes(order.order_status) && !order.tip_amount;

    return (
        <SafeView className="flex-1 bg-gray-50">
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View className="bg-white px-4 py-4 border-b border-gray-100">
                    <View className="flex-row items-center justify-between">
                        <Pressable onPress={() => router.back()} className="p-2 rounded-full bg-gray-100">
                            <Ionicons name="arrow-back" size={22} color="#111" />
                        </Pressable>
                        <Text className="text-lg font-bold">Track Order</Text>
                        <View className="w-10" />
                    </View>
                </View>

                {/* Live Status Banner */}
                <View className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-6">
                    <View className="flex-row items-center justify-between mb-3">
                        <View className="flex-row items-center flex-1">
                            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                                <View className="bg-white/20 p-3 rounded-full">
                                    <Ionicons name={currentStepConfig.icon as any} size={24} color="black" />
                                </View>
                            </Animated.View>
                            <View className="ml-3 flex-1">
                                <Text className="text-black/80 text-xs font-medium">Order Status</Text>
                                <Text className="text-black text-xl font-bold">{currentStepConfig.label}</Text>
                            </View>
                        </View>

                        <CountdownTimer countdown={countdown} timerStatus={timerStatus} />
                    </View>

                    <Text className="text-black/90 text-sm">{order.status_message}</Text>
                    <OvertimeWarning visible={timerStatus === "overtime"} />
                </View>

                {/* Progress Tracker */}
                <OrderStatusStepper currentStatus={order.order_status} progressAnim={progressAnim} />

                {/* Delivery Partner Card */}
                {order.delivery_partner && (
                    <View className="bg-white px-6 py-5 mb-4">
                        <Text className="font-bold text-gray-900 mb-4">Delivery Partner</Text>
                        <View className="flex-row items-center">
                            <View className="bg-blue-100 w-14 h-14 rounded-full items-center justify-center">
                                <Ionicons name="person" size={28} color="#3B82F6" />
                            </View>
                            <View className="flex-1 ml-4">
                                <Text className="font-bold text-gray-900 text-lg">
                                    {order.delivery_partner.name}
                                </Text>
                                <View className="flex-row items-center mt-1">
                                    <Ionicons name="star" size={14} color="#FACC15" />
                                    <Text className="text-gray-600 text-sm ml-1">
                                        {order.delivery_partner.rating.toFixed(1)} • {order.delivery_partner.deliveries} deliveries
                                    </Text>
                                </View>
                            </View>
                            <Pressable onPress={handleCallPartner} className="bg-green-500 p-3 rounded-full">
                                <Ionicons name="call" size={20} color="white" />
                            </Pressable>
                        </View>
                    </View>
                )}

                {/* Tip Section */}
                <TipSection
                    canAddTip={canAddTip}
                    tipAmount={order.tip_amount}
                    inputValue={tipAmount}
                    showInput={showTipInput}
                    adding={addingTip}
                    onSetInputValue={setTipAmount}
                    onSetShowInput={setShowTipInput}
                    onQuickTip={handleQuickTip}
                    onSubmitTip={handleAddTip}
                />

                {/* Order Items */}
                <OrderDetailsSection items={order.items} />

                {/* Delivery Address */}
                <View className="bg-white px-6 py-5 mb-4">
                    <Text className="font-bold text-gray-900 mb-3">Delivery Address</Text>
                    <View className="flex-row items-start">
                        <Ionicons name="location" size={20} color="#3B82F6" />
                        <View className="flex-1 ml-3">
                            <Text className="text-gray-900 font-medium">
                                {order.delivery_address?.label || "Home"}
                            </Text>
                            <Text className="text-gray-600 text-sm mt-1">
                                {order.delivery_address?.street}, {order.delivery_address?.city}
                            </Text>
                            <Text className="text-gray-600 text-sm">
                                {order.delivery_address?.state} - {order.delivery_address?.pincode}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Order Summary */}
                <View className="bg-white px-6 py-5 mb-20">
                    <Text className="font-bold text-gray-900 mb-4">Order Summary</Text>
                    <View>
                        <View className="flex-row justify-between mb-2">
                            <Text className="text-gray-600">Order ID</Text>
                            <Text className="text-gray-900 font-mono text-sm">
                                #{order.id.slice(-8).toUpperCase()}
                            </Text>
                        </View>
                        {!!order.tip_amount && order.tip_amount > 0 && (
                            <View className="flex-row justify-between mb-2">
                                <Text className="text-gray-600">Tip</Text>
                                <Text className="text-green-600 font-semibold">₹{order.tip_amount}</Text>
                            </View>
                        )}
                        <View className="flex-row justify-between pt-3 mt-2 border-t border-gray-200">
                            <Text className="text-gray-900 font-bold text-lg">Total</Text>
                            <Text className="text-blue-600 font-bold text-xl">₹{order.total_amount}</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Rating Modal */}
            <RatingModal
                visible={showRating}
                rating={rating}
                review={review}
                submitting={submittingRating}
                onSetRating={setRating}
                onSetReview={setReview}
                onSubmit={handleSubmitRating}
                onSkip={() => setShowRating(false)}
            />
        </SafeView>
    );
}
