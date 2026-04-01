import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";

interface TipSectionProps {
    canAddTip: boolean;
    tipAmount?: number;
    inputValue: string;
    showInput: boolean;
    adding: boolean;
    onSetInputValue: (val: string) => void;
    onSetShowInput: (show: boolean) => void;
    onQuickTip: (amount: number) => void;
    onSubmitTip: () => void;
}

function TipSection({
    canAddTip,
    tipAmount,
    inputValue,
    showInput,
    adding,
    onSetInputValue,
    onSetShowInput,
    onQuickTip,
    onSubmitTip,
}: TipSectionProps) {
    return (
        <>
            {canAddTip && (
                <View className="bg-white px-6 py-5 mb-4">
                    <View className="flex-row items-center justify-between mb-3">
                        <View>
                            <Text className="font-bold text-gray-900">Add Tip</Text>
                            <Text className="text-gray-500 text-sm">
                                Appreciate your delivery partner
                            </Text>
                        </View>
                        <Ionicons name="heart" size={24} color="#EF4444" />
                    </View>

                    {!showInput ? (
                        <View className="flex-row gap-2">
                            {[20, 30, 50].map((amount) => (
                                <Pressable
                                    key={amount}
                                    onPress={() => onQuickTip(amount)}
                                    className="flex-1 bg-blue-50 py-3 rounded-xl border border-blue-200"
                                >
                                    <Text className="text-blue-600 font-bold text-center">
                                        ₹{amount}
                                    </Text>
                                </Pressable>
                            ))}
                            <Pressable
                                onPress={() => onSetShowInput(true)}
                                className="flex-1 bg-gray-50 py-3 rounded-xl border border-gray-200"
                            >
                                <Text className="text-gray-700 font-bold text-center">Custom</Text>
                            </Pressable>
                        </View>
                    ) : (
                        <View className="flex-row gap-2">
                            <TextInput
                                keyboardType="number-pad"
                                placeholder="Enter amount"
                                value={inputValue}
                                onChangeText={onSetInputValue}
                                className="flex-1 border border-gray-300 rounded-xl px-4 py-3"
                                maxLength={3}
                            />
                            <Pressable
                                onPress={onSubmitTip}
                                disabled={adding}
                                className="bg-blue-500 px-6 py-3 rounded-xl items-center justify-center"
                            >
                                {adding ? (
                                    <ActivityIndicator color="white" size="small" />
                                ) : (
                                    <Text className="text-white font-bold">Add</Text>
                                )}
                            </Pressable>
                            <Pressable
                                onPress={() => {
                                    onSetShowInput(false);
                                    onSetInputValue("");
                                }}
                                className="bg-gray-200 p-3 rounded-xl"
                            >
                                <Ionicons name="close" size={24} color="#6B7280" />
                            </Pressable>
                        </View>
                    )}
                </View>
            )}

            {/* Tip Added Badge */}
            {!!tipAmount && tipAmount > 0 && (
                <View className="bg-green-50 mx-6 px-4 py-3 rounded-xl mb-4 flex-row items-center">
                    <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                    <Text className="text-green-700 font-semibold ml-2">
                        Tip of ₹{tipAmount} added
                    </Text>
                </View>
            )}
        </>
    );
}

export default React.memo(TipSection);
