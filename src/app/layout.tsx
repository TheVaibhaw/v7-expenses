import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  APP_NAME,
  APP_DESCRIPTION,
  SITE_URL,
  PARENT_URL,
  PARENT_BRAND,
  RESUME_MAKER_URL,
  IMAGE_CROPPER_URL,
  IMAGE_CONVERTER_URL,
  CREATOR_NAME,
  CREATOR_URL,
  CREATOR_INSTAGRAM_URL,
} from "@/lib/constants";
import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-mono",
});

const TITLE = "Free Expense Tracker & Purchase Receipt PDF Generator";

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: {
    default: `${TITLE} | ${APP_NAME}`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  keywords: [
    "The V7 Ninja",
    "TheV7Ninja",
    "thev7ninja.in",
    "The V7 Ninja Expense Tracker",
    "V7 Ninja tools",
    "Vaibhaw Kumar",
    "expense tracker",
    "free expense tracker",
    "purchase tracker",
    "expense report PDF",
    "generate expense PDF",
    "market purchase tracker",
    "split expenses",
    "UPI payment receipt",
    "online receipt generator",
    "email expense report",
    "browser expense tracker",
    "private expense tracker",
    "no signup expense tracker",
    "expense tracker no login",
  ],
  authors: [{ name: CREATOR_NAME, url: CREATOR_URL }],
  creator: PARENT_BRAND,
  publisher: PARENT_BRAND,
  formatDetection: {
    email: false,
    telephone: false,
    address: false,
  },
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: SITE_URL,
  },
  category: "technology",
  openGraph: {
    title: `${TITLE} | ${APP_NAME}`,
    description: APP_DESCRIPTION,
    url: SITE_URL,
    siteName: APP_NAME,
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: `${APP_NAME} - Track purchases and generate a PDF`,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} | ${APP_NAME}`,
    description: "Track purchases, generate a professional PDF, and email it - free, private, no signup.",
    creator: "@thev7ninja",
    images: ["/og-image.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  manifest: "/manifest.json",
};

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Expense Tracker",
        item: `${SITE_URL}/#tracker`,
      },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: APP_NAME,
    url: SITE_URL,
    description: APP_DESCRIPTION,
    applicationCategory: "FinanceApplication, BusinessApplication",
    operatingSystem: "Windows, macOS, Linux, iOS, Android",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    author: {
      "@type": "Person",
      name: CREATOR_NAME,
      url: CREATOR_URL,
      sameAs: [
        CREATOR_URL,
        CREATOR_INSTAGRAM_URL,
        PARENT_URL,
        RESUME_MAKER_URL,
        IMAGE_CROPPER_URL,
        IMAGE_CONVERTER_URL,
      ],
    },
    featureList: [
      "Add unlimited purchase line items with price, payment method, and date/time",
      "Automatic running total",
      "Optional payer details (phone, UPI ID, notes) shown on the PDF",
      "Download a professional PDF record instantly",
      "Email the PDF to one or more recipients",
      "100% browser-based - drafts are saved only to your device",
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Is this expense tracker really free?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. There is no signup, no account, and no paywall. You can add expenses, download a PDF, and email it for free.",
        },
      },
      {
        "@type": "Question",
        name: "Where is my expense data stored?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Entirely in your browser's local storage, on your own device. Nothing is saved to a server or database - closing the tab does not send your data anywhere.",
        },
      },
      {
        "@type": "Question",
        name: "Can I email the expense PDF to someone else?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Enter one or more recipient email addresses and the same PDF you'd download is generated and emailed as an attachment.",
        },
      },
      {
        "@type": "Question",
        name: "What currency does the PDF use?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Amounts are shown in Indian Rupees (INR / ₹) by default, matching common use cases like UPI payments.",
        },
      },
    ],
  },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="author" href={CREATOR_URL} />
        <link rel="me" href={CREATOR_URL} />
        {jsonLd.map((entry, i) => (
          <script
            key={i}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(entry) }}
          />
        ))}
      </head>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
