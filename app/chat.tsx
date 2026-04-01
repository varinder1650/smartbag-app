import SafeView from "@/components/SafeView";
import TitleBar from "@/components/TitleBar";
import api from "@/utils/client";
import { getAccessToken } from "@/utils/tokenStorage";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState, useCallback } from "react";
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    Text,
    TextInput,
    View,
} from "react-native";

type ChatMessage = {
    _id: string;
    message: string;
    sender_type: "user" | "admin";
    sender_name: string;
    sender_id: string;
    created_at: string;
};

const WS_BASE = __DEV__
    ? process.env.EXPO_PUBLIC_WS_URL_DEV || "ws://10.0.2.2:8000/api"
    : process.env.EXPO_PUBLIC_WS_URL || "ws://195.35.6.222/api";

export default function ChatScreen() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState("");
    const [ticketId, setTicketId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [connected, setConnected] = useState(false);
    const [adminTyping, setAdminTyping] = useState(false);

    const wsRef = useRef<WebSocket | null>(null);
    const flatListRef = useRef<FlatList>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Start or resume chat
    useEffect(() => {
        initChat();
        return () => {
            wsRef.current?.close();
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        };
    }, []);

    const initChat = async () => {
        setLoading(true);
        try {
            const res = await api.post("/support/chat/start");
            const data = res.data;
            setTicketId(data.ticket_id);
            setMessages(data.messages || []);
            connectWebSocket(data.ticket_id);
            startPolling(data.ticket_id);
        } catch (e) {
            if (__DEV__) console.error("Failed to start chat:", e);
        } finally {
            setLoading(false);
        }
    };

    // Poll for new messages every 5 seconds (catches admin replies from separate backend)
    const startPolling = (chatTicketId: string) => {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = setInterval(async () => {
            try {
                const res = await api.get("/support/chat/active");
                const chat = res.data?.active_chat;
                if (chat && chat.messages) {
                    setMessages((prev) => {
                        if (chat.messages.length > prev.length) {
                            return chat.messages;
                        }
                        return prev;
                    });
                }
            } catch {
                // Silently ignore polling errors
            }
        }, 5000);
    };

    const connectWebSocket = async (chatTicketId: string) => {
        try {
            const token = await getAccessToken();
            if (!token) return;

            const wsUrl = `${WS_BASE}/support/chat/ws?token=${token}`;
            const ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                setConnected(true);
                if (__DEV__) console.log("Chat WebSocket connected");
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    if (data.type === "chat_message" && data.ticket_id === chatTicketId) {
                        // Only add admin messages (user messages are added optimistically)
                        if (data.message?.sender_type === "admin") {
                            setMessages((prev) => [...prev, data.message]);
                            setAdminTyping(false);
                        }
                    } else if (data.type === "typing" && data.ticket_id === chatTicketId) {
                        setAdminTyping(true);
                        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                        typingTimeoutRef.current = setTimeout(() => setAdminTyping(false), 3000);
                    } else if (data.type === "ping") {
                        ws.send(JSON.stringify({ type: "pong" }));
                    }
                } catch {
                    // ignore parse errors
                }
            };

            ws.onclose = () => {
                setConnected(false);
                // Auto-reconnect after 3 seconds
                reconnectTimeoutRef.current = setTimeout(() => {
                    connectWebSocket(chatTicketId);
                }, 3000);
            };

            ws.onerror = () => {
                setConnected(false);
            };

            wsRef.current = ws;
        } catch (e) {
            if (__DEV__) console.error("WebSocket connection error:", e);
        }
    };

    const sendMessage = useCallback(async () => {
        const text = inputText.trim();
        if (!text || !ticketId || sending) return;

        setSending(true);
        setInputText("");

        // Optimistic add
        const optimisticMsg: ChatMessage = {
            _id: Date.now().toString(),
            message: text,
            sender_type: "user",
            sender_name: "You",
            sender_id: "",
            created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, optimisticMsg]);

        try {
            // Try WebSocket first
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(
                    JSON.stringify({
                        type: "chat_message",
                        ticket_id: ticketId,
                        message: text,
                    })
                );
            } else {
                // Fallback to REST
                await api.post(`/support/chat/${ticketId}/send`, { message: text });
            }
        } catch (e) {
            if (__DEV__) console.error("Send failed:", e);
        } finally {
            setSending(false);
        }
    }, [inputText, ticketId, sending]);

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    const renderMessage = ({ item }: { item: ChatMessage }) => {
        const isUser = item.sender_type === "user";
        return (
            <View className={`mb-3 px-4 ${isUser ? "items-end" : "items-start"}`}>
                <View
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        isUser ? "bg-blue-600 rounded-br-sm" : "bg-gray-100 rounded-bl-sm"
                    }`}
                >
                    {!isUser && (
                        <Text className="text-xs font-semibold text-blue-600 mb-1">
                            {item.sender_name || "Support"}
                        </Text>
                    )}
                    <Text className={`text-[15px] ${isUser ? "text-white" : "text-gray-900"}`}>
                        {item.message}
                    </Text>
                </View>
                <Text className="text-xs text-gray-400 mt-1 px-1">{formatTime(item.created_at)}</Text>
            </View>
        );
    };

    if (loading) {
        return (
            <SafeView className="flex-1 bg-white">
                <TitleBar title="Chat Support" subtitle="" />
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#2563EB" />
                    <Text className="text-gray-500 mt-4">Connecting to support...</Text>
                </View>
            </SafeView>
        );
    }

    return (
        <SafeView edges={["top"]} className="flex-1 bg-white">
            <TitleBar
                title="Chat Support"
                subtitle=""
                rightAction={
                    <View className="flex-row items-center">
                        <View
                            className={`w-2.5 h-2.5 rounded-full mr-2 ${
                                connected ? "bg-green-500" : "bg-gray-400"
                            }`}
                        />
                        <Text className="text-xs text-gray-500">
                            {connected ? "Online" : "Connecting..."}
                        </Text>
                    </View>
                }
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
            >
                {/* Messages */}
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item._id}
                    renderItem={renderMessage}
                    contentContainerStyle={{ paddingVertical: 16, flexGrow: 1, justifyContent: messages.length === 0 ? "center" : "flex-end" }}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
                    ListEmptyComponent={
                        <View className="items-center px-8">
                            <Ionicons name="chatbubbles-outline" size={64} color="#D1D5DB" />
                            <Text className="text-gray-500 text-center mt-4 text-base">
                                Send a message to start chatting with our support team
                            </Text>
                        </View>
                    }
                />

                {/* Typing indicator */}
                {adminTyping && (
                    <View className="px-4 pb-2">
                        <Text className="text-xs text-gray-400 italic">Support is typing...</Text>
                    </View>
                )}

                {/* Input */}
                <View className="flex-row items-end px-4 py-3 border-t border-gray-100 bg-white">
                    <TextInput
                        className="flex-1 bg-gray-100 rounded-2xl px-4 py-3 text-[15px] text-gray-900 max-h-24"
                        placeholder="Type a message..."
                        placeholderTextColor="#9CA3AF"
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                        onSubmitEditing={sendMessage}
                        blurOnSubmit={false}
                    />
                    <Pressable
                        onPress={sendMessage}
                        disabled={!inputText.trim() || sending}
                        className={`ml-3 w-11 h-11 rounded-full items-center justify-center ${
                            inputText.trim() ? "bg-blue-600" : "bg-gray-300"
                        }`}
                    >
                        {sending ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <Ionicons name="send" size={18} color="white" />
                        )}
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </SafeView>
    );
}
