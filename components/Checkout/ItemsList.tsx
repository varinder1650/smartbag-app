import { useCartActions } from "@/hooks/useCartActions";
import { CartItem } from "@/types/cart.types";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

function ProductItemRow({ item }: { item: any }) {
    const { quantity, increase, decrease } = useCartActions(item);

    if (quantity === 0) return null;

    return (
        <View className="flex-row justify-between items-start mb-4">
            {/* Left */}
            <View className="flex-1 pr-2">
                <Text className="text-gray-900 font-medium">
                    {item.name}
                </Text>

                {/* Quantity Controls */}
                <View className="flex-row items-center mt-2">
                    <Pressable
                        onPress={decrease}
                        className="bg-gray-100 w-8 h-8 rounded-full items-center justify-center border border-gray-200"
                    >
                        <Ionicons name="remove" size={18} color="#111" />
                    </Pressable>

                    <Text className="mx-4 font-semibold text-base">{quantity}</Text>

                    <Pressable
                        onPress={increase}
                        className="bg-primary w-8 h-8 rounded-full items-center justify-center"
                    >
                        <Ionicons name="add" size={18} color="white" />
                    </Pressable>
                </View>
            </View>

            {/* Right */}
            <Text className="font-semibold text-gray-900 mt-1">
                ₹{(item.selling_price * quantity).toFixed(2)}
            </Text>
        </View>
    );
}

export default function ItemsList({
    cartItems,
}: {
    cartItems: CartItem[]
}) {
    const getItemLabel = (item: CartItem) => {
        switch (item.serviceType) {
            case "porter":
                return `Porter Service`;
            case "printout":
                return `Printout Service`;
            default:
                return "Item";
        }
    };

    return (
        <View className="p-2 mt-4">
            <Text className="font-bold mb-3 text-base">Items</Text>

            {cartItems.map((item) => {
                if (item.serviceType === "product") {
                    return <ProductItemRow key={item.cartItemId || item.id} item={item} />;
                }

                return (
                    <View
                        key={item.cartItemId || item.id}
                        className="flex-row justify-between items-start mb-3"
                    >
                        {/* Left */}
                        <View className="flex-1 pr-2">
                            <Text className="text-gray-900 font-medium">
                                {getItemLabel(item)}
                            </Text>

                            {/* Extra service info */}
                            {item.serviceType === "printout" && (
                                <Text className="text-gray-500 text-xs mt-1">
                                    {(item as any).serviceDetails?.colorPrinting ? "Color" : "B/W"} •{" "}
                                    {(item as any).serviceDetails?.copies} copies
                                </Text>
                            )}
                        </View>

                        {/* Right */}
                        <Text className="font-semibold text-gray-900 mt-1">
                            ₹{item.selling_price}
                        </Text>
                    </View>
                );
            })}
        </View>
    );
}