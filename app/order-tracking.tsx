import SafeView from "@/components/SafeView";
import api from "@/utils/client";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    Image,
    Linking,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";

interface DeliveryPartner {
    name: string;
    phone: string;
    rating: number;
    deliveries: number;
}

interface ProductOrderItem {
    type: "product";
    product: string;
    product_name?: string;
    product_image?: string[];
    quantity: number;
    price: number;
}

interface PorterOrderItem {
    type: "porter";
    service_data: {
        pickup_address: { street: string; city: string; state: string; pincode: string; mobile_number: string };
        delivery_address: { street: string; city: string; state: string; pincode: string; mobile_number: string };
        dimensions?: { length: string; width: string; height: string };
        weight_category: number | string;
        estimated_distance: number;
        estimated_cost?: number;
        notes?: string;
        is_urgent?: boolean;
    };
}

interface PrintoutOrderItem {
    type: "printout";
    service_data: {
        print_type: "document" | "photo";
        pages: number;
        copies: number;
        color: boolean;
        paper_size: string;
        notes?: string;
        document_urls?: string[];
        photo_urls?: string[];
    };
}

type OrderItem = ProductOrderItem | PorterOrderItem | PrintoutOrderItem;

interface ActiveOrder {
    id: string;
    order_status: string;
    status_message: string;
    items: OrderItem[];
    total_amount: number;
    delivery_address: any;
    delivery_partner?: DeliveryPartner;
    created_at: string;
    estimated_delivery_time?: number; // in minutes
    tip_amount?: number;
    rating?: number;
    review?: string;
    assigned_at?: string; // When partner was assigned
}

const STATUS_STEPS = [
    { key: "confirmed", label: "Confirmed", icon: "checkmark-circle" },
    { key: "preparing", label: "Preparing", icon: "restaurant" },
    { key: "assigning", label: "Finding Partner", icon: "search" },  // NEW
    { key: "assigned", label: "Assigned", icon: "person" },
    { key: "out_for_delivery", label: "On the Way", icon: "bicycle" },
    { key: "arrived", label: "Arrived", icon: "location" },
    { key: "delivered", label: "Delivered", icon: "checkmark-done" },
];

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

    // Countdown timer state (30 minutes)
    const [countdown, setCountdown] = useState<number | null>(null);
    const [timerStatus, setTimerStatus] = useState<"waiting" | "active" | "overtime" | "stopped">("waiting");

    // Animation
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;

    // Fetch order (either specific order by ID or active order)
    const fetchOrder = async () => {
        try {
            let response;

            if (params.orderId) {
                // Fetch specific order by ID
                console.log("Fetching order by ID:", params.orderId);
                response = await api.get<ActiveOrder>(`/orders/${params.orderId}`);
            } else {
                // Fetch active order
                console.log("Fetching active order");
                response = await api.get<ActiveOrder>("/orders/active");
                console.log("Active order:", response.data);
            }

            if (response.data) {
                setOrder(response.data);
                console.log("Order set:", order);
                // Show rating if delivered and not rated
                if (response.data.order_status === "delivered" && !response.data.rating) {
                    setShowRating(true);
                }
            } else {
                setOrder(null);
            }
        } catch (error: any) {
            console.error("Failed to fetch order:", error);

            // If order not found, show error
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
    };

    // Poll for updates every 10 seconds (only for active orders)
    useEffect(() => {
        fetchOrder();

        // Only poll if order is not delivered/cancelled
        if (!order || ["delivered", "cancelled"].includes(order.order_status)) {
            return;
        }

        const interval = setInterval(fetchOrder, 10000);
        return () => clearInterval(interval);
    }, [params.orderId, order?.order_status]);

    // Countdown Timer Logic (30 minutes from assignment)
    useEffect(() => {
        if (!order) return;

        // Timer only active after assignment and before delivery
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

        // Get assignment time (or created_at as fallback)
        const assignedTime = order.assigned_at
            ? new Date(order.assigned_at).getTime()
            : new Date(order.created_at).getTime();

        const THIRTY_MINUTES = 30 * 60 * 1000; // 30 minutes in milliseconds
        const targetTime = assignedTime + THIRTY_MINUTES;

        const timer = setInterval(() => {
            const now = Date.now();
            const remaining = targetTime - now;

            if (remaining <= 0) {
                // Timer expired
                setCountdown(0);
                setTimerStatus("overtime");
            } else {
                // Timer active
                const remainingSeconds = Math.floor(remaining / 1000);
                setCountdown(remainingSeconds);
                setTimerStatus("active");
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [order, order?.order_status, order?.assigned_at]);

    // Pulse animation for active status
    useEffect(() => {
        if (!order || order.order_status === "delivered") return;

        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [order?.order_status]);

    // Progress bar animation
    useEffect(() => {
        if (!order) return;

        const currentIndex = STATUS_STEPS.findIndex(s => s.key === order.order_status);
        const progress = ((currentIndex + 1) / STATUS_STEPS.length) * 100;

        Animated.timing(progressAnim, {
            toValue: progress,
            duration: 500,
            useNativeDriver: false, // Width animation needs false
        }).start();
    }, [order?.order_status]);

    const formatCountdown = (seconds: number | null) => {
        if (seconds === null) return "Waiting...";
        if (seconds <= 0) return "00:00";

        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getTimerColor = () => {
        if (timerStatus === "overtime") return "text-red-600";
        if (timerStatus === "active" && countdown !== null && countdown < 300) return "text-orange-600"; // Last 5 mins
        return "text-white";
    };

    const getTimerLabel = () => {
        if (timerStatus === "waiting") return "Waiting for Assignment";
        if (timerStatus === "stopped") return "Delivered";
        if (timerStatus === "overtime") return "Delivering Soon";
        return "Estimated Delivery";
    };

    const handleAddTip = async () => {
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
            const errorMsg = error.response?.data?.detail || "Failed to add tip";
            Alert.alert("Error", errorMsg);
        } finally {
            setAddingTip(false);
        }
    };

    const handleSubmitRating = async () => {
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
            const errorMsg = error.response?.data?.detail || "Failed to submit rating";
            Alert.alert("Error", errorMsg);
        } finally {
            setSubmittingRating(false);
        }
    };

    const handleCallPartner = () => {
        if (order?.delivery_partner?.phone) {
            const phoneNumber = `tel:${order.delivery_partner.phone}`;
            Linking.openURL(phoneNumber).catch(err =>
                console.error('Error opening dialer:', err)
            );
        }
    };

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
                <Text className="text-2xl font-bold text-gray-900 mt-6">
                    No Active Orders
                </Text>
                <Text className="text-gray-500 text-center mt-2">
                    You don't have any active orders at the moment
                </Text>
                <Pressable
                    onPress={() => router.back()}
                    className="bg-primary px-8 py-4 rounded-xl mt-6"
                >
                    <Text className="text-white font-bold">Start Shopping</Text>
                </Pressable>
            </SafeView>
        );
    }

    const currentStepIndex = STATUS_STEPS.findIndex(s => s.key === order.order_status.toLowerCase());
    const currentStepConfig = STATUS_STEPS[currentStepIndex] || STATUS_STEPS[0]; // Fallback to first step if unknown

    const canAddTip = ["assigned", "out_for_delivery"].includes(order.order_status) && !order.tip_amount;

    return (
        <SafeView className="flex-1 bg-gray-50">
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View className="bg-white px-4 py-4 border-b border-gray-100">
                    <View className="flex-row items-center justify-between">
                        <Pressable
                            onPress={() => router.back()}
                            className="p-2 rounded-full bg-gray-100"
                        >
                            <Ionicons name="arrow-back" size={22} color="#111" />
                        </Pressable>
                        <Text className="text-lg font-bold">Track Order</Text>
                        <View className="w-10" />
                    </View>
                </View>

                {/* Live Status Banner with Countdown */}
                <View className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-6">
                    <View className="flex-row items-center justify-between mb-3">
                        <View className="flex-row items-center flex-1">
                            <Animated.View
                                style={{
                                    transform: [{ scale: pulseAnim }],
                                }}
                            >
                                <View className="bg-white/20 p-3 rounded-full">
                                    <Ionicons
                                        name={currentStepConfig.icon as any}
                                        size={24}
                                        color="black"
                                    />
                                </View>
                            </Animated.View>
                            <View className="ml-3 flex-1">
                                <Text className="text-black/80 text-xs font-medium">
                                    Order Status
                                </Text>
                                <Text className="text-black text-xl font-bold">
                                    {currentStepConfig.label}
                                </Text>
                            </View>
                        </View>

                        {/* Countdown Timer */}
                        <View className="bg-white/20 px-3 py-2 rounded-lg items-center">
                            <Text className="text-black/80 text-xs">
                                {getTimerLabel()}
                            </Text>
                            <Text className={`text-black text-lg font-bold ${getTimerColor()}`}>
                                {timerStatus === "overtime"
                                    ? "Soon"
                                    : formatCountdown(countdown)
                                }
                            </Text>
                        </View>
                    </View>

                    <Text className="text-black/90 text-sm">
                        {order.status_message}
                    </Text>

                    {/* Overtime Warning */}
                    {timerStatus === "overtime" && (
                        <View className="bg-white/10 mt-3 px-3 py-2 rounded-lg flex-row items-center">
                            <Ionicons name="time-outline" size={16} color="black" />
                            <Text className="text-black/90 text-xs ml-2">
                                Taking a bit longer than expected. Delivering soon!
                            </Text>
                        </View>
                    )}
                </View>

                {/* Progress Tracker */}
                <View className="bg-white px-6 py-6 mb-4">
                    <Text className="font-bold text-gray-900 mb-4">Order Progress</Text>

                    {/* Progress Bar */}
                    <View className="h-2 bg-gray-100 rounded-full mb-6 overflow-hidden">
                        <Animated.View
                            style={{
                                width: progressAnim.interpolate({
                                    inputRange: [0, 100],
                                    outputRange: ['0%', '100%'],
                                }),
                            }}
                            className="h-full bg-blue-500 rounded-full"
                        />
                    </View>

                    {/* Status Steps */}
                    {STATUS_STEPS.map((step, index) => {
                        const isCompleted = index <= currentStepIndex;
                        const isCurrent = index === currentStepIndex;

                        return (
                            <View key={step.key} className="flex-row items-start mb-4">
                                <View className="items-center mr-3">
                                    <View
                                        className={`w-10 h-10 rounded-full items-center justify-center ${isCompleted ? "bg-blue-500" : "bg-gray-200"
                                            }`}
                                    >
                                        <Ionicons
                                            name={step.icon as any}
                                            size={20}
                                            color={isCompleted ? "white" : "#9CA3AF"}
                                        />
                                    </View>
                                    {index < STATUS_STEPS.length - 1 && (
                                        <View
                                            className={`w-0.5 h-8 ${isCompleted ? "bg-blue-500" : "bg-gray-200"
                                                }`}
                                        />
                                    )}
                                </View>

                                <View className="flex-1 pt-2">
                                    <Text
                                        className={`font-semibold ${isCurrent
                                            ? "text-blue-600"
                                            : isCompleted
                                                ? "text-gray-900"
                                                : "text-gray-400"
                                            }`}
                                    >
                                        {step.label}
                                    </Text>
                                    {isCurrent && (
                                        <Text className="text-blue-500 text-xs mt-1">
                                            In Progress...
                                        </Text>
                                    )}
                                </View>
                            </View>
                        );
                    })}
                </View>

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

                            <Pressable
                                onPress={handleCallPartner}
                                className="bg-green-500 p-3 rounded-full"
                            >
                                <Ionicons name="call" size={20} color="white" />
                            </Pressable>
                        </View>
                    </View>
                )}

                {/* Add Tip Section */}
                {canAddTip && (
                    <View className="bg-white px-6 py-5 mb-4">
                        <View className="flex-row items-center justify-between mb-3">
                            <View>
                                <Text className="font-bold text-gray-900">Add Tip</Text>
                                <Text className="text-gray-500 text-sm">
                                    Appreciate your delivery partner
                                </Text>
                            </View>
                            <Ionicons name="heart" size={24} color="#EF4444" />
                        </View>

                        {!showTipInput ? (
                            <View className="flex-row gap-2">
                                {[20, 30, 50].map((amount) => (
                                    <Pressable
                                        key={amount}
                                        onPress={() => {
                                            setTipAmount(amount.toString());
                                            setTimeout(() => handleAddTip(), 100);
                                        }}
                                        className="flex-1 bg-blue-50 py-3 rounded-xl border border-blue-200"
                                    >
                                        <Text className="text-blue-600 font-bold text-center">
                                            ₹{amount}
                                        </Text>
                                    </Pressable>
                                ))}
                                <Pressable
                                    onPress={() => setShowTipInput(true)}
                                    className="flex-1 bg-gray-50 py-3 rounded-xl border border-gray-200"
                                >
                                    <Text className="text-gray-700 font-bold text-center">
                                        Custom
                                    </Text>
                                </Pressable>
                            </View>
                        ) : (
                            <View className="flex-row gap-2">
                                <TextInput
                                    keyboardType="number-pad"
                                    placeholder="Enter amount"
                                    value={tipAmount}
                                    onChangeText={setTipAmount}
                                    className="flex-1 border border-gray-300 rounded-xl px-4 py-3"
                                    maxLength={3}
                                />
                                <Pressable
                                    onPress={handleAddTip}
                                    disabled={addingTip}
                                    className="bg-blue-500 px-6 py-3 rounded-xl items-center justify-center"
                                >
                                    {addingTip ? (
                                        <ActivityIndicator color="white" size="small" />
                                    ) : (
                                        <Text className="text-white font-bold">Add</Text>
                                    )}
                                </Pressable>
                                <Pressable
                                    onPress={() => {
                                        setShowTipInput(false);
                                        setTipAmount("");
                                    }}
                                    className="bg-gray-200 p-3 rounded-xl"
                                >
                                    <Ionicons name="close" size={24} color="#6B7280" />
                                </Pressable>
                            </View>
                        )}
                    </View>
                )}

                {/* Tip Added Badge */}
                {!!order.tip_amount && order.tip_amount > 0 && (
                    <View className="bg-green-50 mx-6 px-4 py-3 rounded-xl mb-4 flex-row items-center">
                        <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                        <Text className="text-green-700 font-semibold ml-2">
                            Tip of ₹{order.tip_amount} added
                        </Text>
                    </View>
                )}

                {/* Order Items */}
                <View className="bg-white px-6 py-5 mb-4">
                    <Text className="font-bold text-gray-900 mb-4">
                        Order Items ({order.items.length})
                    </Text>
                    {order.items.map((item, index) => {
                        // Product Item
                        if (item.type === 'product') {
                            return (
                                <View key={index} className="flex-row items-center mb-3 pb-3 border-b border-gray-100">
                                    {item.product_image?.[0] && typeof item.product_image[0] === 'string' && (
                                        <Image
                                            source={{ uri: item.product_image[0] }}
                                            className="w-16 h-16 rounded-lg"
                                            resizeMode="cover"
                                        />
                                    )}
                                    <View className="flex-1 ml-3">
                                        <Text className="font-semibold text-gray-900">
                                            {item.product_name || 'Product'}
                                        </Text>
                                        <Text className="text-gray-500 text-sm">
                                            Qty: {item.quantity} × ₹{item.price}
                                        </Text>
                                    </View>
                                    <Text className="font-bold text-gray-900">
                                        ₹{item.quantity * item.price}
                                    </Text>
                                </View>
                            );
                        }

                        // Porter Service Item
                        if (item.type === 'porter') {
                            const serviceData = item.service_data;
                            return (
                                <View key={index} className="bg-green-50 rounded-xl p-4 mb-3 border border-green-200">
                                    <View className="flex-row items-center mb-3">
                                        <View className="bg-green-500 w-12 h-12 rounded-full items-center justify-center">
                                            <Ionicons name="bicycle" size={24} color="white" />
                                        </View>
                                        <View className="flex-1 ml-3">
                                            <Text className="font-bold text-gray-900">
                                                Porter Delivery Service
                                            </Text>
                                            <Text className="text-green-700 text-sm font-semibold">
                                                ₹{serviceData?.estimated_cost || 0}
                                            </Text>
                                        </View>
                                        {serviceData?.is_urgent && (
                                            <View className="bg-red-500 px-2 py-1 rounded-full">
                                                <Text className="text-white text-xs font-bold">
                                                    URGENT
                                                </Text>
                                            </View>
                                        )}
                                    </View>

                                    {/* Pickup & Delivery */}
                                    <View className="bg-white rounded-lg p-3">
                                        <View className="flex-row items-start mb-3">
                                            <Ionicons name="location-outline" size={16} color="#10B981" />
                                            <View className="flex-1 ml-2">
                                                <Text className="text-gray-600 text-xs">Pickup</Text>
                                                <Text className="text-gray-900 text-sm">
                                                    {serviceData?.pickup_address?.street}, {serviceData?.pickup_address?.city}
                                                </Text>
                                            </View>
                                        </View>

                                        <View className="flex-row items-start mb-2">
                                            <Ionicons name="location" size={16} color="#10B981" />
                                            <View className="flex-1 ml-2">
                                                <Text className="text-gray-600 text-xs">Delivery</Text>
                                                <Text className="text-gray-900 text-sm">
                                                    {serviceData?.delivery_address?.street}, {serviceData?.delivery_address?.city}
                                                </Text>
                                            </View>
                                        </View>

                                        <View className="flex-row items-center pt-2 border-t border-gray-100">
                                            <Ionicons name="navigate" size={14} color="#6B7280" />
                                            <Text className="text-gray-600 text-sm ml-1">
                                                {serviceData?.estimated_distance || 0} km distance
                                            </Text>
                                        </View>

                                        {serviceData?.notes && (
                                            <View className="bg-gray-50 rounded p-2 mt-2">
                                                <Text className="text-gray-700 text-xs">
                                                    📝 {serviceData.notes}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            );
                        }

                        // Printout Service Item
                        if (item.type === 'printout') {
                            const serviceData = item.service_data;
                            const isPhoto = serviceData?.print_type === 'photo';

                            return (
                                <View key={index} className="bg-purple-50 rounded-xl p-4 mb-3 border border-purple-200">
                                    <View className="flex-row items-center mb-3">
                                        <View className="bg-purple-500 w-12 h-12 rounded-full items-center justify-center">
                                            <Ionicons
                                                name={isPhoto ? "images" : "document-text"}
                                                size={24}
                                                color="white"
                                            />
                                        </View>
                                        <View className="flex-1 ml-3">
                                            <Text className="font-bold text-gray-900">
                                                {isPhoto ? 'Photo Print' : 'Document Print'}
                                            </Text>
                                            <Text className="text-purple-700 text-sm font-semibold">
                                                {serviceData?.pages || 0} {isPhoto ? 'photos' : 'pages'} × {serviceData?.copies || 1} {serviceData?.copies === 1 ? 'copy' : 'copies'}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Print Details */}
                                    <View className="bg-white rounded-lg p-3">
                                        <View className="flex-row justify-between mb-2">
                                            <Text className="text-gray-600 text-sm">Paper Size</Text>
                                            <Text className="text-gray-900 text-sm font-semibold">
                                                {serviceData?.paper_size || 'A4'}
                                            </Text>
                                        </View>
                                        <View className="flex-row justify-between">
                                            <Text className="text-gray-600 text-sm">Color</Text>
                                            <Text className="text-gray-900 text-sm font-semibold">
                                                {serviceData?.color ? 'Yes' : 'B&W'}
                                            </Text>
                                        </View>
                                        {serviceData?.notes && (
                                            <View className="pt-2 mt-2 border-t border-gray-100">
                                                <Text className="text-gray-600 text-xs mb-1">Notes:</Text>
                                                <Text className="text-gray-700 text-sm">
                                                    {serviceData.notes}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            );
                        }

                        // Fallback
                        return null;
                    })}
                </View>

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
                            <Text className="text-blue-600 font-bold text-xl">
                                ₹{order.total_amount}
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Rating Modal */}
            {showRating && (
                <View className="absolute inset-0 bg-black/50 items-center justify-center px-6">
                    <View className="bg-white rounded-3xl p-6 w-full max-w-sm">
                        <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
                            Rate Your Experience
                        </Text>
                        <Text className="text-gray-500 text-center mb-6">
                            How was your delivery?
                        </Text>

                        {/* Star Rating */}
                        <View className="flex-row justify-center mb-6">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Pressable
                                    key={star}
                                    onPress={() => setRating(star)}
                                    className="mx-1"
                                >
                                    <Ionicons
                                        name={star <= rating ? "star" : "star-outline"}
                                        size={40}
                                        color={star <= rating ? "#FACC15" : "#D1D5DB"}
                                    />
                                </Pressable>
                            ))}
                        </View>

                        {/* Review Text */}
                        <TextInput
                            multiline
                            placeholder="Share your experience (optional)"
                            value={review}
                            onChangeText={setReview}
                            className="border border-gray-300 rounded-xl p-4 mb-4 h-24"
                            textAlignVertical="top"
                            maxLength={200}
                        />

                        {/* Buttons */}
                        <View className="flex-row gap-3">
                            <Pressable
                                onPress={() => setShowRating(false)}
                                className="flex-1 bg-gray-200 py-3 rounded-xl"
                            >
                                <Text className="text-gray-700 font-bold text-center">
                                    Skip
                                </Text>
                            </Pressable>
                            <Pressable
                                onPress={handleSubmitRating}
                                disabled={submittingRating || rating === 0}
                                className={`flex-1 py-3 rounded-xl ${submittingRating || rating === 0
                                    ? "bg-gray-300"
                                    : "bg-blue-500"
                                    }`}
                            >
                                {submittingRating ? (
                                    <ActivityIndicator color="white" size="small" />
                                ) : (
                                    <Text className="text-white font-bold text-center">
                                        Submit
                                    </Text>
                                )}
                            </Pressable>
                        </View>
                    </View>
                </View>
            )}
        </SafeView>
    );
}