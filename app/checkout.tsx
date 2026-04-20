import AddressSection from "@/components/Checkout/AddressSection";
import ItemsList from "@/components/Checkout/ItemsList";
import OrderSummary from "@/components/Checkout/OrderSummary";
import PromoCodeSection, { AppliedPromo } from "@/components/Checkout/PromoCodeSection";
import TipSection from "@/components/Checkout/TipSection";
import SafeView from "@/components/SafeView";
import TitleBar from "@/components/TitleBar";
import { selectCartItems, selectCartSubtotal } from "@/slices/cartSelectors";
import { clearCartLocal } from "@/slices/cartSlice";
import { clearCheckoutAddress } from "@/slices/checkoutAddressSlice";
import { RootState } from "@/store/store";
import { selectDefaultAddress } from "@/utils/addressSelector";
import api from "@/utils/client";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Animated, Pressable, ScrollView, Text, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";

interface CreateDraftOrderResponse {
    draft_order_id: string;
    signature: string;
    total_amount: number;
    subtotal: number;
    delivery_fee: number;
    app_fee: number;
    tip_amount: number;
    discount: number;
    expires_at: string;
}

export default function CheckoutScreen() {
    const router = useRouter();
    const dispatch = useDispatch();

    const cartItems = useSelector(selectCartItems);
    const subtotal = useSelector(selectCartSubtotal);
    const defaultAddress = useSelector(selectDefaultAddress);
    const checkoutSelectedAddress = useSelector((state: RootState) => state.checkoutAddress.selectedAddress);
    const deliveryAddress = checkoutSelectedAddress ?? defaultAddress;

    const [tip, setTip] = useState(0);
    const [promo, setPromo] = useState("");
    const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null);
    const [discount, setDiscount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState<"cod" | "online">("cod");
    const [isProcessing, setIsProcessing] = useState(false);
    const [estimateLoading, setEstimateLoading] = useState(true);

    const [backendSubtotal, setBackendSubtotal] = useState(0);
    const [backendDeliveryFee, setBackendDeliveryFee] = useState(0);
    const [backendAppFee, setBackendAppFee] = useState(0);
    const [backendDiscount, setBackendDiscount] = useState(0);
    const [backendTotal, setBackendTotal] = useState(0);
    const [showSuccess, setShowSuccess] = useState(false);
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const estimateDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

    const buildOrderItems = useCallback(() => {
        const items = cartItems.map(item => {
            try {
                if (item.serviceType === "product") {
                    if (!item.id) {
                        if (__DEV__) console.error("Product missing ID:", item);
                        return null;
                    }
                    return {
                        type: "product",
                        product_id: item.id,
                        quantity: item.quantity || 1,
                        ...((item as any).user_custom_image && { user_custom_image: (item as any).user_custom_image }),
                    };
                }

                else if (item.serviceType === "porter") {
                    const details = item.serviceDetails;
                    if (!details?.pickupAddress?._id || !details?.deliveryAddress?._id) {
                        if (__DEV__) console.error("Porter missing address:", item);
                        return null;
                    }

                    return {
                        type: "porter",
                        service_data: {
                            pickup_address: details.pickupAddress,
                            delivery_address: details.deliveryAddress,
                            dimensions: details.dimensions || null,
                            weight_category: details.weight || "medium",
                            phone: details.phone || "",
                            recipient_name: details.recipientName || "",
                            estimated_distance: parseFloat(String(details.distance || 0)),
                            notes: details.notes || "",
                            is_urgent: details.isUrgent || false,
                        },
                    };
                }

                else if (item.serviceType === "printout") {
                    const details = item.serviceDetails;

                    if (__DEV__) {
                        console.log("=== Processing Printout Item ===");
                        console.log("Service Details:", details);
                        console.log("Print Type:", details?.printType);
                    }

                    // Check if it's a photo or document print
                    const isPhotorint = details?.printType === 'photo';

                    if (isPhotorint) {
                        // Photo printing validation
                        if (!details?.photoSize || !details?.copies) {
                            if (__DEV__) console.error("Photo print missing required fields:", {
                                photoSize: details?.photoSize,
                                copies: details?.copies,
                            });
                            return null;
                        }

                        // Calculate pages for photos (1 photo = 1 page)
                        const numberOfPhotos = details?.photos?.length || 1;

                        return {
                            type: "printout",
                            service_data: {
                                print_type: "photo",
                                copies: parseInt(String(details.copies)) || 1,
                                pages: numberOfPhotos, // Number of photos
                                color: true, // Photos are always color
                                paper_size: details.photoSize, // Passport, 4x6, 5x7
                                notes: details.notes || "",
                                photo_urls: details.photos?.map((p: any) => p.cloudUrl).filter(Boolean) || [],
                            },
                        };
                    } else {
                        // Document printing validation
                        if (!details?.numberOfPages || !details?.copies) {
                            if (__DEV__) console.error("Document print missing required fields:", {
                                numberOfPages: details?.numberOfPages,
                                copies: details?.copies,
                            });
                            return null;
                        }

                        return {
                            type: "printout",
                            service_data: {
                                print_type: "document",
                                copies: parseInt(String(details.copies)) || 1,
                                pages: parseInt(String(details.numberOfPages)) || 1,
                                color: Boolean(details.colorPrinting),
                                paper_size: details.paperSize || "A4",
                                notes: details.notes || "",
                                document_urls: details.documents?.map((d: any) => d.cloudUrl).filter(Boolean) || [],
                            },
                        };
                    }
                }

                return null;

            } catch (error) {
                if (__DEV__) console.error("Error building order item:", error, item);
                return null;
            }
        });

        const validItems = items.filter(Boolean);

        if (__DEV__) {
            console.log(`Built ${validItems.length} valid items out of ${cartItems.length} cart items`);
        }

        if (validItems.length === 0) {
            if (__DEV__) console.error("No valid items. Cart:", cartItems);
            throw new Error("No valid items to order");
        }

        return validItems;
    }, [cartItems]);

    const fetchEstimate = useCallback(async () => {
        if (cartItems.length === 0) return;
        try {
            setEstimateLoading(true);
            const items = buildOrderItems();
            const res = await api.post("/orders/estimate", {
                items,
                delivery_address: deliveryAddress,
                tip_amount: tip,
                promo_code: appliedPromo?.code || null,
            });
            const d = res.data;
            setBackendSubtotal(d.subtotal);
            setBackendDeliveryFee(d.delivery_fee);
            setBackendAppFee(d.app_fee);
            setBackendDiscount(d.discount);
            setBackendTotal(d.total_amount);
        } catch (e: any) {
            if (__DEV__) console.error("Estimate error:", e?.response?.data || e.message);
        } finally {
            setEstimateLoading(false);
        }
    }, [buildOrderItems, deliveryAddress, tip, appliedPromo]);

    // Fetch estimate on mount and when tip/promo changes
    useEffect(() => {
        if (estimateDebounce.current) clearTimeout(estimateDebounce.current);
        estimateDebounce.current = setTimeout(fetchEstimate, 300);
        return () => {
            if (estimateDebounce.current) clearTimeout(estimateDebounce.current);
        };
    }, [fetchEstimate]);

    const displaySubtotal = backendSubtotal;
    const displayDeliveryFee = backendDeliveryFee;
    const displayAppFee = backendAppFee;
    const displayDiscount = backendDiscount;
    const displayTotal = Math.round(backendTotal * 100) / 100;

    const validateOrder = (): string | null => {
        if (!deliveryAddress) {
            return "Please select a delivery address";
        }

        if (cartItems.length === 0) {
            return "Your cart is empty";
        }

        if (backendTotal <= 0 && !cartItems.some(item => item.serviceType === 'porter' || item.serviceType === 'printout')) {
            return "Invalid cart amount";
        }

        if (displayTotal <= 0 || displayTotal > 100000) {
            return "Invalid order amount";
        }

        const invalidItems = cartItems.filter(item => {
            if (item.serviceType === 'porter' || item.serviceType === 'printout') {
                return !item.id || !item.selling_price || item.selling_price < 0;
            }
            return !item.id || !item.selling_price || item.selling_price < 0 || item.quantity <= 0;
        });

        if (invalidItems.length > 0) {
            return "Some items in your cart are invalid";
        }

        return null;
    };

    // Handle success navigation safely
    useEffect(() => {
        let timer: any;
        if (showSuccess) {
            // Start animation
            scaleAnim.setValue(0);
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 5,
                tension: 40,
                useNativeDriver: true,
            }).start();

            timer = setTimeout(() => {
                setShowSuccess(false);
                // navigate to home or history instead of back? 
                // Original code was router.back(), but generally after checkout one goes to Home or Order Details.
                // Keeping router.replace("./") logic from confirmOrder which was seemingly unused due to this effect?
                // Wait, confirmOrder calls router.replace("./") AND sets showSuccess(true).
                // If confirmOrder calls replace("./"), this component might unmount before the animation finishes or shows?
                // Actually confirmOrder:
                // 263:                 setShowSuccess(true);
                // 264:                 router.replace("./");
                // If it replaces the route, this component unmounts. showSuccess won't be visible.
                // The logical flow should be: calculate -> confirm -> show success -> wait -> navigate.

                // Let's fix the confirmOrder flow too if it's broken, but first let's stick to the prompt: animation.
                // However, I noticed line 264: router.replace("./"); inside confirmOrder. 
                // If that happens immediately, the user won't see the success modal in THIS component.
                // I should probably remove the router.replace("./") from confirmOrder and let this useEffect handle the navigation after the delay.

                router.replace("/");
            }, 2000);
        }
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [showSuccess]);

    const confirmOrder = async (
        draftOrderId: string,
        signature: string,
        payment: "cod" | "online"
    ) => {
        try {
            const response = await api.post("/orders/confirm", {
                draft_order_id: draftOrderId,
                signature,
                payment_method: payment,
            });

            if (response.data) {
                dispatch(clearCartLocal("user"));
                dispatch(clearCartLocal("guest"));
                dispatch(clearCheckoutAddress());

                setShowSuccess(true);
                // Removed router.replace here to allow the success modal to show
            }
        } catch (error) {
            throw error;
        }
    };

    const handlePlaceOrder = async () => {
        const validationError = validateOrder();
        if (validationError) {
            Alert.alert("Error", validationError);
            return;
        }

        if (isProcessing) {
            return;
        }

        setIsProcessing(true);

        try {
            const orderPayload = {
                items: buildOrderItems(),
                delivery_address: deliveryAddress,
                tip_amount: tip,
                promo_code: appliedPromo?.code || null,
            };

            if (__DEV__) console.log("Sending order payload:", JSON.stringify(orderPayload, null, 2));

            const draftResponse = await api.post<CreateDraftOrderResponse>(
                "/orders/draft",
                orderPayload
            );

            const {
                draft_order_id,
                signature,
                total_amount,
                subtotal: serverSubtotal,
                delivery_fee,
                app_fee,
                tip_amount,
                discount: serverDiscount
            } = draftResponse.data;

            // Use backend values as source of truth
            setBackendSubtotal(serverSubtotal);
            setBackendDeliveryFee(delivery_fee);
            setBackendAppFee(app_fee);
            setBackendDiscount(serverDiscount);
            setBackendTotal(total_amount);
            if (tip_amount !== undefined) setTip(tip_amount);

            // Proceed with backend-verified total
            if (paymentMethod === "online") {
                Alert.alert(
                    "Payment Gateway",
                    "Online payment integration pending. Please use COD.",
                    [{ text: "OK" }]
                );
                setIsProcessing(false);
                return;
            }

            await confirmOrder(draft_order_id, signature, paymentMethod);

        } catch (error: any) {
            if (__DEV__) console.error("Order error:", error?.response?.data || error?.message);

            const errorMessage = error?.response?.data?.detail ||
                error?.message ||
                "Failed to place order. Please try again.";

            Alert.alert("Order Error", errorMessage);

            setBackendSubtotal(0);
            setBackendDeliveryFee(0);
            setBackendAppFee(0);
            setBackendDiscount(0);
            setBackendTotal(0);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <SafeView className="flex-1 bg-white">
            <TitleBar title="Checkout" subtitle="" />

            <ScrollView className="flex-1 px-4">
                <AddressSection defaultAddress={deliveryAddress} />
                <ItemsList cartItems={cartItems} />
                <TipSection tip={tip} setTip={setTip} />

                <PromoCodeSection
                    promo={promo}
                    setPromo={setPromo}
                    appliedPromo={appliedPromo}
                    setAppliedPromo={setAppliedPromo}
                    setDiscount={setDiscount}
                    orderAmount={subtotal}
                    cartVersion={cartItems.length + subtotal}
                />

                {/* Payment Method */}
                <View className="p-2 mt-4">
                    <Text className="font-bold mb-2">Payment Method</Text>
                    {["cod", "online"].map((method) => (
                        <Pressable
                            key={method}
                            onPress={() => setPaymentMethod(method as any)}
                            className={`p-4 rounded-xl mb-2 ${paymentMethod === method
                                ? "border-primary border"
                                : "border border-gray-200"
                                }`}
                        >
                            <Text>
                                {method === "cod" ? "Cash on Delivery" : "Online Payment"}
                            </Text>
                        </Pressable>
                    ))}
                </View>

                {estimateLoading ? (
                    <View className="p-4 mt-4 items-center">
                        <ActivityIndicator size="small" color="#3B82F6" />
                        <Text className="text-gray-400 mt-2 text-sm">Calculating pricing...</Text>
                    </View>
                ) : (
                    <OrderSummary
                        subtotal={displaySubtotal}
                        deliveryFeeAmount={displayDeliveryFee}
                        appFeeAmount={displayAppFee}
                        tip={tip}
                        discount={displayDiscount}
                        total={displayTotal}
                    />
                )}
            </ScrollView>

            <View className="absolute bottom-0 left-0 right-0 bg-white p-4 border-t">
                <Pressable
                    onPress={handlePlaceOrder}
                    disabled={isProcessing || estimateLoading}
                    className={`py-4 rounded-full items-center ${isProcessing || estimateLoading ? "bg-gray-400" : "bg-primary"
                        }`}
                >
                    <Text className="text-white font-bold text-lg">
                        {isProcessing ? "Processing..." : estimateLoading ? "Calculating..." : `Place Order • ₹${displayTotal.toFixed(2)}`}
                    </Text>
                </Pressable>
            </View>

            {/* Success Overlay */}
            {showSuccess && (
                <View className="absolute inset-0 z-50 bg-black/50 items-center justify-center">
                    <View className="bg-white p-8 rounded-3xl items-center shadow-xl w-64">
                        <Animated.View
                            style={{ transform: [{ scale: scaleAnim }] }}
                            className="bg-green-100 p-4 rounded-full mb-4"
                        >
                            <Ionicons name="checkmark" size={48} color="#10B981" />
                        </Animated.View>
                        <Text className="text-xl font-bold text-gray-900 mb-2">Order Placed!</Text>
                        <Text className="text-gray-500 text-center">Your order has been placed successfully.</Text>
                    </View>
                </View>
            )}
        </SafeView>
    );
}