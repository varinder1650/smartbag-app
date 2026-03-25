import { deleteAddress, setDefaultAddress } from "@/slices/addressSlice";
import { setCheckoutAddress } from "@/slices/checkoutAddressSlice";
import { setDeliveryAddress, setPickupAddress } from "@/slices/porterAddressSlice";
import { useAppDispatch } from "@/store/hooks";
import { Address } from "@/types/address.types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

type Props = Address & {
    mode?: boolean;
    addressType?: "pickup" | "delivery" | "checkout";
    onEdit?: () => void;
};

export const AddressCard = ({
    _id,
    label,
    name,
    street,
    city,
    state,
    pincode,
    mobile_number,
    is_default,
    mode,
    addressType,
    onEdit,
}: Props) => {
    const dispatch = useAppDispatch();
    const router = useRouter();

    const fullAddress: Address = {
        _id,
        label,
        name,
        street,
        city,
        state,
        pincode,
        mobile_number,
        is_default,
    };

    const handlePress = () => {
        if (mode && addressType) {
            if (addressType === "pickup") {
                dispatch(setPickupAddress(fullAddress));
            } else if (addressType === "delivery") {
                dispatch(setDeliveryAddress(fullAddress));
            } else if (addressType === "checkout") {
                dispatch(setCheckoutAddress(fullAddress));
            }
            router.back();
            return;
        }

        if (!is_default) {
            dispatch(setDefaultAddress(_id));
        }
    };

    return (
        <Pressable
            onPress={handlePress}
            className={`mb-4 p-4 rounded-xl border ${is_default
                ? "border-primary bg-primary/5"
                : "border-gray-200 bg-white"
                }`}
        >
            {/* Header */}
            <View className="flex-row justify-between items-center">
                <View className="flex-row items-center">
                    <Text className="font-semibold text-gray-900">{label}</Text>
                    {name ? (
                        <Text className="text-gray-500 ml-2 text-sm">• {name}</Text>
                    ) : null}
                </View>

                <View className="flex-row gap-3">
                    <Pressable onPress={onEdit}>
                        <Ionicons name="create-outline" size={18} />
                    </Pressable>

                    <Pressable onPress={() => dispatch(deleteAddress(_id))}>
                        <Ionicons name="trash-outline" size={18} color="#DC2626" />
                    </Pressable>
                </View>
            </View>

            {/* Address */}
            <Text className="text-gray-600 mt-2 text-sm">
                {street}, {city}, {state} - {pincode}
            </Text>

            <View className="flex-row items-center mt-2">
                <Ionicons name="call-outline" size={14} color="#6B7280" />
                <Text className="ml-2 text-sm">{mobile_number}</Text>
            </View>
        </Pressable>
    );
};
