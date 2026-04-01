import SafeView from "@/components/SafeView";
import TitleBar from "@/components/TitleBar";
import { updateProfile } from "@/slices/authSlice";
import { AppDispatch } from "@/store/store";
import { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";

export default function EditProfile() {
    const { user } = useSelector((state: any) => state.auth);
    const [name, setName] = useState(user?.name || "");
    const dispatch = useDispatch<AppDispatch>();

    const handleUpdateProfile = async () => {
        try {
            await dispatch(updateProfile(name)).unwrap();
            Alert.alert("Success", "Profile updated successfully");
        } catch {
            Alert.alert("Error", "Failed to update profile. Please try again.");
        }
    };

    return (
        <SafeView className="flex-1 bg-gray-50">
            <TitleBar title="Edit Profile" subtitle="" />

            <View className="px-4 mt-6">
                {/* Name */}
                <Text className="text-gray-600 text-xs mb-1">
                    Name
                </Text>
                <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter your name"
                    className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 mb-4"
                />

                {/* Email */}
                <Text className="text-gray-600 text-xs mb-1">
                    Email
                </Text>
                <TextInput
                    value={user?.email}
                    editable={false}
                    className="bg-gray-100 border border-gray-200 rounded-lg px-4 py-3 text-gray-500 mb-4"
                />

                {/* Phone */}
                <Text className="text-gray-600 text-xs mb-1">
                    Phone
                </Text>
                <TextInput
                    value={user?.phone}
                    editable={false}
                    className="bg-gray-100 border border-gray-200 rounded-lg px-4 py-3 text-gray-500 mb-6"
                />

                {/* Update Button */}
                <Pressable
                    onPress={handleUpdateProfile}
                    className="bg-primary py-4 rounded-lg items-center"
                >
                    <Text className="text-white font-bold text-sm">
                        Update Profile
                    </Text>
                </Pressable>
            </View>
        </SafeView>
    );
}