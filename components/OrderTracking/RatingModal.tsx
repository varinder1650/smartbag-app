import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";

interface RatingModalProps {
    visible: boolean;
    rating: number;
    review: string;
    submitting: boolean;
    onSetRating: (star: number) => void;
    onSetReview: (text: string) => void;
    onSubmit: () => void;
    onSkip: () => void;
}

function RatingModal({
    visible,
    rating,
    review,
    submitting,
    onSetRating,
    onSetReview,
    onSubmit,
    onSkip,
}: RatingModalProps) {
    if (!visible) return null;

    return (
        <View className="absolute inset-0 bg-black/50 items-center justify-center px-6">
            <View className="bg-white rounded-3xl p-6 w-full max-w-sm">
                <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
                    Rate Your Experience
                </Text>
                <Text className="text-gray-500 text-center mb-6">
                    How was your delivery?
                </Text>

                {/* Star Rating */}
                <View className="flex-row justify-center mb-6">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Pressable
                            key={star}
                            onPress={() => onSetRating(star)}
                            className="mx-1"
                        >
                            <Ionicons
                                name={star <= rating ? "star" : "star-outline"}
                                size={40}
                                color={star <= rating ? "#FACC15" : "#D1D5DB"}
                            />
                        </Pressable>
                    ))}
                </View>

                {/* Review Text */}
                <TextInput
                    multiline
                    placeholder="Share your experience (optional)"
                    value={review}
                    onChangeText={onSetReview}
                    className="border border-gray-300 rounded-xl p-4 mb-4 h-24"
                    textAlignVertical="top"
                    maxLength={200}
                />

                {/* Buttons */}
                <View className="flex-row gap-3">
                    <Pressable
                        onPress={onSkip}
                        className="flex-1 bg-gray-200 py-3 rounded-xl"
                    >
                        <Text className="text-gray-700 font-bold text-center">Skip</Text>
                    </Pressable>
                    <Pressable
                        onPress={onSubmit}
                        disabled={submitting || rating === 0}
                        className={`flex-1 py-3 rounded-xl ${submitting || rating === 0 ? "bg-gray-300" : "bg-blue-500"}`}
                    >
                        {submitting ? (
                            <ActivityIndicator color="white" size="small" />
                        ) : (
                            <Text className="text-white font-bold text-center">Submit</Text>
                        )}
                    </Pressable>
                </View>
            </View>
        </View>
    );
}

export default React.memo(RatingModal);
