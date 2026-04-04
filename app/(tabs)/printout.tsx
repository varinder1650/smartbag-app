import SafeView from "@/components/SafeView";
import TitleBar from "@/components/TitleBar";
import PricingFooter from "@/components/printout/PricingFooter";
import PrintOptions from "@/components/printout/PrintOptions";
import DocumentUI from "@/components/printout/DocumentUI";
import PhotoUI from "@/components/printout/PhotoUI";
import {
    calculateDocumentPrice,
    calculatePhotoPrice,
} from "@/config/servicePricing";
import { usePrintoutUploads } from "@/hooks/usePrintoutUploads";
import { useServiceCartActions } from "@/hooks/useServiceCartActions";
import { RootState } from "@/store/store";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useSelector } from "react-redux";

type PrintType = "document" | "photo";

export default function PrintoutScreen() {
    const router = useRouter();
    const { addPrintoutService } = useServiceCartActions();
    const params = useLocalSearchParams<{ editData?: string }>();

    // Parse edit data if present
    const editDetails = useMemo(() => {
        if (!params.editData) return null;
        try { return JSON.parse(params.editData); } catch { return null; }
    }, [params.editData]);

    const [printType, setPrintType] = useState<PrintType>(editDetails?.printType || "document");
    const [copies, setCopies] = useState(editDetails?.copies?.toString() || "1");
    const [paperSize, setPaperSize] = useState<"A4" | "A3" | "Legal">(editDetails?.paperSize || "A4");
    const [photoSize, setPhotoSize] = useState<"Passport" | "4x6" | "5x7">(editDetails?.photoSize || "Passport");
    const [colorPrinting, setColorPrinting] = useState(editDetails?.colorPrinting || false);
    const [notes, setNotes] = useState(editDetails?.notes || "");

    const printoutFee = useSelector((state: RootState) => state.price.printoutFee);

    const {
        documents,
        photos,
        numberOfPages,
        uploadProgress,
        isUploading,
        pickDocuments,
        pickPhotos,
        deleteDocument,
        deletePhoto,
    } = usePrintoutUploads(printType, editDetails?.documents, editDetails?.photos);

    const price = useMemo(() => {
        const numCopies = parseInt(copies) || 0;
        if (numCopies <= 0) return 0;

        return printType === "document"
            ? calculateDocumentPrice(numberOfPages, numCopies, colorPrinting, paperSize, printoutFee)
            : calculatePhotoPrice(photoSize, numCopies, printoutFee);
    }, [printType, numberOfPages, copies, colorPrinting, paperSize, photoSize, printoutFee]);

    const handleAddToCart = useCallback(async () => {
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

        const success = await addPrintoutService(
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
    }, [printType, documents, photos, copies, numberOfPages, paperSize, photoSize, colorPrinting, notes, price, isUploading, addPrintoutService, router]);

    return (
        <SafeView className="flex-1 bg-gray-50">
            <TitleBar title="Print Service" subtitle="Documents & Photos" />

            <ScrollView contentContainerStyle={{ paddingBottom: 180 }}>
                {/* Type Toggle */}
                <View className="flex-row mx-4 mt-4 bg-gray-100 rounded-xl p-1">
                    {(["document", "photo"] as const).map((type) => (
                        <Pressable
                            key={type}
                            onPress={() => setPrintType(type)}
                            disabled={isUploading}
                            className={`flex-1 py-3 rounded-lg ${printType === type ? "bg-primary" : ""}`}
                        >
                            <Text
                                className={`text-center font-semibold ${printType === type ? "text-white" : "text-gray-700"}`}
                            >
                                {type === "document" ? "Document Print" : "Photo Print"}
                            </Text>
                        </Pressable>
                    ))}
                </View>

                {/* Upload UI */}
                {printType === "document" ? (
                    <DocumentUI
                        documents={documents}
                        numberOfPages={numberOfPages}
                        copies={copies}
                        setCopies={setCopies}
                        paperSize={paperSize}
                        setPaperSize={setPaperSize}
                        onUpload={pickDocuments}
                        onDelete={deleteDocument}
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
                        onDelete={deletePhoto}
                        uploadProgress={uploadProgress}
                        isUploading={isUploading}
                    />
                )}

                <PrintOptions
                    colorPrinting={colorPrinting}
                    setColorPrinting={setColorPrinting}
                    notes={notes}
                    setNotes={setNotes}
                />
            </ScrollView>

            <PricingFooter
                price={price}
                isUploading={isUploading}
                onAddToCart={handleAddToCart}
                label={editDetails ? "Update Cart" : "Add to Cart"}
            />
        </SafeView>
    );
}
