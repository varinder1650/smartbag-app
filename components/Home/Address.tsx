import { selectDefaultAddress } from "@/utils/addressSelector";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSelector } from "react-redux";

export default function AddressChip() {
    const router = useRouter();
    const defaultAddress = useSelector(selectDefaultAddress);

    const renderAddressText = () => {
        if (!defaultAddress) return <Text className="font-medium text-gray-700 flex-shrink" numberOfLines={1}>Select address</Text>;
        
        const labelStr = defaultAddress.label ? defaultAddress.label.toUpperCase() : "";
        let remainingStr = "";
        
        if (defaultAddress.name) {
            remainingStr += `${defaultAddress.name}, `;
        }
        remainingStr += defaultAddress.street || "";

        return (
            <Text className="text-xs flex-shrink" numberOfLines={1}>
                {labelStr ? (
                    <>
                        <Text className="font-extrabold text-black">{labelStr}</Text>
                        <Text className="font-medium text-gray-700"> - {remainingStr}</Text>
                    </>
                ) : (
                    <Text className="font-medium text-gray-700">{remainingStr}</Text>
                )}
            </Text>
        );
    };

    return (
        <Pressable
            className="flex-col"
            onPress={() => router.push("/address")}
        >
            <Text className="text-gray-800 font-extrabold text-xs">
                Smartbag
            </Text>
            <View className="flex-row items-center">
                <Text className="text-black font-extrabold text-2xl">
                    30 minutes
                </Text>
            </View>
            <View className="flex-row items-center mt-1">
                {renderAddressText()}
                <Ionicons name="caret-down" size={12} color="#374151" style={{ marginLeft: 4 }} />
            </View>
        </Pressable>
    );
}
