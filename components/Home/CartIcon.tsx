import { selectCartTotal } from "@/slices/cartSelectors";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSelector } from "react-redux";

export default function CartIcon() {
    const router = useRouter();

    const totalItems = useSelector(selectCartTotal);

    return (
        <Pressable
            onPress={() => router.push("/cart")}
            className="relative w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
        >
            <Ionicons name="bag-outline" size={22} color="#111" />

            {totalItems > 0 && (
                <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[18px] h-[18px] items-center justify-center px-1">
                    <Text className="text-white text-xs font-bold">
                        {totalItems}
                    </Text>
                </View>
            )}
        </Pressable>
    );
}
