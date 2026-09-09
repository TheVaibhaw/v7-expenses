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

export const CURRENCIES = [
  { country: "Afghanistan", code: "AFN", symbol: "AFN" },
  { country: "Albania", code: "ALL", symbol: "L" },
  { country: "Algeria", code: "DZD", symbol: "DZD" },
  { country: "Andorra", code: "EUR", symbol: "€" },
  { country: "Angola", code: "AOA", symbol: "Kz" },
  { country: "Antigua and Barbuda", code: "XCD", symbol: "$" },
  { country: "Argentina", code: "ARS", symbol: "$" },
  { country: "Armenia", code: "AMD", symbol: "AMD" },
  { country: "Australia", code: "AUD", symbol: "$" },
  { country: "Austria", code: "EUR", symbol: "€" },
  { country: "Azerbaijan", code: "AZN", symbol: "₼" },
  { country: "Bahamas", code: "BSD", symbol: "$" },
  { country: "Bahrain", code: "BHD", symbol: "BHD" },
  { country: "Bangladesh", code: "BDT", symbol: "BDT" },
  { country: "Barbados", code: "BBD", symbol: "$" },
  { country: "Belarus", code: "BYN", symbol: "Br" },
  { country: "Belgium", code: "EUR", symbol: "€" },
  { country: "Belize", code: "BZD", symbol: "$" },
  { country: "Benin", code: "XOF", symbol: "Fr" },
  { country: "Bhutan", code: "BTN", symbol: "Nu." },
  { country: "Bolivia", code: "BOB", symbol: "Bs." },
  { country: "Bosnia and Herzegovina", code: "BAM", symbol: "KM" },
  { country: "Botswana", code: "BWP", symbol: "P" },
  { country: "Brazil", code: "BRL", symbol: "R$" },
  { country: "Brunei", code: "BND", symbol: "$" },
  { country: "Bulgaria", code: "BGN", symbol: "лв" },
  { country: "Burkina Faso", code: "XOF", symbol: "Fr" },
  { country: "Burundi", code: "BIF", symbol: "Fr" },
  { country: "Cabo Verde", code: "CVE", symbol: "$" },
  { country: "Cambodia", code: "KHR", symbol: "KHR" },
  { country: "Cameroon", code: "XAF", symbol: "Fr" },
  { country: "Canada", code: "CAD", symbol: "$" },
  { country: "Central African Republic", code: "XAF", symbol: "Fr" },
  { country: "Chad", code: "XAF", symbol: "Fr" },
  { country: "Chile", code: "CLP", symbol: "$" },
  { country: "China", code: "CNY", symbol: "¥" },
  { country: "Colombia", code: "COP", symbol: "$" },
  { country: "Comoros", code: "KMF", symbol: "Fr" },
  { country: "Congo (DRC)", code: "CDF", symbol: "Fr" },
  { country: "Congo (Republic)", code: "XAF", symbol: "Fr" },
  { country: "Costa Rica", code: "CRC", symbol: "₡" },
  { country: "Croatia", code: "EUR", symbol: "€" },
  { country: "Cuba", code: "CUP", symbol: "$" },
  { country: "Cyprus", code: "EUR", symbol: "€" },
  { country: "Czechia", code: "CZK", symbol: "Kč" },
  { country: "Denmark", code: "DKK", symbol: "kr" },
  { country: "Djibouti", code: "DJF", symbol: "Fr" },
  { country: "Dominica", code: "XCD", symbol: "$" },
  { country: "Dominican Republic", code: "DOP", symbol: "$" },
  { country: "Ecuador", code: "USD", symbol: "$" },
  { country: "Egypt", code: "EGP", symbol: "E£" },
  { country: "El Salvador", code: "USD", symbol: "$" },
  { country: "Equatorial Guinea", code: "XAF", symbol: "Fr" },
  { country: "Eritrea", code: "ERN", symbol: "Nfk" },
  { country: "Estonia", code: "EUR", symbol: "€" },
  { country: "Eswatini", code: "SZL", symbol: "L" },
  { country: "Ethiopia", code: "ETB", symbol: "Br" },
  { country: "Fiji", code: "FJD", symbol: "$" },
  { country: "Finland", code: "EUR", symbol: "€" },
  { country: "France", code: "EUR", symbol: "€" },
  { country: "Gabon", code: "XAF", symbol: "Fr" },
  { country: "Gambia", code: "GMD", symbol: "D" },
  { country: "Georgia", code: "GEL", symbol: "₾" },
  { country: "Germany", code: "EUR", symbol: "€" },
  { country: "Ghana", code: "GHS", symbol: "₵" },
  { country: "Greece", code: "EUR", symbol: "€" },
  { country: "Grenada", code: "XCD", symbol: "$" },
  { country: "Guatemala", code: "GTQ", symbol: "Q" },
  { country: "Guinea", code: "GNF", symbol: "Fr" },
  { country: "Guinea-Bissau", code: "XOF", symbol: "Fr" },
  { country: "Guyana", code: "GYD", symbol: "$" },
  { country: "Haiti", code: "HTG", symbol: "G" },
  { country: "Honduras", code: "HNL", symbol: "L" },
  { country: "Hungary", code: "HUF", symbol: "Ft" },
  { country: "Iceland", code: "ISK", symbol: "kr" },
  { country: "India", code: "INR", symbol: "₹" },
  { country: "Indonesia", code: "IDR", symbol: "Rp" },
  { country: "Iran", code: "IRR", symbol: "IRR" },
  { country: "Iraq", code: "IQD", symbol: "IQD" },
  { country: "Ireland", code: "EUR", symbol: "€" },
  { country: "Israel", code: "ILS", symbol: "₪" },
  { country: "Italy", code: "EUR", symbol: "€" },
  { country: "Jamaica", code: "JMD", symbol: "$" },
  { country: "Japan", code: "JPY", symbol: "¥" },
  { country: "Jordan", code: "JOD", symbol: "JOD" },
  { country: "Kazakhstan", code: "KZT", symbol: "₸" },
  { country: "Kenya", code: "KES", symbol: "KSh" },
  { country: "Kiribati", code: "AUD", symbol: "$" },
  { country: "Kosovo", code: "EUR", symbol: "€" },
  { country: "Kuwait", code: "KWD", symbol: "KWD" },
  { country: "Kyrgyzstan", code: "KGS", symbol: "с" },
  { country: "Laos", code: "LAK", symbol: "₭" },
  { country: "Latvia", code: "EUR", symbol: "€" },
  { country: "Lebanon", code: "LBP", symbol: "LBP" },
  { country: "Lesotho", code: "LSL", symbol: "L" },
  { country: "Liberia", code: "LRD", symbol: "$" },
  { country: "Libya", code: "LYD", symbol: "LYD" },
  { country: "Liechtenstein", code: "CHF", symbol: "Fr" },
  { country: "Lithuania", code: "EUR", symbol: "€" },
  { country: "Luxembourg", code: "EUR", symbol: "€" },
  { country: "Madagascar", code: "MGA", symbol: "Ar" },
  { country: "Malawi", code: "MWK", symbol: "MK" },
  { country: "Malaysia", code: "MYR", symbol: "RM" },
  { country: "Maldives", code: "MVR", symbol: "MVR" },
  { country: "Mali", code: "XOF", symbol: "Fr" },
  { country: "Malta", code: "EUR", symbol: "€" },
  { country: "Marshall Islands", code: "USD", symbol: "$" },
  { country: "Mauritania", code: "MRU", symbol: "MRU" },
  { country: "Mauritius", code: "MUR", symbol: "₨" },
  { country: "Mexico", code: "MXN", symbol: "$" },
  { country: "Micronesia", code: "USD", symbol: "$" },
  { country: "Moldova", code: "MDL", symbol: "L" },
  { country: "Monaco", code: "EUR", symbol: "€" },
  { country: "Mongolia", code: "MNT", symbol: "₮" },
  { country: "Montenegro", code: "EUR", symbol: "€" },
  { country: "Morocco", code: "MAD", symbol: "MAD" },
  { country: "Mozambique", code: "MZN", symbol: "MT" },
  { country: "Myanmar", code: "MMK", symbol: "K" },
  { country: "Namibia", code: "NAD", symbol: "$" },
  { country: "Nauru", code: "AUD", symbol: "$" },
  { country: "Nepal", code: "NPR", symbol: "₨" },
  { country: "Netherlands", code: "EUR", symbol: "€" },
  { country: "New Zealand", code: "NZD", symbol: "$" },
  { country: "Nicaragua", code: "NIO", symbol: "C$" },
  { country: "Niger", code: "XOF", symbol: "Fr" },
  { country: "Nigeria", code: "NGN", symbol: "₦" },
  { country: "North Korea", code: "KPW", symbol: "₩" },
  { country: "North Macedonia", code: "MKD", symbol: "ден" },
  { country: "Norway", code: "NOK", symbol: "kr" },
  { country: "Oman", code: "OMR", symbol: "OMR" },
  { country: "Pakistan", code: "PKR", symbol: "₨" },
  { country: "Palau", code: "USD", symbol: "$" },
  { country: "Palestine", code: "ILS", symbol: "₪" },
  { country: "Panama", code: "PAB", symbol: "B/." },
  { country: "Papua New Guinea", code: "PGK", symbol: "K" },
  { country: "Paraguay", code: "PYG", symbol: "₲" },
  { country: "Peru", code: "PEN", symbol: "S/" },
  { country: "Philippines", code: "PHP", symbol: "₱" },
  { country: "Poland", code: "PLN", symbol: "zł" },
  { country: "Portugal", code: "EUR", symbol: "€" },
  { country: "Qatar", code: "QAR", symbol: "QAR" },
  { country: "Romania", code: "RON", symbol: "lei" },
  { country: "Russia", code: "RUB", symbol: "₽" },
  { country: "Rwanda", code: "RWF", symbol: "Fr" },
  { country: "Saint Kitts and Nevis", code: "XCD", symbol: "$" },
  { country: "Saint Lucia", code: "XCD", symbol: "$" },
  { country: "Saint Vincent and the Grenadines", code: "XCD", symbol: "$" },
  { country: "Samoa", code: "WST", symbol: "T" },
  { country: "San Marino", code: "EUR", symbol: "€" },
  { country: "Sao Tome and Principe", code: "STN", symbol: "Db" },
  { country: "Saudi Arabia", code: "SAR", symbol: "SAR" },
  { country: "Senegal", code: "XOF", symbol: "Fr" },
  { country: "Serbia", code: "RSD", symbol: "дин." },
  { country: "Seychelles", code: "SCR", symbol: "₨" },
  { country: "Sierra Leone", code: "SLE", symbol: "Le" },
  { country: "Singapore", code: "SGD", symbol: "$" },
  { country: "Slovakia", code: "EUR", symbol: "€" },
  { country: "Slovenia", code: "EUR", symbol: "€" },
  { country: "Solomon Islands", code: "SBD", symbol: "$" },
  { country: "Somalia", code: "SOS", symbol: "Sh" },
  { country: "South Africa", code: "ZAR", symbol: "R" },
  { country: "South Korea", code: "KRW", symbol: "₩" },
  { country: "South Sudan", code: "SSP", symbol: "£" },
  { country: "Spain", code: "EUR", symbol: "€" },
  { country: "Sri Lanka", code: "LKR", symbol: "₨" },
  { country: "Sudan", code: "SDG", symbol: "SDG" },
  { country: "Suriname", code: "SRD", symbol: "$" },
  { country: "Sweden", code: "SEK", symbol: "kr" },
  { country: "Switzerland", code: "CHF", symbol: "Fr" },
  { country: "Syria", code: "SYP", symbol: "£" },
  { country: "Taiwan", code: "TWD", symbol: "$" },
  { country: "Tajikistan", code: "TJS", symbol: "ЅМ" },
  { country: "Tanzania", code: "TZS", symbol: "Sh" },
  { country: "Thailand", code: "THB", symbol: "THB" },
  { country: "Timor-Leste", code: "USD", symbol: "$" },
  { country: "Togo", code: "XOF", symbol: "Fr" },
  { country: "Tonga", code: "TOP", symbol: "T$" },
  { country: "Trinidad and Tobago", code: "TTD", symbol: "$" },
  { country: "Tunisia", code: "TND", symbol: "TND" },
  { country: "Turkey", code: "TRY", symbol: "₺" },
  { country: "Turkmenistan", code: "TMT", symbol: "m" },
  { country: "Tuvalu", code: "AUD", symbol: "$" },
  { country: "Uganda", code: "UGX", symbol: "Sh" },
  { country: "Ukraine", code: "UAH", symbol: "₴" },
  { country: "United Arab Emirates", code: "AED", symbol: "AED" },
  { country: "United Kingdom", code: "GBP", symbol: "£" },
  { country: "United States", code: "USD", symbol: "$" },
  { country: "Uruguay", code: "UYU", symbol: "$" },
  { country: "Uzbekistan", code: "UZS", symbol: "UZS" },
  { country: "Vanuatu", code: "VUV", symbol: "Vt" },
  { country: "Vatican City", code: "EUR", symbol: "€" },
  { country: "Venezuela", code: "VES", symbol: "Bs." },
  { country: "Vietnam", code: "VND", symbol: "₫" },
  { country: "Yemen", code: "YER", symbol: "YER" },
  { country: "Zambia", code: "ZMW", symbol: "ZK" },
  { country: "Zimbabwe", code: "ZWL", symbol: "$" },
].map((entry) => ({ id: `${entry.country}-${entry.code}`, ...entry })) as ReadonlyArray<{
  id: string;
  country: string;
  code: string;
  symbol: string;
}>;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];

export const DEFAULT_CURRENCY =  CURRENCIES.find((c) => c.country === "India") ?? CURRENCIES[0];

/** Minimum number of people a split can be divided among (splitting 1 way is meaningless). */
export const MIN_SPLIT_PEOPLE = 2;

/**
 * Max size for an uploaded UPI QR code image, before base64 encoding. It travels in the
 * localStorage draft and in the email API's JSON body (as a base64 data URL, ~33% larger than
 * this), so this is deliberately small - a QR code photo/screenshot never needs to be large to
 * stay scannable in a PDF.
 */
export const MAX_QR_IMAGE_BYTES = 1_000_000;

export const QR_OUTPUT_SIZE = 512;
export const QR_CROP_VIEWPORT = 280;
export const QR_ZOOM_MIN = 1;
export const QR_ZOOM_MAX = 4;
