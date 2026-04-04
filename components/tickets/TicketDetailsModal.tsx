import api from "@/utils/client";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    Text,
    View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

type ChatMessage = {
    _id: string;
    message: string;
    sender_type: "user" | "admin";
    sender_name: string;
    created_at: string;
};

interface TicketDetailsModalProps {
    visible: boolean;
    onClose: () => void;
    ticket: { _id: string; subject: string; created_at: string; status: string; message?: string; orderId?: string } | null;
}

export default function TicketDetailsModal({ visible, onClose, ticket }: TicketDetailsModalProps) {
    const insets = useSafeAreaInsets();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!visible || !ticket?._id) {
            setMessages([]);
            return;
        }

        const fetchMessages = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/support/tickets/${ticket._id}`);
                setMessages(res.data.messages || []);
            } catch {
                setMessages([]);
            } finally {
                setLoading(false);
            }
        };
        fetchMessages();
    }, [visible, ticket?._id]);

    if (!ticket) return null;

    const formattedDate = new Date(ticket.created_at).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
    });

    const formatMsgTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <SafeAreaView
                    style={{
                        flex: 1,
                        backgroundColor: "white",
                        paddingTop: insets.top,
                    }}
                >
                    {/* Header */}
                    <View className="flex-row justify-between items-center px-4 pb-3 border-b border-gray-200">
                        <Pressable onPress={onClose}>
                            <Ionicons name="arrow-back" size={22} color="#111" />
                        </Pressable>
                        <View className="flex-1 items-center">
                            <Text className="font-bold text-base">{ticket.subject}</Text>
                            <Text className="text-xs text-gray-500">{ticket.status} • {formattedDate}</Text>
                        </View>
                        <View className="w-6" />
                    </View>

                    {/* Messages */}
                    {loading ? (
                        <View className="flex-1 items-center justify-center">
                            <ActivityIndicator size="large" color="#3B82F6" />
                        </View>
                    ) : messages.length > 0 ? (
                        <FlatList
                            data={messages}
                            keyExtractor={(item) => item._id}
                            contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
                            renderItem={({ item }) => {
                                const isUser = item.sender_type === "user";
                                return (
                                    <View className={`mb-3 max-w-[80%] ${isUser ? "self-end" : "self-start"}`}>
                                        <View
                                            className={`px-4 py-3 rounded-2xl ${isUser
                                                ? "bg-blue-500 rounded-br-sm"
                                                : "bg-gray-100 rounded-bl-sm"
                                                }`}
                                        >
                                            <Text className={isUser ? "text-white" : "text-gray-900"}>
                                                {item.message}
                                            </Text>
                                        </View>
                                        <Text className={`text-xs text-gray-400 mt-1 ${isUser ? "text-right" : "text-left"}`}>
                                            {item.sender_name} • {formatMsgTime(item.created_at)}
                                        </Text>
                                    </View>
                                );
                            }}
                        />
                    ) : (
                        <View className="flex-1 items-center justify-center px-6">
                            <Ionicons name="chatbubble-outline" size={48} color="#D1D5DB" />
                            <Text className="text-gray-500 mt-3 text-center">
                                {ticket.message || "No messages in this ticket yet."}
                            </Text>
                        </View>
                    )}
                </SafeAreaView>
            </KeyboardAvoidingView>
        </Modal>
    );
}
