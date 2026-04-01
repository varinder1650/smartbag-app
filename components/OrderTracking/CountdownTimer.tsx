import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";

export type TimerStatus = "waiting" | "active" | "overtime" | "stopped";

interface CountdownTimerProps {
    countdown: number | null;
    timerStatus: TimerStatus;
    deliveredAt?: string | null;
}

function formatCountdown(seconds: number | null): string {
    if (seconds === null) return "Waiting...";
    if (seconds <= 0) return "00:00";

    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function getTimerColor(timerStatus: TimerStatus, countdown: number | null): string {
    if (timerStatus === "overtime") return "text-red-600";
    if (timerStatus === "active" && countdown !== null && countdown < 300) return "text-orange-600";
    return "text-black";
}

function getTimerLabel(timerStatus: TimerStatus): string {
    if (timerStatus === "waiting") return "Waiting for Assignment";
    if (timerStatus === "stopped") return "Delivered";
    if (timerStatus === "overtime") return "Delivering Soon";
    return "Estimated Delivery";
}

function formatDeliveredTime(dateStr?: string | null): string {
    if (!dateStr) return "Done";
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function CountdownTimer({ countdown, timerStatus, deliveredAt }: CountdownTimerProps) {
    return (
        <View className="bg-white/20 px-3 py-2 rounded-lg items-center">
            <Text className="text-black/80 text-xs">
                {getTimerLabel(timerStatus)}
            </Text>
            <Text className={`text-black text-lg font-bold ${getTimerColor(timerStatus, countdown)}`}>
                {timerStatus === "stopped"
                    ? formatDeliveredTime(deliveredAt)
                    : timerStatus === "overtime"
                        ? "Soon"
                        : formatCountdown(countdown)}
            </Text>
        </View>
    );
}

export function OvertimeWarning({ visible }: { visible: boolean }) {
    if (!visible) return null;

    return (
        <View className="bg-white/10 mt-3 px-3 py-2 rounded-lg flex-row items-center">
            <Ionicons name="time-outline" size={16} color="black" />
            <Text className="text-black/90 text-xs ml-2">
                Taking a bit longer than expected. Delivering soon!
            </Text>
        </View>
    );
}

export default React.memo(CountdownTimer);
