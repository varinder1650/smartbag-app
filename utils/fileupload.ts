import { ENV } from "@/config/env";
import { FileSystemUploadType, uploadAsync } from 'expo-file-system/legacy';

/**
 * Upload a file (document or image) to Cloudinary
 * @param fileUri - Local file URI from device
 * @param fileType - MIME type of the file (e.g., 'application/pdf', 'image/jpeg')
 * @returns Secure URL of uploaded file
 */
export const uploadToCloudinary = async (
    fileUri: string,
    fileType: string = 'application/pdf'
): Promise<string> => {
    try {
        const cloudName = ENV.CLOUDINARY.CLOUD_NAME;
        const uploadPreset = ENV.CLOUDINARY.UPLOAD_PRESET;

        // Validate environment variables
        if (!cloudName || !uploadPreset) {
            throw new Error("Cloudinary configuration missing. Please set CLOUD_NAME and UPLOAD_PRESET");
        }

        // Always use 'auto' for the API endpoint - let Cloudinary decide
        const url = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;

        if (__DEV__) console.log('Uploading file:', { fileUri, fileType, url });

        const response = await uploadAsync(url, fileUri, {
            httpMethod: 'POST',
            uploadType: FileSystemUploadType.MULTIPART,
            fieldName: 'file',
            mimeType: fileType,
            parameters: {
                upload_preset: uploadPreset,
            },
        });

        if (__DEV__) console.log('Upload response status:', response.status);

        if (response.status !== 200) {
            throw new Error(`Upload failed with status ${response.status}: ${response.body}`);
        }

        const json = JSON.parse(response.body);

        // Return secure_url directly
        return json.secure_url;

    } catch (error) {
        if (__DEV__) console.error("Cloudinary upload error:", error);
        throw error;
    }
};

/**
 * Upload multiple files to Cloudinary with progress tracking
 * @param files - Array of file URIs
 * @param fileType - MIME type of files
 * @param onProgress - Optional callback for progress updates
 * @returns Array of secure URLs
 */
export const uploadMultipleToCloudinary = async (
    files: string[],
    fileType: string,
    onProgress?: (progress: number, index: number) => void
): Promise<string[]> => {
    const urls: string[] = [];

    for (let i = 0; i < files.length; i++) {
        if (onProgress) {
            onProgress((i / files.length) * 100, i);
        }

        const url = await uploadToCloudinary(files[i], fileType);
        urls.push(url);
    }

    if (onProgress) {
        onProgress(100, files.length);
    }

    return urls;
};

/**
 * Delete a file from Cloudinary via the backend.
 * Cloudinary deletion requires an API secret (signing), so it must be
 * handled server-side. This sends the publicId to our backend which
 * performs the actual Cloudinary destroy call.
 *
 * @param publicId - Public ID of the file to delete
 * @returns true if deleted successfully, false otherwise
 */
export const deleteFromCloudinary = async (publicId: string): Promise<boolean> => {
    try {
        if (!publicId) {
            if (__DEV__) console.warn("deleteFromCloudinary called with empty publicId");
            return false;
        }

        const api = (await import("@/utils/client")).default;
        const res = await api.delete("/files/cloudinary", {
            data: { public_id: publicId },
        });

        return res.status === 200;
    } catch (error) {
        if (__DEV__) console.error("Cloudinary delete error:", error);
        return false;
    }
};
