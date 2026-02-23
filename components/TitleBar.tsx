import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function TitleBar({ title, subtitle, rightAction }: { title: string, subtitle: string, rightAction?: React.ReactNode }) {
    const navigation = useNavigation();
    return (
        <View className="px-4 pt-4 mt-4">
            {/* Top Row */}
            <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                    <Pressable
                        onPress={() => navigation.goBack()}
                        className="bg-primary p-3 rounded-full w-12 h-12 items-center justify-center shadow"
                    >
                        <Ionicons name="arrow-back" size={22} color="white" />
                    </Pressable>

                    <Text className="text-2xl font-bold ml-4">
                        {title}
                    </Text>
                </View>

                {rightAction}
            </View>

            {/* Subtitle */}
            <Text className="text-gray-600 mt-2 ml-16">
                {subtitle}
            </Text>
        </View>
    );
}