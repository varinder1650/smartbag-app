import SafeView from "@/components/SafeView";
import api from "@/utils/client";
import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from "react-native";

interface SignupForm {
  name: string;
  email: string;
  password: string;
  phone: string;
}

export default function SignupScreen() {
  const [form, setForm] = useState<SignupForm>({
    name: "",
    email: "",
    password: "",
    phone: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<SignupForm>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<SignupForm> = {};

    // Name validation
    if (!form.name.trim()) {
      newErrors.name = "Name is required";
    } else if (form.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    } else if (form.name.trim().length > 100) {
      newErrors.name = "Name is too long";
    }

    // Email validation
    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Invalid email format";
    }

    // Password validation
    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (form.password.length > 128) {
      newErrors.password = "Password is too long";
    } else if (!/[A-Z]/.test(form.password)) {
      newErrors.password = "Password must contain at least one uppercase letter";
    } else if (!/[0-9]/.test(form.password)) {
      newErrors.password = "Password must contain at least one number";
    } else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password)) {
      newErrors.password = "Password must contain at least one special character";
    }

    // Phone validation (optional but if provided must be valid)
    if (form.phone && form.phone.length > 0) {
      const phoneDigits = form.phone.replace(/\D/g, '');
      if (phoneDigits.length < 10) {
        newErrors.phone = "Phone number must be at least 10 digits";
      } else if (phoneDigits.length > 10) {
        newErrors.phone = "Invalid Phone number";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    // Clear previous errors
    setErrors({});

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Prepare payload
      const payload = {
        name: form.name.trim(),
        email: form.email.toLowerCase().trim(),
        password: form.password,
        phone: form.phone.replace(/\D/g, '') || undefined,
        role: "customer",
      };

      if (__DEV__) console.log("Sending signup request for:", payload.email);

      // Call register endpoint
      const response = await api.post("/auth/register", payload);

      if (response.data.success) {
        // Registration successful, needs email verification
        Alert.alert(
          "Verification Required",
          response.data.message || "Please check your email for verification code",
          [
            {
              text: "OK",
              onPress: () => {
                // Navigate to OTP verification screen
                router.push({
                  pathname: "/(auth)/verify-email",
                  params: {
                    email: form.email.toLowerCase().trim(),
                    name: form.name.trim(),
                  }
                });
              }
            }
          ]
        );
      }
    } catch (error: any) {
      if (__DEV__) console.error("Signup error:", error.response?.data || error.message);

      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        "Failed to create account. Please try again.";

      Alert.alert("Registration Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (field: keyof SignupForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <SafeView className="flex-1 bg-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center px-6 py-8">
          {/* Header */}
          <View className="mb-8">
            <Text className="text-3xl font-extrabold text-gray-900 mb-2">
              Create Account
            </Text>
            <Text className="text-gray-500">
              Sign up to get started with SmartBag
            </Text>
          </View>

          {/* Name Input */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Full Name *
            </Text>
            <View className={`flex-row items-center border rounded-xl px-4 ${errors.name ? "border-red-500 bg-red-50" : "border-gray-200"
              }`}>
              <Ionicons name="person-outline" size={20} color="#9CA3AF" />
              <TextInput
                placeholder="Enter your full name"
                value={form.name}
                onChangeText={(text) => updateForm("name", text)}
                className="flex-1 py-3 px-3 text-gray-900"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="words"
                editable={!loading}
              />
            </View>
            {errors.name && (
              <Text className="text-red-500 text-xs mt-1 ml-1">
                {errors.name}
              </Text>
            )}
          </View>

          {/* Email Input */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Email Address *
            </Text>
            <View className={`flex-row items-center border rounded-xl px-4 ${errors.email ? "border-red-500 bg-red-50" : "border-gray-200"
              }`}>
              <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
              <TextInput
                placeholder="Enter your email"
                value={form.email}
                onChangeText={(text) => updateForm("email", text)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                className="flex-1 py-3 px-3 text-gray-900"
                placeholderTextColor="#9CA3AF"
                editable={!loading}
              />
            </View>
            {errors.email && (
              <Text className="text-red-500 text-xs mt-1 ml-1">
                {errors.email}
              </Text>
            )}
          </View>

          {/* Phone Input (Optional) */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Phone Number (Optional)
            </Text>
            <View className={`flex-row items-center border rounded-xl px-4 ${errors.phone ? "border-red-500 bg-red-50" : "border-gray-200"
              }`}>
              <Ionicons name="call-outline" size={20} color="#9CA3AF" />
              <TextInput
                placeholder="Enter your phone number"
                value={form.phone}
                onChangeText={(text) => updateForm("phone", text)}
                keyboardType="phone-pad"
                className="flex-1 py-3 px-3 text-gray-900"
                placeholderTextColor="#9CA3AF"
                maxLength={15}
                editable={!loading}
              />
            </View>
            {errors.phone && (
              <Text className="text-red-500 text-xs mt-1 ml-1">
                {errors.phone}
              </Text>
            )}
            <Text className="text-gray-400 text-xs mt-1 ml-1">
              You can add this later if you skip now
            </Text>
          </View>

          {/* Password Input */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Password *
            </Text>
            <View className={`flex-row items-center border rounded-xl px-4 ${errors.password ? "border-red-500 bg-red-50" : "border-gray-200"
              }`}>
              <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
              <TextInput
                placeholder="Create a password"
                value={form.password}
                onChangeText={(text) => updateForm("password", text)}
                secureTextEntry={!showPassword}
                className="flex-1 py-3 px-3 text-gray-900"
                placeholderTextColor="#9CA3AF"
                editable={!loading}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color="#9CA3AF"
                />
              </Pressable>
            </View>
            {errors.password && (
              <Text className="text-red-500 text-xs mt-1 ml-1">
                {errors.password}
              </Text>
            )}
            {!errors.password && (
              <Text className="text-gray-400 text-xs mt-1 ml-1">
                Must be at least 6 characters
              </Text>
            )}
          </View>

          {/* Sign Up Button */}
          <Pressable
            onPress={handleSignup}
            disabled={loading}
            className={`py-4 rounded-xl mb-6 ${loading ? "bg-gray-400" : "bg-primary"
              }`}
          >
            {loading ? (
              <View className="flex-row items-center justify-center">
                <ActivityIndicator color="white" />
                <Text className="text-white font-bold text-lg ml-2">
                  Creating Account...
                </Text>
              </View>
            ) : (
              <Text className="text-white text-center font-bold text-lg">
                Sign Up
              </Text>
            )}
          </Pressable>

          {/* Terms & Privacy */}
          <Text className="text-gray-500 text-xs text-center mb-6">
            By signing up, you agree to our{" "}
            <Text className="text-primary font-semibold">Terms of Service</Text>
            {" "}and{" "}
            <Text className="text-primary font-semibold">Privacy Policy</Text>
          </Text>

          {/* Login Link */}
          <View className="flex-row justify-center">
            <Text className="text-gray-500">Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <Pressable>
                <Text className="text-primary font-semibold">
                  Login
                </Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </ScrollView>
    </SafeView>
  );
}