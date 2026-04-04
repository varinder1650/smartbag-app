import { calculatePorterPrice, PORTER_URGENCY_FEE } from "@/config/servicePricing";
import { useServiceCartActions } from "@/hooks/useServiceCartActions";
import { RootState } from "@/store/store";
import { Address } from "@/types/address.types";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { useSelector } from "react-redux";

export function usePorterForm(editData?: any) {
    const router = useRouter();
    const { addPorterService } = useServiceCartActions();

    const [pickupAddress, setPickupAddress] = useState<Address | null>(editData?.pickupAddress || null);
    const [deliveryAddress, setDeliveryAddress] = useState<Address | null>(editData?.deliveryAddress || null);
    const [distance, setDistance] = useState(editData?.distance?.toString() || "");
    const [weight, setWeight] = useState(editData?.weight || "");
    const [phone, setPhone] = useState(editData?.phone || "");
    const [length, setLength] = useState<string | null>(editData?.dimensions?.length || null);
    const [width, setWidth] = useState<string | null>(editData?.dimensions?.width || null);
    const [height, setHeight] = useState<string | null>(editData?.dimensions?.height || null);
    const [notes, setNotes] = useState(editData?.notes || "");
    const [isUrgent, setIsUrgent] = useState(editData?.isUrgent || false);

    const selectedPickup = useSelector((state: RootState) => state.addressSelection.pickup);
    const selectedDelivery = useSelector((state: RootState) => state.addressSelection.delivery);
    const porterFee = useSelector((state: RootState) => state.price.porterFee);

    useEffect(() => {
        if (selectedPickup) setPickupAddress(selectedPickup);
        if (selectedDelivery) setDeliveryAddress(selectedDelivery);
    }, [selectedPickup, selectedDelivery]);

    const calculatedPrice = useMemo(() => {
        if (!distance || !length || !width || !height) return 0;
        const d = parseFloat(distance);
        if (isNaN(d)) return 0;

        let price = calculatePorterPrice(d, { length, width, height }, porterFee);
        if (isUrgent) {
            price = price + PORTER_URGENCY_FEE;
        }
        return Math.round(price);
    }, [distance, length, width, height, isUrgent, porterFee]);

    const handleAddToCart = useCallback(async () => {
        if (!pickupAddress || !deliveryAddress || !distance || !weight || !phone || !length || !width || !height) {
            Alert.alert("Error", "All fields are required");
            return;
        }

        const success = await addPorterService(
            {
                pickupAddress,
                deliveryAddress,
                distance: parseFloat(distance),
                weight,
                phone,
                dimensions: { length, width, height },
                notes,
                isUrgent,
            },
            calculatedPrice,
            !!editData // skip duplicate check when editing
        );

        if (!success) return;

        // Reset form
        setPickupAddress(null);
        setDeliveryAddress(null);
        setDistance("");
        setWeight("");
        setPhone("");
        setLength(null);
        setWidth(null);
        setHeight(null);
        setNotes("");
        setIsUrgent(false);
        router.push("/cart");
    }, [pickupAddress, deliveryAddress, distance, weight, phone, length, width, height, notes, isUrgent, calculatedPrice, addPorterService, router]);

    const renderAddress = useCallback(
        (address: Address | null) =>
            address
                ? `${address.street}, ${address.city}, ${address.state} (${address.pincode})`
                : "Select Address",
        []
    );

    return {
        pickupAddress,
        deliveryAddress,
        distance, setDistance,
        weight, setWeight,
        phone, setPhone,
        length, setLength,
        width, setWidth,
        height, setHeight,
        notes, setNotes,
        isUrgent, setIsUrgent,
        calculatedPrice,
        handleAddToCart,
        renderAddress,
    };
}
