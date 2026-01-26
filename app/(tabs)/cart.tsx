import { CartProductItem } from "@/components/cartProductItem";
import SafeView from "@/components/SafeView";
import { selectCartItems, selectCartSubtotal, selectCartTotal } from "@/slices/cartSelectors";
import { clearCartLocal, decreaseQty, syncClearCart } from "@/slices/cartSlice";
import { RootState } from "@/store/store";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";

export default function CartScreen() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const mode: "guest" | "user" = isAuthenticated ? "user" : "guest";
  const isLoading = useSelector((state: RootState) => state.cart.loading);

  const cartItems = useSelector(selectCartItems);
  const subtotal = useSelector(selectCartSubtotal);
  const totalItems = useSelector(selectCartTotal);

  // Separate products and services
  const { products, services } = useMemo(() => {
    const products = cartItems.filter(item => item.serviceType === 'product');
    const services = cartItems.filter(item => item.serviceType !== 'product');
    return { products, services };
  }, [cartItems]);

  const handleClearCart = () => {
    Alert.alert(
      "Clear Cart",
      "Are you sure you want to remove all items from your cart?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            if (isAuthenticated) {
              // For authenticated users, clear from backend
              dispatch(syncClearCart() as any);
            } else {
              // For guest users, clear locally
              dispatch(clearCartLocal(mode));
            }
            console.log("Cart cleared");
          }
        }
      ]
    );
  };

  return (
    <SafeView className="flex-1 bg-white">
      <View className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="bg-white px-4 py-4 border-b border-gray-200 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Pressable
              onPress={() => router.back()}
              className="p-2 rounded-full bg-gray-100 mr-3"
            >
              <Ionicons name="arrow-back" size={22} color="#111" />
            </Pressable>
            <Text className="text-xl font-bold">Shopping Cart</Text>
          </View>

          {cartItems.length > 0 && (
            <Pressable
              onPress={handleClearCart}
              disabled={isLoading}
            >
              <Text className={`font-medium ${isLoading ? 'text-gray-400' : 'text-red-500'}`}>
                {isLoading ? "Clearing..." : "Clear"}
              </Text>
            </Pressable>
          )}
        </View>

        {cartItems.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6">
            <Ionicons name="cart-outline" size={80} color="#9CA3AF" />
            <Text className="text-gray-900 text-2xl font-bold mt-6">
              Your cart is empty
            </Text>
            <Text className="text-gray-500 text-center mt-2 mb-8">
              Add items to get started with your order
            </Text>
            <Pressable
              onPress={() => router.back()}
              className="bg-primary px-8 py-4 rounded-xl"
            >
              <Text className="text-white font-bold text-lg">
                Start Shopping
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            <ScrollView className="flex-1 px-4 py-4">
              {/* Products Section */}
              {products.length > 0 && (
                <View className="mb-4">
                  <Text className="text-lg font-bold mb-3">Products</Text>
                  {products.map((item) => (
                    <CartProductItem key={item.id} item={item} />
                  ))}
                </View>
              )}

              {/* Services Section */}
              {services.length > 0 && (
                <View className="mb-4">
                  <Text className="text-lg font-bold mb-3">Services</Text>
                  {services.map((item) => {
                    const isPorter = item.serviceType === 'porter';
                    const isPrintout = item.serviceType === 'printout';

                    return (
                      <View
                        key={item.id}
                        className="bg-white rounded-xl p-4 mb-3"
                      >
                        {/* Service Header */}
                        <View className="flex-row items-center justify-between mb-3">
                          <View className="flex-row items-center">
                            <View className={`w-12 h-12 rounded-full items-center justify-center ${isPorter ? 'bg-green-100' : 'bg-purple-100'
                              }`}>
                              <Ionicons
                                name={isPorter ? 'bicycle' : 'print'}
                                size={24}
                                color={isPorter ? '#10B981' : '#8B5CF6'}
                              />
                            </View>
                            <View className="ml-3">
                              <Text className="font-bold text-gray-900">
                                {item.name}
                              </Text>
                              <Text className="text-primary font-bold text-lg">
                                ₹{item.selling_price || (item as any).price}
                              </Text>
                            </View>
                          </View>

                          {/* Remove Button */}
                          <Pressable
                            onPress={() => dispatch(decreaseQty({ id: item.id, mode }))}
                            className="bg-red-50 w-10 h-10 rounded-full items-center justify-center"
                          >
                            <Ionicons name="trash-outline" size={20} color="#EF4444" />
                          </Pressable>
                        </View>

                        {/* Service Details */}
                        {item.serviceType === 'porter' && item.serviceDetails && (
                          <View className="border-t border-gray-100 pt-3">
                            <View className="flex-row mb-2">
                              <Text className="text-gray-500 w-24">Pickup:</Text>
                              <Text className="flex-1 text-gray-900">
                                {item.serviceDetails.pickupAddress
                                  ? `${item.serviceDetails.pickupAddress.street}, ${item.serviceDetails.pickupAddress.city}`
                                  : "No pickup address"}
                              </Text>
                            </View>

                            <View className="flex-row mb-2">
                              <Text className="text-gray-500 w-24">Delivery:</Text>
                              <Text className="flex-1 text-gray-900">
                                {item.serviceDetails.deliveryAddress
                                  ? `${item.serviceDetails.deliveryAddress.street}, ${item.serviceDetails.deliveryAddress.city}`
                                  : "No delivery address"}
                              </Text>
                            </View>

                            <View className="flex-row">
                              <Text className="text-gray-500 w-24">Distance:</Text>
                              <Text className="text-gray-900">
                                {item.serviceDetails.distance} km
                              </Text>
                            </View>
                          </View>
                        )}

                        {item.serviceType === 'printout' && item.serviceDetails && (
                          <View className="border-t border-gray-100 pt-3">
                            <View className="flex-row mb-2">
                              <Text className="text-gray-500 w-32">Pages:</Text>
                              <Text className="text-gray-900">
                                {item.serviceDetails.numberOfPages} × {item.serviceDetails.copies} copies
                              </Text>
                            </View>

                            <View className="flex-row mb-2">
                              <Text className="text-gray-500 w-32">Type:</Text>
                              <Text className="text-gray-900">
                                {item.serviceDetails.colorPrinting ? 'Color' : 'Black & White'}
                              </Text>
                            </View>

                            <View className="flex-row">
                              <Text className="text-gray-500 w-32">Size:</Text>
                              <Text className="text-gray-900">
                                {item.serviceDetails.paperSize}
                              </Text>
                            </View>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </ScrollView>

            {/* Checkout Footer */}
            <View className="bg-white px-4 py-5 border-t border-gray-200">
              <View className="flex-row justify-between mb-4">
                <Text className="text-gray-600 text-lg">Subtotal</Text>
                <Text className="font-bold text-2xl">₹{subtotal.toFixed(2)}</Text>
              </View>

              <Pressable
                onPress={() => router.push('/checkout')}
                className="bg-primary py-4 rounded-full items-center"
                disabled={isLoading}
              >
                <Text className="text-white font-bold text-lg">
                  Proceed to Checkout ({totalItems} items)
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </View>
    </SafeView>
  );
}