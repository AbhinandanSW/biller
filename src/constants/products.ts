/** GST slabs offered when adding a product. */
export const GST_RATES = ["0", "0.25", "3", "5", "12", "18", "28", "40"] as const;

/** Images are resized in the browser to fit this box before upload. */
export const PRODUCT_IMAGE_MAX_DIMENSION = 800;
/** Upload cap after resizing; keeps the request under the 1 MB Server Action limit. */
export const PRODUCT_IMAGE_MAX_BYTES = 900 * 1024;
export const PRODUCT_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

/** Most products offered in the order screen's item picker. */
export const PRODUCT_OPTIONS_LIMIT = 1000;
