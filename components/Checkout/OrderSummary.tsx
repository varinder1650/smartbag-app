import { Text, View } from "react-native";

export default function OrderSummary({
    subtotal,
    deliveryFeeAmount,
    appFeeAmount,
    tip,
    discount,
    total
}: {
    subtotal: number;
    deliveryFeeAmount: number;
    appFeeAmount: number;
    tip: number;
    discount: number;
    total: number;
}
) {
    const fmt = (n: number) => n.toFixed(2);

    return (
        <View className="p-2 mt-4 mb-32">
            <View className="flex-row justify-between mb-2">
                <Text>Subtotal</Text>
                <Text>₹{fmt(subtotal)}</Text>
            </View>
            <View className="flex-row justify-between mb-2">
                <Text>Delivery</Text>
                <Text>₹{fmt(deliveryFeeAmount)}</Text>
            </View>
            <View className="flex-row justify-between mb-2">
                <Text>App Fee</Text>
                <Text>₹{fmt(appFeeAmount)}</Text>
            </View>
            <View className="flex-row justify-between mb-2">
                <Text>Tip</Text>
                <Text>₹{fmt(tip)}</Text>
            </View>
            <View className="flex-row justify-between mb-2">
                <Text>Discount</Text>
                <Text>-₹{fmt(discount)}</Text>
            </View>
            <View className="flex-row justify-between border-t pt-2 mt-2">
                <Text className="font-bold">Total</Text>
                <Text className="font-bold">₹{fmt(total)}</Text>
            </View>
        </View>
    )
}