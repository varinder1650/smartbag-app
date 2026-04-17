import React from "react";
import { Image, View } from "react-native";

interface PrintableArea {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface MockupPreviewProps {
    templateUrl: string;
    userImageUrl: string;
    printableArea: PrintableArea;
    size?: number;
}

export default function MockupPreview({
    templateUrl,
    userImageUrl,
    printableArea,
    size = 300,
}: MockupPreviewProps) {
    return (
        <View style={{ width: size, height: size, alignSelf: "center" }}>
            <Image
                source={{ uri: templateUrl }}
                style={{ width: size, height: size, borderRadius: 16 }}
                resizeMode="contain"
            />
            <Image
                source={{ uri: userImageUrl }}
                style={{
                    position: "absolute",
                    left: printableArea.x * size,
                    top: printableArea.y * size,
                    width: printableArea.width * size,
                    height: printableArea.height * size,
                }}
                resizeMode="cover"
            />
        </View>
    );
}
