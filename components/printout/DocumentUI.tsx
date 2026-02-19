import { UploadedDocument } from "@/types/services.types";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, TextInput, View } from "react-native";
import FormCard from "../FormCard";
import UploadProgressBar from "./UploadProgressBar";

type Props = {
    documents: UploadedDocument[];
    numberOfPages: number;
    copies: string;
    setCopies: (v: string) => void;
    paperSize: 'A4' | 'A3' | 'Legal';
    setPaperSize: (v: any) => void;
    onUpload: () => void;
    onDelete: (id: string) => void;
    uploadProgress: number;
    isUploading: boolean;
};

export default function DocumentUI({
    documents,
    numberOfPages,
    copies,
    setCopies,
    paperSize,
    setPaperSize,
    onUpload,
    onDelete,
    uploadProgress,
    isUploading,
}: Props) {
    return (
        <>
            <FormCard title="Upload Documents">
                <Pressable
                    onPress={onUpload}
                    disabled={isUploading}
                    className={`border border-dashed rounded-xl py-6 items-center ${isUploading
                        ? "border-gray-200 bg-gray-50"
                        : "border-gray-300 bg-white"
                        }`}
                >
                    <Ionicons
                        name="cloud-upload-outline"
                        size={32}
                        color={isUploading ? "#9CA3AF" : "#3B82F6"}
                    />
                    <Text className={`font-semibold mt-2 ${isUploading ? "text-gray-400" : "text-primary"
                        }`}>
                        {isUploading ? "Uploading..." : "Upload PDF (Multiple allowed)"}
                    </Text>
                    <Text className="text-xs text-gray-500 mt-1">
                        Tap to select PDF files from your device
                    </Text>
                </Pressable>

                {uploadProgress > 0 && uploadProgress < 100 && (
                    <UploadProgressBar progress={uploadProgress} />
                )}

                {documents.length > 0 && (
                    <View className="mt-4">
                        <Text className="text-sm font-semibold text-gray-700 mb-2">
                            Uploaded Documents ({documents.length})
                        </Text>
                        {documents.map(doc => (
                            <View
                                key={doc.id}
                                className="flex-row justify-between items-center mt-2 bg-gray-50 p-3 rounded-lg border border-gray-100"
                            >
                                <View className="flex-row items-center flex-1">
                                    <View className="bg-primary/10 w-10 h-10 rounded-lg items-center justify-center mr-3">
                                        <Ionicons name="document-text" size={20} color="#3B82F6" />
                                    </View>
                                    <View className="flex-1">
                                        <Text
                                            className="font-medium text-gray-800"
                                            numberOfLines={1}
                                        >
                                            {doc.name}
                                        </Text>
                                        <Text className="text-xs text-gray-500">
                                            {doc.pages} {doc.pages === 1 ? 'page' : 'pages'}
                                        </Text>
                                    </View>
                                </View>

                                <Pressable
                                    onPress={() => onDelete(doc.id)}
                                    className="bg-red-50 w-8 h-8 rounded-full items-center justify-center ml-2"
                                    disabled={isUploading}
                                >
                                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                </Pressable>
                            </View>
                        ))}

                        <View className="mt-3 bg-blue-50 p-3 rounded-lg">
                            <Text className="text-sm text-blue-800">
                                <Text className="font-semibold">Total pages: </Text>
                                {numberOfPages}
                            </Text>
                        </View>
                    </View>
                )}
            </FormCard>

            <FormCard title="Number of Copies">
                <TextInput
                    keyboardType="number-pad"
                    value={copies}
                    onChangeText={setCopies}
                    className="border border-gray-200 rounded-xl px-4 py-3"
                    placeholder="Enter number of copies"
                />
            </FormCard>

            <FormCard title="Paper Size">
                <View className="flex-row gap-2">
                    {['A4', 'A3', 'Legal'].map(size => (
                        <Pressable
                            key={size}
                            onPress={() => setPaperSize(size as any)}
                            className={`flex-1 py-3 rounded-xl border ${paperSize === size
                                ? 'bg-primary border-primary'
                                : 'border-gray-200'
                                }`}
                        >
                            <Text
                                className={`text-center font-medium ${paperSize === size ? 'text-white' : 'text-gray-700'
                                    }`}
                            >
                                {size}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </FormCard>
        </>
    );
}