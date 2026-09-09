export const APP_NAME = "The V7 Ninja Expense Tracker";

export const APP_TAGLINE = "Free, private, browser-based expense & purchase tracker.";

export const APP_DESCRIPTION =
  "Track purchases and expenses in your browser and generate a clean, professional PDF record - complete with payment details - in seconds. Optionally email it to anyone. 100% free, no signup, nothing stored on a server.";

/**
 * Canonical production URL of this tool, used for metadata, sitemap,
 * robots, and JSON-LD. Do not change without updating DNS/hosting.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://expenses.thev7ninja.in";

/** The V7 Ninja, the parent brand this tool belongs to. */
export const PARENT_URL = "https://thev7ninja.in";
export const PARENT_BRAND = "The V7 Ninja";

/** Sibling tools under the same brand, linked for JSON-LD identity purposes. */
export const RESUME_MAKER_URL = "https://resume-maker.thev7ninja.in";
export const IMAGE_CROPPER_URL = "https://image-cropper.thev7ninja.in";
export const IMAGE_CONVERTER_URL = "https://image-converter.thev7ninja.in";

/** Creator identity, used for author metadata and JSON-LD Person/sameAs entries. */
export const CREATOR_NAME = "Vaibhaw Kumar";
export const CREATOR_URL = "https://vaibhawkumar.in";
export const CREATOR_INSTAGRAM_HANDLE = "thev7ninja";
export const CREATOR_INSTAGRAM_URL = `https://www.instagram.com/${CREATOR_INSTAGRAM_HANDLE}`;

/** How long to wait after the last edit before writing the draft to localStorage. */
export const AUTOSAVE_DEBOUNCE_MS = 600;

/** Payment methods available for a line item. */
export const PAYMENT_METHODS = ["Cash", "UPI", "Card", "Bank Transfer"] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const CURRENCY_SYMBOL = "₹";
export const CURRENCY_CODE = "INR";
