import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";

interface PrintOptionsProps {
    colorPrinting: boolean;
    setColorPrinting: (v: boolean) => void;
    notes: string;
    setNotes: (v: string) => void;
}

function PrintOptions({ colorPrinting, setColorPrinting, notes, setNotes }: PrintOptionsProps) {
    return (
        <>
            {/* Color */}
            <View className="mx-4 mt-6">
                <Text className="font-semibold mb-2">Printing Type</Text>
                <View className="flex-row gap-3">
                    {["B&W", "Color"].map((t) => (
                        <Pressable
                            key={t}
                            onPress={() => setColorPrinting(t === "Color")}
                            className={`flex-1 py-3 rounded-xl border ${colorPrinting === (t === "Color")
                                ? "bg-primary border-primary"
                                : "border-gray-200"
                                }`}
                        >
                            <Text
                                className={`text-center font-medium ${colorPrinting === (t === "Color")
                                    ? "text-white"
                                    : "text-gray-700"
                                    }`}
                            >
                                {t}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </View>

            {/* Notes */}
            <View className="mx-4 mt-6">
                <Text className="font-semibold mb-2">Notes</Text>
                <TextInput
                    multiline
                    placeholder="Any special instructions..."
                    value={notes}
                    onChangeText={setNotes}
                    className="border border-gray-200 rounded-xl px-4 py-3 h-28"
                />
            </View>
        </>
    );
}

export default React.memo(PrintOptions);
