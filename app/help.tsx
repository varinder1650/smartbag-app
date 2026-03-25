import SafeView from "@/components/SafeView";
import ContactUsSection from "@/components/tickets/ContactUsSection";
import CreateTicketModal from "@/components/tickets/CreateTicketModal";
import TicketDetailsModal from "@/components/tickets/TicketDetailsModal";
import TitleBar from "@/components/TitleBar";
import api from "@/utils/client";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";

type Ticket = {
    id: string;
    subject: string;
    created_at: string;
    status: string;
};

const statusColors: Record<string, string> = {
    open: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    closed: "bg-gray-200 text-gray-700",
};

export default function Help() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const res = await api.get("/support/tickets");
            setTickets(res.data);
        } catch (e) {
            if (__DEV__) console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    const handleAddTicket = () => setShowCreateForm(true);
    const handleTicketPress = (ticket: Ticket) => {
        setSelectedTicket(ticket);
        setShowDetailsModal(true);
    };
    const handleCreateTicket = async (data: any) => {
        await api.post("/support/tickets", data);
        fetchTickets();
    };

    const renderTicket = ({ item }: { item: Ticket }) => {
        const statusClass = statusColors[item.status.toLowerCase()] || "bg-gray-200 text-gray-700";
        const formattedDate = new Date(item.created_at).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });

        return (
            <Pressable onPress={() => handleTicketPress(item)}>
                <View className="bg-white rounded-2xl p-4 mb-3 shadow">
                    <View className="flex-row justify-between items-center mb-2">
                        <Text className="font-bold text-gray-900 text-base">{item.subject}</Text>
                        <View className={`px-3 py-1 rounded-full ${statusClass.split(" ")[0]}`}>
                            <Text className={`text-xs font-semibold ${statusClass.split(" ")[1]}`}>{item.status}</Text>
                        </View>
                    </View>
                    <Text className="text-gray-500 text-sm">Created: {formattedDate}</Text>
                </View>
            </Pressable>
        );
    };

    return (
        <SafeView className="flex-1 bg-white">
            <TitleBar title="Help & Support" subtitle="" />

            <ContactUsSection
                phoneNumber="9463256364"
                email="smartbag.help@gmail.com"
                whatsappNumber="9463256364"
            />

            <FlatList
                data={tickets}
                keyExtractor={(item) => item.id}
                renderItem={renderTicket}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
                ListEmptyComponent={
                    <View className="flex-1 justify-center items-center mt-12">
                        {loading ? (
                            <ActivityIndicator size="large" color="#2563EB" />
                        ) : (
                            <>
                                <Ionicons name="help-circle-outline" size={80} color="#9CA3AF" />
                                <Text className="text-gray-900 text-lg font-bold mt-4">No tickets found</Text>
                                <Text className="text-gray-500 text-center mt-2">
                                    You can create a new support ticket using the button below.
                                </Text>
                            </>
                        )}
                    </View>
                }
            />

            {/* Modals */}
            <CreateTicketModal visible={showCreateForm} onClose={() => setShowCreateForm(false)} onSubmit={handleCreateTicket} />
            <TicketDetailsModal visible={showDetailsModal} ticket={selectedTicket} onClose={() => setShowDetailsModal(false)} />

            <Pressable
                onPress={handleAddTicket}
                style={{
                    position: "absolute",
                    bottom: 20,
                    right: 20,
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    backgroundColor: "#2563EB",
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <Text style={{ color: "white", fontSize: 30 }}>+</Text>
            </Pressable>
        </SafeView>
    );
}