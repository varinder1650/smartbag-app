import { UploadedDocument, UploadedPhoto } from "@/types/services.types";
import { uploadToCloudinary } from "@/utils/fileupload";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { PDFDocument } from "pdf-lib";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";

type PrintType = "document" | "photo";

export function usePrintoutUploads(
    printType: PrintType,
    initialDocuments?: UploadedDocument[],
    initialPhotos?: UploadedPhoto[],
) {
    const [documents, setDocuments] = useState<UploadedDocument[]>(initialDocuments || []);
    const [photos, setPhotos] = useState<UploadedPhoto[]>(initialPhotos || []);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [numberOfPages, setNumberOfPages] = useState(0);

    // Recompute total pages when documents change
    useEffect(() => {
        setNumberOfPages(documents.reduce((sum, d) => sum + d.pages, 0));
    }, [documents]);

    // Clear opposite uploads when type switches
    useEffect(() => {
        if (printType === "document") {
            setPhotos([]);
        } else {
            setDocuments([]);
        }
    }, [printType]);

    const pickDocuments = useCallback(async () => {
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

            for (let i = 0; i < res.assets.length; i++) {
                const file = res.assets[i];
                try {
                    setUploadProgress(10 + (i / totalFiles) * 30);

                    const pdfBytes = await fetch(file.uri).then(r => r.arrayBuffer());
                    const pdf = await PDFDocument.load(pdfBytes);
                    const pageCount = pdf.getPageCount();

                    setUploadProgress(40 + (i / totalFiles) * 40);
                    const cloudUrl = await uploadToCloudinary(file.uri, 'application/pdf');

                    docs.push({
                        id: Math.random().toString(),
                        name: file.name,
                        pages: pageCount,
                        cloudUrl,
                    });

                    setUploadProgress(80 + (i / totalFiles) * 20);
                } catch (error) {
                    if (__DEV__) console.error(`Error processing ${file.name}:`, error);
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
            if (__DEV__) console.error("Error picking documents:", error);
            Alert.alert("Error", "Failed to pick documents. Please try again.");
            setUploadProgress(0);
            setIsUploading(false);
        }
    }, []);

    const pickPhotos = useCallback(async () => {
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

            for (let i = 0; i < res.assets.length; i++) {
                const asset = res.assets[i];
                try {
                    setUploadProgress(10 + (i / totalPhotos) * 60);
                    const cloudUrl = await uploadToCloudinary(asset.uri, 'image/jpeg');

                    uploadedPhotos.push({
                        id: Math.random().toString(),
                        uri: asset.uri,
                        cloudUrl,
                        name: `Photo ${i + 1}`,
                    });

                    setUploadProgress(70 + (i / totalPhotos) * 30);
                } catch (error) {
                    if (__DEV__) console.error(`Error uploading photo ${i + 1}:`, error);
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
            if (__DEV__) console.error("Error picking photos:", error);
            Alert.alert("Error", "Failed to pick photos. Please try again.");
            setUploadProgress(0);
            setIsUploading(false);
        }
    }, []);

    const deleteDocument = useCallback((id: string) => {
        setDocuments((docs) => docs.filter((d) => d.id !== id));
    }, []);

    const deletePhoto = useCallback((id: string) => {
        setPhotos((p) => p.filter((x) => x.id !== id));
    }, []);

    return {
        documents,
        photos,
        numberOfPages,
        uploadProgress,
        isUploading,
        pickDocuments,
        pickPhotos,
        deleteDocument,
        deletePhoto,
    };
}
