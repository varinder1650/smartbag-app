import React from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

interface TicketDetailsModalProps {
    visible: boolean;
    onClose: () => void;
    ticket: { _id: string; subject: string; created_at: string; status: string; message?: string; orderId?: string } | null;
}

export default function TicketDetailsModal({ visible, onClose, ticket }: TicketDetailsModalProps) {
    if (!ticket) return null;
    const insets = useSafeAreaInsets();

    const formattedDate = new Date(ticket.created_at).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
    });

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
                        paddingHorizontal: 16,
                        paddingTop: insets.top,
                    }}
                >
                    {/* Header */}
                    <View className="flex-row justify-between items-center mb-4">
                        <Pressable onPress={onClose}>
                            <Text className="text-blue-500">Close</Text>
                        </Pressable>
                        <Text className="font-bold text-lg">Ticket Details</Text>
                        <View className="w-12" />
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <Text className="font-bold text-lg mb-2">{ticket.subject}</Text>
                        <Text className="text-gray-500 mb-2">Status: {ticket.status}</Text>
                        <Text className="text-gray-500 mb-2">Created: {formattedDate}</Text>
                        {ticket.orderId && <Text className="text-gray-500 mb-2">Order ID: {ticket.orderId}</Text>}
                        {ticket.message && <Text className="mt-4">{ticket.message}</Text>}
                    </ScrollView>
                </SafeAreaView>
            </KeyboardAvoidingView>
        </Modal>
    );
}
