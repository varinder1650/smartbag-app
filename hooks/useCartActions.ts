import { syncAddToCart, syncRemoveItem, syncUpdateQty } from "@/slices/cart.thunks";
import { addToCart, decreaseQty, increaseQty } from "@/slices/cartSlice";
import { useAppDispatch } from "@/store/hooks";
import { RootState } from "@/store/store";
import { CartItem } from "@/types/cart.types";
import { Product } from "@/types/products.types";
import { useSelector } from "react-redux";

export function useCartActions(product: Product, customImageUrl?: string | null) {
    const dispatch = useAppDispatch();
    const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
    const mode: "guest" | "user" = isAuthenticated ? "user" : "guest";

    const cartItem = useSelector(
        (state: RootState) => state.cart[mode].items[product.id]
    );
    const quantity = cartItem?.quantity ?? 0;

    const add = async () => {
        const item: CartItem = {
            ...product,
            quantity: 1,
            serviceType: 'product',
            ...(customImageUrl && { user_custom_image: customImageUrl }),
        };
        dispatch(addToCart({ mode, item }));
        if (mode === "user") {
            try {
                const res = await dispatch(syncAddToCart(product.id)).unwrap();
            } catch (err) {
                dispatch(decreaseQty({ mode, id: product.id }));
            }
        }
    };

    const increase = async () => {
        dispatch(increaseQty({ mode, id: product.id }));
        if (mode === "user" && cartItem) {
            try {
                await dispatch(syncUpdateQty({ id: cartItem.id, quantity: quantity + 1 })).unwrap();
            } catch (err) {
                dispatch(decreaseQty({ mode, id: product.id }));
            }
        }
    };

    const decrease = async () => {
        dispatch(decreaseQty({ mode, id: product.id }));
        if (mode === "user" && cartItem) {
            try {
                if (quantity <= 1) {
                    await dispatch(syncRemoveItem(cartItem.id)).unwrap();
                } else {
                    await dispatch(syncUpdateQty({ id: cartItem.id, quantity: quantity - 1 })).unwrap();
                }
            } catch (err) {
                dispatch(increaseQty({ mode, id: product.id }));
            }
        }
    };

    return { mode, quantity, add, increase, decrease };
}