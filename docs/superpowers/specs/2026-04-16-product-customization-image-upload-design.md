# Product Customization: Image Upload & Preview System

**Date:** 2026-04-16
**Status:** Approved
**Approach:** Client-Side Overlay (Approach A)

## Summary

When an admin marks a product as customizable (`allow_user_images: true`) and provides a mockup template, users on the product detail page must upload an image before adding to cart. The app renders a 2D preview by overlaying the user's image onto the mockup template at a defined printable area. The uploaded image URL is carried through cart, checkout, and order for fulfillment.

## Requirements

- Mugs first, expand to other product types later
- Basic 2D overlay preview (flat image on a mockup template, no 3D)
- Upload + preview on the product detail page, required before add-to-cart
- No user adjustment of image position/size -- placed as-is
- Admin uploads a per-product mockup template with printable area coordinates
- Client-side compositing only (no server-side image processing)

## Data Model Changes

### Product Model (backend `schema/products.py`)

Two new fields added to the product schema:

```python
mockup_template_url: Optional[str] = None   # Cloudinary URL of the mockup template image
printable_area: Optional[dict] = None        # Coordinates defining the printable zone
```

`printable_area` structure:

```json
{
  "x": 0.25,       // Left offset as % of template width (0.0 - 1.0)
  "y": 0.20,       // Top offset as % of template height (0.0 - 1.0)
  "width": 0.50,   // Width of printable zone as % of template width
  "height": 0.60   // Height of printable zone as % of template height
}
```

Percentages are used so the overlay scales correctly across screen sizes.

### Cart Item Model (mobile `cart.types.ts`)

```typescript
user_custom_image: string | null  // Cloudinary URL of user's uploaded image
```

### Order Item Model (backend)

Same `user_custom_image` field stored per order item for fulfillment reference.

## Admin Panel Changes

**Location:** `admin-panel/src/components/products/ProductFormDialog.tsx`

When `allow_user_images` is toggled ON, two additional fields appear:

1. **Mockup Template Upload** -- separate image uploader (reusing existing `ImageUploader` component) for the mockup template. Distinct from the product gallery images.

2. **Printable Area Coordinates** -- four number inputs (x%, y%, width%, height%) defining where the user's image lands on the template. Defaults: x:25%, y:20%, width:50%, height:60%.

**Validation:**
- If `allow_user_images` is ON, `mockup_template_url` is required
- `printable_area` falls back to defaults if not specified

**Admin flow:**
1. Admin creates/edits product, toggles `allow_user_images` ON
2. Uploads product photos (existing flow, unchanged)
3. Uploads mockup template image (new)
4. Optionally adjusts printable area coordinates (new)
5. Saves -- backend stores everything in the product document

## Product Detail Page (Mobile App)

**Location:** `app/product/[id].tsx`

When product has `allow_user_images: true`:

### Upload Section

- "Upload Your Image" button appears below product images/description
- Uses `expo-image-picker` to pick from gallery or camera
- Uploads to Cloudinary via existing `uploadToCloudinary()` utility
- Shows upload progress indicator (reuse pattern from printout uploads)

### Preview Section (after successful upload)

- Mockup template image renders as the base layer
- User's uploaded image renders on top, positioned using `printable_area` coordinates
- Implementation: React Native `<View>` with `<Image>` stacking -- template as background, user image absolutely positioned within printable area bounds
- "Change Image" button to re-upload
- "Remove" button to clear selection

### Add to Cart Gate

- If `allow_user_images` is true and no image uploaded: "Add to Cart" button is **disabled** with message "Please upload your image first"
- Once uploaded: button enables normally
- Cloudinary URL passed as `user_custom_image` when adding to cart

### Cart Display

- Cart item for customized products shows a small thumbnail of the preview (template + overlay)

## Order Flow & Fulfillment

### Checkout (`app/checkout.tsx`)

- No changes. `user_custom_image` URL is already part of the cart item and gets included in the order payload to `POST /orders/create`.

### Backend Order Creation

- Order model stores `user_custom_image` per order item
- No server-side image processing -- Cloudinary URL is the source of truth

### Order Confirmation & Tracking (`app/order-tracking.tsx`)

- Order detail shows a small preview thumbnail (mockup + overlay)
- `user_custom_image` URL visible in order item details

### Admin Panel Order View

- Customized order items display:
  - The uploaded image (direct Cloudinary link, downloadable for fulfillment)
  - The preview composite for reference
- Fulfillment team uses the direct image to print the mug

### Image Lifecycle

- Images persist in Cloudinary indefinitely (tied to the order)
- No cleanup needed -- these are order assets

## Architecture Diagram

```
Admin Panel                          Mobile App
-----------                          ----------
Upload mockup template ──> Product   Product Detail Page
Set printable_area coords  Model     ├── Fetch product (has mockup_template_url + printable_area)
Toggle allow_user_images     │       ├── User picks image (expo-image-picker)
                             │       ├── Upload to Cloudinary ──> user_custom_image URL
                             │       ├── Preview: template + overlay (client-side)
                             │       └── Add to Cart (with user_custom_image)
                             │                    │
                             │                    ▼
                             │              Checkout ──> POST /orders/create
                             │                              │
                             ▼                              ▼
                          MongoDB              Order stored with user_custom_image
                                               Admin downloads image for fulfillment
```

## Files to Modify

### Backend
- `backend/schema/products.py` -- add `mockup_template_url`, `printable_area` fields
- `backend/app/routes/products.py` -- ensure new fields pass through CRUD
- Order schema -- add `user_custom_image` to order items

### Admin Panel
- `admin-panel/src/components/products/ProductFormDialog.tsx` -- conditional mockup template upload + printable area inputs
- Order detail view -- show custom image + preview for fulfillment

### Mobile App
- `types/products.types.ts` -- add `mockup_template_url`, `printable_area` to Product type
- `types/cart.types.ts` -- add `user_custom_image` to CartItem type
- `app/product/[id].tsx` -- upload section, preview section, add-to-cart gate
- `slices/cartSlice.ts` -- pass `user_custom_image` through cart operations
- `app/(tabs)/cart.tsx` -- show preview thumbnail for customized items
- `app/checkout.tsx` -- ensure `user_custom_image` included in order payload
- `app/order-tracking.tsx` -- show preview in order details
