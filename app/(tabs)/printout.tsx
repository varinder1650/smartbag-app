import SafeView from "@/components/SafeView";
import TitleBar from "@/components/TitleBar";
import DocumentUI from "@/components/printout/DocumentUI";
import PhotoUI from "@/components/printout/PhotoUI";
import {
    calculateDocumentPrice,
    calculatePhotoPrice,
} from "@/config/servicePricing";
import { useServiceCartActions } from "@/hooks/useServiceCartActions";
import { RootState } from "@/store/store";
import { UploadedDocument, UploadedPhoto } from "@/types/services.types";
import { uploadToCloudinary } from "@/utils/fileupload";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useNavigation, useRouter } from "expo-router";
import { PDFDocument } from "pdf-lib";
import { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { useSelector } from "react-redux";

type PrintType = "document" | "photo";

export default function PrintoutScreen() {
    const router = useRouter();
    const navigation = useNavigation();
    const { addPrintoutService } = useServiceCartActions();

    const [printType, setPrintType] = useState<PrintType>("document");

    const [documents, setDocuments] = useState<UploadedDocument[]>([]);
    const [photos, setPhotos] = useState<UploadedPhoto[]>([]);

    const [copies, setCopies] = useState("1");
    const [paperSize, setPaperSize] = useState<"A4" | "A3" | "Legal">("A4");
    const [photoSize, setPhotoSize] = useState<"Passport" | "4x6" | "5x7">(
        "Passport"
    );
    const [colorPrinting, setColorPrinting] = useState(false);
    const [notes, setNotes] = useState("");

    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [numberOfPages, setNumberOfPages] = useState(0);

    const printoutFee = useSelector((state: RootState) => state.price.printoutFee);

    useEffect(() => {
        setNumberOfPages(
            documents.reduce((sum, d) => sum + d.pages, 0)
        );
    }, [documents]);

    // Clear opposite uploads
    useEffect(() => {
        if (printType === "document") {
            setPhotos([]);
        } else {
            setDocuments([]);
        }
    }, [printType]);

    const pickDocuments = async () => {
        try {
            setUploadProgress(10);
            setIsUploading(true);

            const res = await DocumentPicker.getDocumentAsync({
                type: ["application/pdf"],
                multiple: true,
                copyToCacheDirectory: true,
            });

            if (res.canceled) {
                setUploadProgress(0);
                setIsUploading(false);
                return;
            }

            const totalFiles = res.assets.length;
            const docs: UploadedDocument[] = [];

            // Process each file
            for (let i = 0; i < res.assets.length; i++) {
                const file = res.assets[i];

                try {
                    // Update progress for processing
                    setUploadProgress(10 + (i / totalFiles) * 30);

                    // Get page count
                    const pdfBytes = await fetch(file.uri).then(r => r.arrayBuffer());
                    const pdf = await PDFDocument.load(pdfBytes);
                    const pageCount = pdf.getPageCount();

                    // Upload to Cloudinary
                    setUploadProgress(40 + (i / totalFiles) * 40);
                    const cloudUrl = await uploadToCloudinary(file.uri, 'application/pdf');
                    // console.log(cloudUrl)
                    docs.push({
                        id: Math.random().toString(),
                        name: file.name,
                        pages: pageCount,
                        cloudUrl: cloudUrl, // Store cloud URL
                    });

                    setUploadProgress(80 + (i / totalFiles) * 20);
                } catch (error) {
                    console.error(`Error processing ${file.name}:`, error);
                    Alert.alert("Upload Error", `Failed to upload ${file.name}`);
                }
            }

            if (docs.length > 0) {
                setDocuments((prev) => [...prev, ...docs]);
                setUploadProgress(100);
                Alert.alert("Success", `${docs.length} document(s) uploaded successfully`);
            }

            setTimeout(() => {
                setUploadProgress(0);
                setIsUploading(false);
            }, 500);

        } catch (error) {
            console.error("Error picking documents:", error);
            Alert.alert("Error", "Failed to pick documents. Please try again.");
            setUploadProgress(0);
            setIsUploading(false);
        }
    };

    const pickPhotos = async () => {
        try {
            setUploadProgress(10);
            setIsUploading(true);

            const res = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsMultipleSelection: true,
                quality: 1,
            });

            if (res.canceled) {
                setUploadProgress(0);
                setIsUploading(false);
                return;
            }

            const totalPhotos = res.assets.length;
            const uploadedPhotos: UploadedPhoto[] = [];

            // Upload each photo to Cloudinary
            for (let i = 0; i < res.assets.length; i++) {
                const asset = res.assets[i];

                try {
                    // Update progress
                    setUploadProgress(10 + (i / totalPhotos) * 60);

                    // Upload to Cloudinary
                    const cloudUrl = await uploadToCloudinary(asset.uri, 'image/jpeg');

                    uploadedPhotos.push({
                        id: Math.random().toString(),
                        uri: asset.uri, // Keep local URI for preview
                        cloudUrl: cloudUrl, // Store cloud URL
                        name: `Photo ${i + 1}`,
                    });

                    setUploadProgress(70 + (i / totalPhotos) * 30);
                } catch (error) {
                    console.error(`Error uploading photo ${i + 1}:`, error);
                    Alert.alert("Upload Error", `Failed to upload photo ${i + 1}`);
                }
            }

            if (uploadedPhotos.length > 0) {
                setPhotos((prev) => [...prev, ...uploadedPhotos]);
                setUploadProgress(100);
                Alert.alert("Success", `${uploadedPhotos.length} photo(s) uploaded successfully`);
            }

            setTimeout(() => {
                setUploadProgress(0);
                setIsUploading(false);
            }, 500);

        } catch (error) {
            console.error("Error picking photos:", error);
            Alert.alert("Error", "Failed to pick photos. Please try again.");
            setUploadProgress(0);
            setIsUploading(false);
        }
    };

    const price = useMemo(() => {
        const numCopies = parseInt(copies) || 0;
        if (numCopies <= 0) return 0;

        return printType === "document"
            ? calculateDocumentPrice(numberOfPages, numCopies, colorPrinting, paperSize, printoutFee)
            : calculatePhotoPrice(photoSize, numCopies, printoutFee);
    }, [printType, numberOfPages, copies, colorPrinting, paperSize, photoSize, printoutFee]);

    const handleAddToCart = () => {
        if (printType === "document" && documents.length === 0) {
            Alert.alert("Error", "Please upload at least one document");
            return;
        }

        if (printType === "photo" && photos.length === 0) {
            Alert.alert("Error", "Please upload at least one photo");
            return;
        }

        const numCopies = parseInt(copies) || 0;
        if (numCopies <= 0) {
            Alert.alert("Error", "Invalid number of copies");
            return;
        }

        if (isUploading) {
            Alert.alert("Please Wait", "Files are still uploading. Please wait.");
            return;
        }

        const success = addPrintoutService(
            {
                printType,
                documents,
                photos,
                numberOfPages,
                copies: numCopies,
                paperSize,
                photoSize,
                colorPrinting,
                notes,
            },
            price
        );

        if (success) {
            router.push("/cart");
        }
    };

    return (
        <SafeView className="flex-1 bg-gray-50">
            <TitleBar title="Print Service" subtitle="Documents & Photos" />

            <ScrollView contentContainerStyle={{ paddingBottom: 180 }}>
                {/* Toggle */}
                <View className="flex-row mx-4 mt-4 bg-gray-100 rounded-xl p-1">
                    {["document", "photo"].map((type) => (
                        <Pressable
                            key={type}
                            onPress={() => setPrintType(type as PrintType)}
                            disabled={isUploading}
                            className={`flex-1 py-3 rounded-lg ${printType === type ? "bg-primary" : ""
                                }`}
                        >
                            <Text
                                className={`text-center font-semibold ${printType === type ? "text-white" : "text-gray-700"
                                    }`}
                            >
                                {type === "document" ? "Document Print" : "Photo Print"}
                            </Text>
                        </Pressable>
                    ))}
                </View>

                {/* Content */}
                {printType === "document" ? (
                    <DocumentUI
                        documents={documents}
                        numberOfPages={numberOfPages}
                        copies={copies}
                        setCopies={setCopies}
                        paperSize={paperSize}
                        setPaperSize={setPaperSize}
                        onUpload={pickDocuments}
                        onDelete={(id) =>
                            setDocuments((docs) => docs.filter((d) => d.id !== id))
                        }
                        uploadProgress={uploadProgress}
                        isUploading={isUploading}
                    />
                ) : (
                    <PhotoUI
                        photos={photos}
                        photoSize={photoSize}
                        setPhotoSize={setPhotoSize}
                        copies={copies}
                        setCopies={setCopies}
                        onUpload={pickPhotos}
                        onDelete={(id) =>
                            setPhotos((p) => p.filter((x) => x.id !== id))
                        }
                        uploadProgress={uploadProgress}
                        isUploading={isUploading}
                    />
                )}

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
            </ScrollView>

            {/* Footer */}
            <View className="absolute bottom-0 w-full px-4 pb-6 bg-white border-t border-gray-200">
                <Pressable
                    onPress={handleAddToCart}
                    disabled={isUploading}
                    className={`py-4 rounded-2xl items-center ${isUploading ? "bg-gray-400" : "bg-primary"
                        }`}
                >
                    <Text className="text-white font-bold text-lg">
                        {isUploading
                            ? "Uploading..."
                            : `Add to Cart • ₹${price}`
                        }
                    </Text>
                </Pressable>
            </View>
        </SafeView>
    );
}