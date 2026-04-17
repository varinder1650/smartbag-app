# Product Customization: Image Upload & Preview — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable users to upload custom images on customizable products (mugs), see a 2D preview overlay, and carry the image through cart/checkout/order for fulfillment.

**Architecture:** Client-side overlay approach. Admin uploads a mockup template + printable area coordinates per product. Mobile app layers the user's uploaded image on top of the template at the defined coordinates. The Cloudinary URL of the user's image is stored in the cart item and order item for fulfillment.

**Tech Stack:** React Native (Expo), Redux Toolkit, Cloudinary, FastAPI (Python), MongoDB, React + Vite (admin panel), shadcn/ui

---

### Task 1: Backend — Add mockup fields to product schema

**Files:**
- Modify: `backend/schema/products.py:19-48`

- [ ] **Step 1: Add PrintableArea model and new fields to ProductBase**

In `backend/schema/products.py`, add a `PrintableArea` model and two new fields to `ProductBase`:

```python
class PrintableArea(BaseModel):
    x: float = Field(default=0.25, ge=0.0, le=1.0)
    y: float = Field(default=0.20, ge=0.0, le=1.0)
    width: float = Field(default=0.50, ge=0.0, le=1.0)
    height: float = Field(default=0.60, ge=0.0, le=1.0)
```

Add to `ProductBase` (after the `keywords` field on line 28):

```python
mockup_template_url: Optional[str] = None
printable_area: Optional[PrintableArea] = None
```

Add to `ProductUpdate` (after the `keywords` field on line 42):

```python
mockup_template_url: Optional[str] = None
printable_area: Optional[PrintableArea] = None
```

- [ ] **Step 2: Verify the backend product routes pass through the new fields**

Check `backend/app/routes/products.py`. Since this project uses MongoDB and Pydantic schemas, the new fields should pass through automatically as long as the schema is used. Run:

```bash
cd /Users/nitingoyal/Desktop/projects/smart_bag/backend
# If there's a test suite:
python -m pytest tests/ -v -k product 2>/dev/null || echo "No test suite found, verify manually"
```

If no tests, verify by reading the product CRUD routes and confirming they use `ProductCreate`/`ProductUpdate` schemas (which now include the new fields via inheritance).

- [ ] **Step 3: Commit**

```bash
cd /Users/nitingoyal/Desktop/projects/smart_bag/backend
git add schema/products.py
git commit -m "feat: add mockup_template_url and printable_area to product schema"
```

---

### Task 2: Backend — Add user_custom_image to order items

**Files:**
- Explore and modify: the order schema/model file in the backend

- [ ] **Step 1: Find the order schema**

```bash
grep -rn "user_custom_image\|order_item\|OrderItem\|class.*Order" /Users/nitingoyal/Desktop/projects/smart_bag/backend/schema/ --include="*.py"
grep -rn "user_custom_image\|order_item\|OrderItem\|class.*Order" /Users/nitingoyal/Desktop/projects/smart_bag/backend/app/ --include="*.py" | head -30
```

- [ ] **Step 2: Add `user_custom_image` field to the product order item**

In the order schema/model, find the product order item structure. Add:

```python
user_custom_image: Optional[str] = None  # Cloudinary URL of user's custom image
```

This field only applies to product-type order items. Service items (porter, printout) don't need it.

- [ ] **Step 3: Ensure the order creation route accepts and stores `user_custom_image`**

In the order creation endpoint (likely `/orders/draft` or `/orders/create`), verify that when building order items from the request payload, the `user_custom_image` field is read from the product item and stored in the order document.

If the endpoint builds order items like:
```python
{
    "type": "product",
    "product_id": item["product_id"],
    "quantity": item["quantity"],
}
```

Add `"user_custom_image": item.get("user_custom_image")` to this dict.

- [ ] **Step 4: Commit**

```bash
cd /Users/nitingoyal/Desktop/projects/smart_bag/backend
git add -A
git commit -m "feat: add user_custom_image field to product order items"
```

---

### Task 3: Admin Panel — Add mockup template upload and printable area inputs

**Files:**
- Modify: `admin-panel/src/types/product.ts:8-27`
- Modify: `admin-panel/src/components/products/ProductFormDialog.tsx:40-135`

- [ ] **Step 1: Update the Product type**

In `admin-panel/src/types/product.ts`, add to the `Product` interface (after `allow_user_description` on line 25):

```typescript
mockup_template_url?: string;
printable_area?: {
    x: number;
    y: number;
    width: number;
    height: number;
};
```

- [ ] **Step 2: Add mockup template state to ProductFormDialog**

In `admin-panel/src/components/products/ProductFormDialog.tsx`, add state for the mockup template. After the `images` state on line 40:

```typescript
const [mockupTemplate, setMockupTemplate] = useState<string[]>([]);
```

Update the `formData` state to include `printable_area` fields. Add to the initial state object (after `allow_user_description: false` on line 54):

```typescript
mockup_template_url: "",
printable_area_x: "25",
printable_area_y: "20",
printable_area_width: "50",
printable_area_height: "60",
```

- [ ] **Step 3: Populate mockup fields when editing an existing product**

In the `useEffect` that populates `formData` when `product` is set (line 57-93), add to the product branch (after `allow_user_description` on line 72):

```typescript
mockup_template_url: product.mockup_template_url || "",
printable_area_x: product.printable_area ? String(product.printable_area.x * 100) : "25",
printable_area_y: product.printable_area ? String(product.printable_area.y * 100) : "20",
printable_area_width: product.printable_area ? String(product.printable_area.width * 100) : "50",
printable_area_height: product.printable_area ? String(product.printable_area.height * 100) : "60",
```

And add to the else branch (reset, after `allow_user_description: false` on line 89):

```typescript
mockup_template_url: "",
printable_area_x: "25",
printable_area_y: "20",
printable_area_width: "50",
printable_area_height: "60",
```

Also reset mockup template images:

```typescript
setMockupTemplate([]);
```

- [ ] **Step 4: Include mockup data in the submit payload**

In `handleSubmit` (line 95-135), add to the `data` object (after `allow_user_description` on line 126), only when `allow_user_images` is true:

```typescript
...(formData.allow_user_images && {
    mockup_template_url: formData.mockup_template_url || undefined,
    printable_area: {
        x: parseFloat(formData.printable_area_x) / 100,
        y: parseFloat(formData.printable_area_y) / 100,
        width: parseFloat(formData.printable_area_width) / 100,
        height: parseFloat(formData.printable_area_height) / 100,
    },
    ...(mockupTemplate.length > 0 && { mockup_template: mockupTemplate }),
}),
```

- [ ] **Step 5: Add mockup template UI section to the form**

In the JSX, after the existing "Customer Interaction Options" section (after the closing `</div>` on line 361, before the submit buttons), add:

```tsx
{/* Mockup Template Section - shown when allow_user_images is ON */}
{formData.allow_user_images && (
    <div className="border rounded-lg p-4 space-y-4 bg-blue-50/50">
        <div className="space-y-2">
            <Label className="text-base font-semibold">Mockup Template Setup</Label>
            <p className="text-sm text-muted-foreground">
                Upload a mockup image and define the printable area where customer images will appear
            </p>
        </div>

        <ImageUploader
            images={mockupTemplate}
            onChange={setMockupTemplate}
            maxImages={1}
            existingImages={product?.mockup_template_url ? [product.mockup_template_url] : undefined}
        />

        <div className="space-y-2">
            <Label className="font-medium">Printable Area (%)</Label>
            <p className="text-xs text-muted-foreground">
                Define where the customer's image appears on the mockup (values are percentages of the template dimensions)
            </p>
            <div className="grid grid-cols-4 gap-3">
                <div className="space-y-1">
                    <Label htmlFor="pa-x" className="text-xs">Left (X)</Label>
                    <Input
                        id="pa-x"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.printable_area_x}
                        onChange={(e) => setFormData({ ...formData, printable_area_x: e.target.value })}
                    />
                </div>
                <div className="space-y-1">
                    <Label htmlFor="pa-y" className="text-xs">Top (Y)</Label>
                    <Input
                        id="pa-y"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.printable_area_y}
                        onChange={(e) => setFormData({ ...formData, printable_area_y: e.target.value })}
                    />
                </div>
                <div className="space-y-1">
                    <Label htmlFor="pa-w" className="text-xs">Width</Label>
                    <Input
                        id="pa-w"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.printable_area_width}
                        onChange={(e) => setFormData({ ...formData, printable_area_width: e.target.value })}
                    />
                </div>
                <div className="space-y-1">
                    <Label htmlFor="pa-h" className="text-xs">Height</Label>
                    <Input
                        id="pa-h"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.printable_area_height}
                        onChange={(e) => setFormData({ ...formData, printable_area_height: e.target.value })}
                    />
                </div>
            </div>
        </div>
    </div>
)}
```

- [ ] **Step 6: Commit**

```bash
cd /Users/nitingoyal/Desktop/projects/smart_bag/admin-panel
git add src/types/product.ts src/components/products/ProductFormDialog.tsx
git commit -m "feat: add mockup template upload and printable area config to admin product form"
```

---

### Task 4: Mobile App — Update TypeScript types

**Files:**
- Modify: `smartbag-app/types/products.types.ts:8-21`
- Modify: `smartbag-app/types/cart.types.ts:54-59`
- Modify: `smartbag-app/components/OrderTracking/types.ts:8-15`

- [ ] **Step 1: Add mockup fields to the Product type**

In `types/products.types.ts`, add after `allow_user_description` (line 20):

```typescript
mockup_template_url?: string;
printable_area?: {
    x: number;
    y: number;
    width: number;
    height: number;
};
```

- [ ] **Step 2: Add `user_custom_image` to ProductCartItem**

In `types/cart.types.ts`, add to the `ProductCartItem` interface (after `discount: number` on line 58):

```typescript
user_custom_image?: string | null;
```

- [ ] **Step 3: Add `user_custom_image` to ProductOrderItem**

In `components/OrderTracking/types.ts`, add to the `ProductOrderItem` interface (after `price: number` on line 15):

```typescript
user_custom_image?: string;
```

- [ ] **Step 4: Commit**

```bash
cd /Users/nitingoyal/Desktop/projects/smart_bag/smartbag-app
git add types/products.types.ts types/cart.types.ts components/OrderTracking/types.ts
git commit -m "feat: add mockup template and user_custom_image to TypeScript types"
```

---

### Task 5: Mobile App — Build the MockupPreview component

**Files:**
- Create: `smartbag-app/components/MockupPreview.tsx`

- [ ] **Step 1: Create the MockupPreview component**

Create `components/MockupPreview.tsx`:

```tsx
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
            {/* Base mockup template */}
            <Image
                source={{ uri: templateUrl }}
                style={{ width: size, height: size, borderRadius: 16 }}
                resizeMode="contain"
            />
            {/* User's image overlaid at the printable area */}
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
```

- [ ] **Step 2: Commit**

```bash
cd /Users/nitingoyal/Desktop/projects/smart_bag/smartbag-app
git add components/MockupPreview.tsx
git commit -m "feat: create MockupPreview component for client-side image overlay"
```

---

### Task 6: Mobile App — Add image upload + preview to product detail page

**Files:**
- Modify: `smartbag-app/app/product/[id].tsx:1-143`

- [ ] **Step 1: Add imports and state**

At the top of `app/product/[id].tsx`, add imports (after line 9):

```typescript
import MockupPreview from "@/components/MockupPreview";
import { uploadToCloudinary } from "@/utils/fileupload";
import * as ImagePicker from "expo-image-picker";
```

Inside the `ProductsDetails` component, after the existing state declarations (after line 16), add:

```typescript
const [customImageUri, setCustomImageUri] = useState<string | null>(null);
const [customImageUrl, setCustomImageUrl] = useState<string | null>(null);
const [uploading, setUploading] = useState(false);
```

- [ ] **Step 2: Add image picker and upload handler**

After the `useEffect` block (after line 44), add:

```typescript
const pickAndUploadImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setCustomImageUri(asset.uri);
    setUploading(true);

    try {
        const url = await uploadToCloudinary(asset.uri, "image/jpeg");
        setCustomImageUrl(url);
    } catch (err) {
        if (__DEV__) console.error("Upload failed:", err);
        setCustomImageUri(null);
        setCustomImageUrl(null);
    } finally {
        setUploading(false);
    }
};

const removeCustomImage = () => {
    setCustomImageUri(null);
    setCustomImageUrl(null);
};
```

- [ ] **Step 3: Add the upload section and preview to the JSX**

In the return JSX, after the description `<Text>` (after line 135, inside the `<View className="px-5">` block), add the customization section:

```tsx
{/* Custom Image Upload Section */}
{product.allow_user_images && product.mockup_template_url && (
    <View className="mt-6 mb-4">
        <Text className="text-lg font-bold text-gray-900 mb-3">
            Customize Your Product
        </Text>

        {customImageUrl && product.printable_area ? (
            <View>
                <MockupPreview
                    templateUrl={product.mockup_template_url}
                    userImageUrl={customImageUrl}
                    printableArea={product.printable_area}
                    size={300}
                />
                <View className="flex-row justify-center mt-4 gap-3">
                    <Pressable
                        onPress={pickAndUploadImage}
                        className="bg-gray-100 px-5 py-3 rounded-xl flex-row items-center"
                    >
                        <Ionicons name="swap-horizontal" size={18} color="#111" />
                        <Text className="ml-2 font-semibold text-gray-900">Change Image</Text>
                    </Pressable>
                    <Pressable
                        onPress={removeCustomImage}
                        className="bg-red-50 px-5 py-3 rounded-xl flex-row items-center"
                    >
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                        <Text className="ml-2 font-semibold text-red-500">Remove</Text>
                    </Pressable>
                </View>
            </View>
        ) : (
            <View>
                {uploading ? (
                    <View className="items-center py-8">
                        <ActivityIndicator size="large" color="#007AFF" />
                        <Text className="mt-3 text-gray-500">Uploading your image...</Text>
                    </View>
                ) : (
                    <Pressable
                        onPress={pickAndUploadImage}
                        className="border-2 border-dashed border-gray-300 rounded-2xl py-10 items-center"
                    >
                        <Ionicons name="cloud-upload-outline" size={40} color="#9CA3AF" />
                        <Text className="mt-3 text-gray-600 font-semibold">Upload Your Image</Text>
                        <Text className="mt-1 text-gray-400 text-sm">Tap to select from gallery</Text>
                    </Pressable>
                )}
            </View>
        )}

        {product.allow_user_images && !customImageUrl && !uploading && (
            <Text className="text-orange-500 text-sm mt-2 text-center">
                Please upload your image to add this product to cart
            </Text>
        )}
    </View>
)}
```

- [ ] **Step 4: Commit**

```bash
cd /Users/nitingoyal/Desktop/projects/smart_bag/smartbag-app
git add app/product/\[id\].tsx
git commit -m "feat: add image upload and mockup preview to product detail page"
```

---

### Task 7: Mobile App — Wire up add-to-cart with custom image

**Files:**
- Modify: `smartbag-app/app/product/[id].tsx` (CartButton section)
- Modify: `smartbag-app/components/CartButton.tsx:1-48`
- Modify: `smartbag-app/hooks/useCartActions.ts:1-57`

- [ ] **Step 1: Update useCartActions to accept and pass user_custom_image**

In `hooks/useCartActions.ts`, update the function signature to accept an optional `customImageUrl`:

```typescript
export function useCartActions(product: Product, customImageUrl?: string | null) {
```

Update the `add` function (line 19-28) to include `user_custom_image`:

```typescript
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
```

- [ ] **Step 2: Update CartButton to accept and pass customImageUrl**

In `components/CartButton.tsx`, update the Props interface and component:

```typescript
interface Props {
    product: Product;
    customImageUrl?: string | null;
    requiresCustomImage?: boolean;
}

export default function CartButton({ product, customImageUrl, requiresCustomImage }: Props) {
    const { quantity, add, increase, decrease } = useCartActions(product, customImageUrl);

    const isAddDisabled = requiresCustomImage && !customImageUrl;
```

Update the "Add to cart" `<Pressable>` (line 17-23) to disable when custom image is required but not provided:

```tsx
{quantity === 0 ? (
    <Pressable
        onPress={add}
        disabled={isAddDisabled}
        className={`flex-row justify-center items-center mx-5 rounded-full p-4 shadow-lg ${
            isAddDisabled ? "bg-gray-400" : "bg-primary"
        }`}
    >
        <Text className="text-white font-extrabold text-lg">
            Add to cart
        </Text>
    </Pressable>
) : (
```

The rest of the component (quantity controls + "View Cart") stays unchanged.

- [ ] **Step 3: Pass customImageUrl from product detail page to CartButton**

In `app/product/[id].tsx`, update the CartButton usage at the bottom of the component (line 141):

```tsx
{product && (
    <Cartbutton
        product={product}
        customImageUrl={customImageUrl}
        requiresCustomImage={product.allow_user_images && !!product.mockup_template_url}
    />
)}
```

- [ ] **Step 4: Commit**

```bash
cd /Users/nitingoyal/Desktop/projects/smart_bag/smartbag-app
git add hooks/useCartActions.ts components/CartButton.tsx app/product/\[id\].tsx
git commit -m "feat: wire up add-to-cart gate requiring custom image for customizable products"
```

---

### Task 8: Mobile App — Show custom image thumbnail in cart

**Files:**
- Modify: `smartbag-app/components/CartProductItem.tsx:1-48`

- [ ] **Step 1: Update CartProductItem to show custom image preview**

The component receives a `ProductCartItem` which now has `user_custom_image`. We show a small "Customized" badge when a custom image is attached. Replace the `<Image>` on line 12-15 with:

```tsx
<View className="relative">
    <Image
        source={{ uri: item.images?.[0] }}
        className="w-20 h-20 rounded-lg bg-gray-100"
    />
    {item.user_custom_image && (
        <View className="absolute bottom-0 left-0 right-0 bg-blue-500 rounded-b-lg py-0.5">
            <Text className="text-white text-[9px] font-bold text-center">Customized</Text>
        </View>
    )}
</View>
```

Add `Text` to the existing imports from `react-native` if not already present.

- [ ] **Step 2: Commit**

```bash
cd /Users/nitingoyal/Desktop/projects/smart_bag/smartbag-app
git add components/CartProductItem.tsx
git commit -m "feat: show custom image indicator in cart product items"
```

---

### Task 9: Mobile App — Pass user_custom_image through checkout order payload

**Files:**
- Modify: `smartbag-app/app/checkout.tsx:59-179`

- [ ] **Step 1: Include user_custom_image in the order items payload**

In `app/checkout.tsx`, inside the `buildOrderItems` callback, update the product item branch (lines 63-70). Change:

```typescript
if (item.serviceType === "product") {
    if (!item.id) {
        if (__DEV__) console.error("Product missing ID:", item);
        return null;
    }
    return {
        type: "product",
        product_id: item.id,
        quantity: item.quantity || 1,
    };
}
```

To:

```typescript
if (item.serviceType === "product") {
    if (!item.id) {
        if (__DEV__) console.error("Product missing ID:", item);
        return null;
    }
    return {
        type: "product",
        product_id: item.id,
        quantity: item.quantity || 1,
        ...(item.user_custom_image && { user_custom_image: item.user_custom_image }),
    };
}
```

Note: `item` here is typed as `CartItem`. To access `user_custom_image`, we need to check if the item is a product type first (which we do with the `serviceType === "product"` check). Since `ProductCartItem` now has `user_custom_image`, TypeScript will allow this access.

- [ ] **Step 2: Commit**

```bash
cd /Users/nitingoyal/Desktop/projects/smart_bag/smartbag-app
git add app/checkout.tsx
git commit -m "feat: include user_custom_image in checkout order payload"
```

---

### Task 10: Mobile App — Show custom image in order tracking

**Files:**
- Modify: `smartbag-app/components/OrderTracking/OrderDetailsSection.tsx:10-32`

- [ ] **Step 1: Update ProductItem in OrderDetailsSection to show custom image**

In `components/OrderTracking/OrderDetailsSection.tsx`, update the `ProductItem` component. After the existing product image (line 13-18), add a custom image indicator:

```tsx
function ProductItem({ item }: { item: Extract<OrderItem, { type: "product" }> }) {
    return (
        <View className="flex-row items-center mb-3 pb-3 border-b border-gray-100">
            {item.product_image?.[0] && typeof item.product_image[0] === 'string' && (
                <Image
                    source={{ uri: item.product_image[0] }}
                    className="w-16 h-16 rounded-lg"
                    resizeMode="cover"
                />
            )}
            <View className="flex-1 ml-3">
                <Text className="font-semibold text-gray-900">
                    {item.product_name || 'Product'}
                </Text>
                <Text className="text-gray-500 text-sm">
                    Qty: {item.quantity} x ₹{item.price}
                </Text>
                {item.user_custom_image && (
                    <View className="flex-row items-center mt-1">
                        <Ionicons name="image-outline" size={14} color="#3B82F6" />
                        <Text className="text-blue-500 text-xs ml-1">Custom image attached</Text>
                    </View>
                )}
            </View>
            <Text className="font-bold text-gray-900">
                ₹{item.quantity * item.price}
            </Text>
        </View>
    );
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/nitingoyal/Desktop/projects/smart_bag/smartbag-app
git add components/OrderTracking/OrderDetailsSection.tsx
git commit -m "feat: show custom image indicator in order tracking details"
```

---

### Task 11: Mobile App — Ensure cart sync handles user_custom_image

**Files:**
- Modify: `smartbag-app/slices/cart.thunks.ts:30-91`

- [ ] **Step 1: Update convertToCartItem to preserve user_custom_image**

In `slices/cart.thunks.ts`, the `convertToCartItem` function converts backend cart items to the frontend `CartItem` type. Update the product branch (lines 44-52) to include `user_custom_image`:

```typescript
if (serviceType === 'product') {
    const productItem: ProductCartItem = {
        ...baseItem,
        serviceType: 'product' as const,
        selling_price: product?.selling_price || product?.price || 0,
        actual_price: product?.actual_price || product?.price || 0,
        discount: product?.discount || 0,
        stock: product?.stock || 0,
        user_custom_image: (backendItem as any).user_custom_image || null,
    };
    return productItem;
}
```

Also update the default fallback (lines 82-90):

```typescript
const defaultItem: ProductCartItem = {
    ...baseItem,
    serviceType: 'product' as const,
    selling_price: product?.selling_price || product?.price || 0,
    actual_price: product?.actual_price || product?.price || 0,
    discount: product?.discount || 0,
    stock: product?.stock || 0,
    user_custom_image: (backendItem as any).user_custom_image || null,
};
return defaultItem;
```

- [ ] **Step 2: Update syncUserCart to pass user_custom_image from backend response**

In the `syncUserCart` thunk (lines 156-195), when building `backendItem`, ensure `user_custom_image` is carried through. After line 188 (inside the `backendItem` construction), the field should be added:

The `backendItem` is constructed from `item` (the raw backend response). Add to the `backendItem` object:

```typescript
const backendItem: BackendCartItem = {
    _id: item._id,
    productId: item.productId,
    quantity: item.quantity,
    product: {
        // ... existing fields ...
    },
    serviceDetails: item.serviceDetails,
};
```

Since `BackendCartItem` doesn't have `user_custom_image`, add it to the type (line 6-27):

```typescript
type BackendCartItem = {
    _id: string;
    productId?: string;
    quantity: number;
    product: {
        id: string;
        name: string;
        price?: number;
        selling_price?: number;
        actual_price?: number;
        discount?: number;
        stock?: number;
        images?: string[];
        serviceType?: "product" | "porter" | "printout";
    };
    serviceDetails?: any;
    user_custom_image?: string;
};
```

Then in `syncUserCart`, pass it through:

```typescript
const backendItem: BackendCartItem = {
    // ... existing fields ...
    user_custom_image: item.user_custom_image || undefined,
};
```

- [ ] **Step 3: Commit**

```bash
cd /Users/nitingoyal/Desktop/projects/smart_bag/smartbag-app
git add slices/cart.thunks.ts
git commit -m "feat: preserve user_custom_image through cart sync operations"
```

---

### Task 12: Install expo-image-picker dependency

**Files:**
- Modify: `smartbag-app/package.json`

- [ ] **Step 1: Check if expo-image-picker is already installed**

```bash
cd /Users/nitingoyal/Desktop/projects/smart_bag/smartbag-app
grep "expo-image-picker" package.json
```

- [ ] **Step 2: Install if not present**

If not found:

```bash
npx expo install expo-image-picker
```

If already installed, skip this step.

- [ ] **Step 3: Commit if changes were made**

```bash
cd /Users/nitingoyal/Desktop/projects/smart_bag/smartbag-app
git add package.json package-lock.json 2>/dev/null; git add yarn.lock 2>/dev/null
git commit -m "chore: add expo-image-picker dependency" 2>/dev/null || echo "Nothing to commit"
```

---

### Task 13: End-to-end manual testing

- [ ] **Step 1: Test admin panel — create a customizable product**

1. Start the admin panel dev server
2. Navigate to Products > Add New Product
3. Toggle "Allow Customer Images" ON
4. Verify the Mockup Template section appears
5. Upload a mug mockup template image
6. Adjust printable area coordinates if needed
7. Fill in other required fields and save
8. Verify the product is created successfully

- [ ] **Step 2: Test mobile app — product detail page**

1. Start the Expo dev server: `npx expo start`
2. Navigate to the customizable product
3. Verify the "Upload Your Image" section appears
4. Verify the "Add to Cart" button is disabled
5. Upload an image from gallery
6. Verify the mockup preview renders (template + overlaid image)
7. Verify "Add to Cart" enables after upload
8. Test "Change Image" button
9. Test "Remove" button
10. Add to cart and verify the item is added

- [ ] **Step 3: Test cart and checkout**

1. Navigate to Cart
2. Verify the customized product shows in the cart
3. Proceed to Checkout
4. Place the order
5. Verify the order goes through

- [ ] **Step 4: Test order tracking**

1. Navigate to Order Tracking for the new order
2. Verify the custom image indicator shows on the order item
