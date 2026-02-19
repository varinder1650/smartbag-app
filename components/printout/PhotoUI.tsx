import { UploadedPhoto } from "@/types/services.types";
import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import FormCard from "../FormCard";
import UploadProgressBar from "./UploadProgressBar";

type Props = {
    photos: UploadedPhoto[];
    photoSize: "Passport" | "4x6" | "5x7";
    setPhotoSize: (v: "Passport" | "4x6" | "5x7") => void;
    copies: string;
    setCopies: (v: string) => void;
    onUpload: () => void;
    onDelete: (id: string) => void;
    uploadProgress: number;
    isUploading: boolean;
};

export default function PhotoUI({
    photos,
    photoSize,
    setPhotoSize,
    copies,
    setCopies,
    onUpload,
    onDelete,
    uploadProgress,
    isUploading,
}: Props) {
    return (
        <>
            <FormCard title="Upload Photos">
                <Pressable
                    onPress={onUpload}
                    disabled={isUploading}
                    className={`border border-dashed rounded-xl py-6 items-center ${isUploading
                        ? "border-gray-200 bg-gray-50"
                        : "border-gray-300 bg-white"
                        }`}
                >
                    <Ionicons
                        name="images-outline"
                        size={32}
                        color={isUploading ? "#9CA3AF" : "#3B82F6"}
                    />
                    <Text className={`font-semibold mt-2 ${isUploading ? "text-gray-400" : "text-primary"
                        }`}>
                        {isUploading ? "Uploading..." : "Upload Images"}
                    </Text>
                    <Text className="text-xs text-gray-500 mt-1">
                        Select multiple photos from your gallery
                    </Text>
                </Pressable>

                {uploadProgress > 0 && uploadProgress < 100 && (
                    <UploadProgressBar progress={uploadProgress} />
                )}

                {photos.length > 0 && (
                    <View className="mt-4">
                        <Text className="text-sm font-semibold text-gray-700 mb-2">
                            Uploaded Photos ({photos.length})
                        </Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            className="flex-row"
                        >
                            {photos.map((photo, index) => (
                                <View
                                    key={photo.id}
                                    className="mr-3 mb-2"
                                    style={{ width: 120 }}
                                >
                                    <View className="relative">
                                        <Image
                                            source={{ uri: photo.uri }}
                                            className="w-full h-32 rounded-lg"
                                            resizeMode="cover"
                                        />

                                        {/* Delete Button */}
                                        <Pressable
                                            onPress={() => onDelete(photo.id)}
                                            className="absolute top-1 right-1 bg-red-500 w-7 h-7 rounded-full items-center justify-center"
                                            disabled={isUploading}
                                            style={{
                                                shadowColor: "#000",
                                                shadowOffset: { width: 0, height: 2 },
                                                shadowOpacity: 0.25,
                                                shadowRadius: 3.84,
                                                elevation: 5,
                                            }}
                                        >
                                            <Ionicons name="close" size={16} color="white" />
                                        </Pressable>

                                        {/* Photo Number Badge */}
                                        <View className="absolute bottom-1 left-1 bg-black/60 px-2 py-1 rounded">
                                            <Text className="text-white text-xs font-medium">
                                                Photo {index + 1}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>

                        <View className="mt-2 bg-blue-50 p-3 rounded-lg">
                            <Text className="text-sm text-blue-800">
                                <Text className="font-semibold">Total photos: </Text>
                                {photos.length}
                            </Text>
                        </View>
                    </View>
                )}
            </FormCard>

            <FormCard title="Photo Size">
                <View className="flex-row gap-2">
                    {[
                        { value: 'Passport', label: 'Passport' },
                        { value: '4x6', label: '4x6"' },
                        { value: '5x7', label: '5x7"' }
                    ].map(({ value, label }) => (
                        <Pressable
                            key={value}
                            onPress={() => setPhotoSize(value as any)}
                            className={`flex-1 py-3 rounded-xl border ${photoSize === value
                                ? 'bg-primary border-primary'
                                : 'border-gray-200'
                                }`}
                        >
                            <Text
                                className={`text-center font-medium ${photoSize === value ? 'text-white' : 'text-gray-700'
                                    }`}
                            >
                                {label}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </FormCard>

            <FormCard title="Number of Copies">
                <TextInput
                    keyboardType="number-pad"
                    value={copies}
                    onChangeText={setCopies}
                    className="border border-gray-200 rounded-xl px-4 py-3"
                    placeholder="Enter number of copies per photo"
                />
                <Text className="text-xs text-gray-500 mt-2">
                    Each photo will be printed {copies} {Number(copies) === 1 ? 'time' : 'times'}
                </Text>
            </FormCard>
        </>
    );
}