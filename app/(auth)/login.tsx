import { googleLogin, login } from "@/slices/authSlice";
import { AppDispatch, RootState } from "@/store/store";
import { configureGoogleSignIn } from "@/utils/googleSignIn";
import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";

export default function Login() {
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const { error, isLoading } = useSelector((state: RootState) => state.auth);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [googleLoading, setGoogleLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Configure Google Sign-In on mount
    useEffect(() => {
        configureGoogleSignIn();
    }, []);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert("Error", "Please enter email and password");
            return;
        }

        dispatch(login({ email, password }));
    };

    const handleGoogleLogin = async () => {
        if (googleLoading) return;

        setGoogleLoading(true);
        try {
            const result = await dispatch(googleLogin()).unwrap();

            // Success - navigation is handled by root layout based on requirePhone
            if (__DEV__) console.log('Google login successful:', result);
        } catch (error: any) {
            Alert.alert(
                "Google Sign In Failed",
                error || 'Failed to sign in with Google. Please try again.',
                [{ text: "OK" }]
            );
        } finally {
            setGoogleLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            className="flex-1 bg-white"
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <ScrollView
                className="flex-1 px-6"
                contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
            >
                <View className="flex-1 justify-center">
                    {/* App Logo */}
                    <Image
                        className="w-52 h-52 mx-auto mb-6"
                        source={require('../../assets/images/icon.png')}
                        resizeMode="contain"
                    />

                    {/* Heading */}
                    <Text className="text-3xl font-extrabold text-gray-900 mb-2 text-center">
                        Welcome Back
                    </Text>
                    <Text className="text-gray-500 text-center mb-6">
                        Login to your account to continue
                    </Text>

                    {/* Error Message */}
                    {error && (
                        <View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                            <Text className="text-red-700 text-center">{error}</Text>
                        </View>
                    )}

                    {/* Email Input */}
                    <TextInput
                        placeholder="Email"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                        className="border border-gray-300 rounded-xl px-4 py-3 mb-4 text-gray-900"
                        placeholderTextColor="#9CA3AF"
                    />

                    {/* Password Input */}
                    <View className="relative mb-6">
                        <TextInput
                            placeholder="Password"
                            secureTextEntry={!showPassword}
                            value={password}
                            onChangeText={setPassword}
                            className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900 pr-12"
                            placeholderTextColor="#9CA3AF"
                        />
                        <Pressable
                            onPress={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-3"
                        >
                            <Ionicons
                                name={showPassword ? "eye-off-outline" : "eye-outline"}
                                size={24}
                                color="#9CA3AF"
                            />
                        </Pressable>
                    </View>

                    {/* Login Button */}
                    <Pressable
                        onPress={handleLogin}
                        disabled={isLoading || googleLoading}
                        className={`py-4 rounded-xl shadow-lg ${isLoading || googleLoading ? 'bg-gray-400' : 'bg-primary'
                            }`}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text className="text-white text-center font-bold text-lg">
                                Login
                            </Text>
                        )}
                    </Pressable>

                    {/* Forgot Password */}
                    <View className="flex-row justify-center mt-4">
                        <Link href="/forgot-password" className="text-primary font-semibold">
                            Forgot Password?
                        </Link>
                    </View>

                    {/* Divider */}
                    <View className="flex-row items-center my-6">
                        <View className="flex-1 h-px bg-gray-300" />
                        <Text className="mx-4 text-gray-500 font-medium">OR</Text>
                        <View className="flex-1 h-px bg-gray-300" />
                    </View>

                    {/* Google Sign-In Button */}
                    <Pressable
                        onPress={handleGoogleLogin}
                        disabled={googleLoading || isLoading}
                        className={`flex-row items-center justify-center border border-gray-300 py-4 rounded-xl bg-white shadow-sm ${googleLoading || isLoading ? 'opacity-50' : ''
                            }`}
                    >
                        {googleLoading ? (
                            <ActivityIndicator color="#4285F4" />
                        ) : (
                            <>
                                <Ionicons name="logo-google" size={24} color="#4285F4" />
                                <Text className="ml-3 text-gray-700 font-semibold text-lg">
                                    Continue with Google
                                </Text>
                            </>
                        )}
                    </Pressable>

                    {/* Signup Link */}
                    <View className="flex-row justify-center mt-6">
                        <Text className="text-gray-500">Don't have an account? </Text>
                        <Link href="/signup" className="text-primary font-semibold">
                            Sign up
                        </Link>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}