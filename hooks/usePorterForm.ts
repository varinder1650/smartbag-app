import { useServiceCartActions } from "@/hooks/useServiceCartActions";
import { RootState } from "@/store/store";
import { Address } from "@/types/address.types";
import api from "@/utils/client";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
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
    const [calculatedPrice, setCalculatedPrice] = useState(0);
    const priceDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (selectedPickup) setPickupAddress(selectedPickup);
        if (selectedDelivery) setDeliveryAddress(selectedDelivery);
    }, [selectedPickup, selectedDelivery]);

    // Fetch price from backend (single source of truth)
    useEffect(() => {
        if (!distance || !length || !width || !height) {
            setCalculatedPrice(0);
            return;
        }
        const d = parseFloat(distance);
        if (isNaN(d) || d < 1) {
            setCalculatedPrice(0);
            return;
        }

        if (priceDebounce.current) clearTimeout(priceDebounce.current);
        priceDebounce.current = setTimeout(async () => {
            try {
                const res = await api.post("/settings/estimate-porter-price", {
                    distance: d,
                    length,
                    width,
                    height,
                    is_urgent: isUrgent,
                });
                if (__DEV__) console.log("[PorterPrice] response:", res.data);
                setCalculatedPrice(res.data.price);
            } catch (e: any) {
                if (__DEV__) console.error("[PorterPrice] error:", e?.response?.status, e?.response?.data || e.message);
                setCalculatedPrice(0);
            }
        }, 300);

        return () => {
            if (priceDebounce.current) clearTimeout(priceDebounce.current);
        };
    }, [distance, length, width, height, isUrgent]);

    const handleAddToCart = useCallback(async () => {
        if (!pickupAddress || !deliveryAddress || !distance || !weight || !phone || !length || !width || !height) {
            Alert.alert("Error", "All fields are required");
            return;
        }

        const parsedDistance = parseFloat(distance);
        if (isNaN(parsedDistance) || parsedDistance < 1) {
            Alert.alert("Invalid Distance", "Minimum distance should be 1 km");
            return;
        }

        const success = await addPorterService(
            {
                pickupAddress,
                deliveryAddress,
                distance: parsedDistance,
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
