import { syncAddServiceToCart } from "@/slices/cart.thunks";
import { addServiceToCart } from "@/slices/cartSlice";
import { useAppDispatch } from "@/store/hooks";
import { RootState } from "@/store/store";
import { CartItem, PorterServiceDetails, PrintoutServiceDetails } from "@/types/cart.types";
import { Alert } from "react-native";
import { useSelector } from "react-redux";

export function useServiceCartActions() {
    const dispatch = useAppDispatch();
    const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
    const mode: "guest" | "user" = isAuthenticated ? "user" : "guest";
    const cartItems = useSelector((state: RootState) => state.cart[mode].items);

    const addPorterService = (
        details: PorterServiceDetails,
        selling_price: number
    ) => {
        // Check if porter service already exists in cart
        const hasPorterService = Object.values(cartItems).some(
            item => item.serviceType === 'porter'
        );

        if (hasPorterService) {
            Alert.alert(
                'Service Already Added',
                'You already have a porter service in your cart. Please remove it first if you want to add a different one.',
                [{ text: 'OK' }]
            );
            return false;
        }

        const serviceItem: CartItem = {
            id: `porter-${Date.now()}`, // Unique ID for service
            name: 'Porter Delivery Service',
            selling_price,
            quantity: 1, // Services are always quantity 1
            serviceType: 'porter',
            serviceDetails: details,
        } as any;

        if (mode === "user") {
            dispatch(syncAddServiceToCart(serviceItem));
        } else {
            dispatch(addServiceToCart({ mode, item: serviceItem }));
        }
        return true;
    };

    const addPrintoutService = (
        details: PrintoutServiceDetails,
        selling_price: number
    ) => {
        console.log("=== Adding Printout Service ===");
        console.log("Details:", details);
        console.log("Price:", selling_price);

        if (selling_price <= 0) {
            Alert.alert("Error", "Invalid print price");
            return false;
        }

        // Validate required fields
        if (!details.printType) {
            console.error("Missing printType");
            Alert.alert("Error", "Print type not specified");
            return false;
        }

        if (!details.copies || details.copies <= 0) {
            console.error("Invalid copies:", details.copies);
            Alert.alert("Error", "Please specify number of copies");
            return false;
        }

        // Validate based on print type
        if (details.printType === "photo") {
            if (!details.photos || details.photos.length === 0) {
                Alert.alert("Error", "Please upload at least one photo");
                return false;
            }
            if (!details.photoSize) {
                Alert.alert("Error", "Please select photo size");
                return false;
            }
        } else {
            if (!details.documents || details.documents.length === 0) {
                Alert.alert("Error", "Please upload at least one document");
                return false;
            }
            if (!details.numberOfPages || details.numberOfPages <= 0) {
                Alert.alert("Error", "Invalid number of pages");
                return false;
            }
        }

        const serviceItem: CartItem = {
            id: `printout-${Date.now()}`,
            name: details.printType === "document"
                ? `Document Print (${details.numberOfPages} pages)`
                : `Photo Print (${details.photos?.length || 0} photos)`,
            selling_price,
            quantity: 1,
            serviceType: "printout",
            serviceDetails: {
                ...details,
                printType: details.printType,
                numberOfPages: details.numberOfPages || 0,
                copies: details.copies,
                paperSize: details.paperSize || 'A4',
                photoSize: details.photoSize || 'Passport',
                colorPrinting: details.colorPrinting || false,
                notes: details.notes || '',
                documents: details.documents || [],
                photos: details.photos || [],
            },
        } as any;

        console.log("=== Service Item Created ===");
        console.log(JSON.stringify(serviceItem, null, 2));

        if (mode === "user") {
            dispatch(syncAddServiceToCart(serviceItem));
        } else {
            dispatch(addServiceToCart({ mode, item: serviceItem }));
        }
        return true;
    };

    return {
        addPorterService,
        addPrintoutService,
    };
}