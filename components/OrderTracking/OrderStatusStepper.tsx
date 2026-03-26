import { getStatusConfig, STATUS_STEPS } from "@/constants/statusConfig";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Animated, Text, View } from "react-native";

interface OrderStatusStepperProps {
    currentStatus: string;
    progressAnim: Animated.Value;
}

function OrderStatusStepper({ currentStatus, progressAnim }: OrderStatusStepperProps) {
    const currentStepIndex = STATUS_STEPS.indexOf(currentStatus.toLowerCase() as typeof STATUS_STEPS[number]);

    return (
        <View className="bg-white px-6 py-6 mb-4">
            <Text className="font-bold text-gray-900 mb-4">Order Progress</Text>

            {/* Progress Bar */}
            <View className="h-2 bg-gray-100 rounded-full mb-6 overflow-hidden">
                <Animated.View
                    style={{
                        width: progressAnim.interpolate({
                            inputRange: [0, 100],
                            outputRange: ['0%', '100%'],
                        }),
                    }}
                    className="h-full bg-blue-500 rounded-full"
                />
            </View>

            {/* Status Steps */}
            {STATUS_STEPS.map((stepKey, index) => {
                const config = getStatusConfig(stepKey);
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;

                return (
                    <View key={stepKey} className="flex-row items-start mb-4">
                        <View className="items-center mr-3">
                            <View
                                className={`w-10 h-10 rounded-full items-center justify-center ${isCompleted ? "bg-blue-500" : "bg-gray-200"}`}
                            >
                                <Ionicons
                                    name={config.icon as any}
                                    size={20}
                                    color={isCompleted ? "white" : "#9CA3AF"}
                                />
                            </View>
                            {index < STATUS_STEPS.length - 1 && (
                                <View
                                    className={`w-0.5 h-8 ${isCompleted ? "bg-blue-500" : "bg-gray-200"}`}
                                />
                            )}
                        </View>

                        <View className="flex-1 pt-2">
                            <Text
                                className={`font-semibold ${isCurrent
                                    ? "text-blue-600"
                                    : isCompleted
                                        ? "text-gray-900"
                                        : "text-gray-400"
                                    }`}
                            >
                                {config.label}
                            </Text>
                            {isCurrent && (
                                <Text className="text-blue-500 text-xs mt-1">
                                    In Progress...
                                </Text>
                            )}
                        </View>
                    </View>
                );
            })}
        </View>
    );
}

export default React.memo(OrderStatusStepper);
