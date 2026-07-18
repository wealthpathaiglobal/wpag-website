import { OrganizationJsonLd } from "@/components/seo/organization-json-ld";
import { WebsiteJsonLd } from "@/components/seo/website-json-ld";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://wealthpathaiglobal.com"),

  title: {
    default: "Wealth Path AI Global",
    template: "%s | Wealth Path AI Global",
  },

  description:
    "Wealth Path AI Global is an independent research organization developing structured financial systems and the Human Financial Operating System (HFOS) to advance financial stability.",

  keywords: [
    "Wealth Path AI Global",
    "WPAG",
    "HFOS",
    "Human Financial Operating System",
    "Financial Stability",
    "Financial Research",
    "Structured Financial Systems",
  ],

  authors: [
    {
      name: "Srinivas Goud",
    },
  ],

  creator: "Wealth Path AI Global",
  publisher: "Wealth Path AI Global",

  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://wealthpathaiglobal.com",
    siteName: "Wealth Path AI Global",
    title: "Wealth Path AI Global",
    description:
      "An independent research organization developing structured financial systems and the Human Financial Operating System (HFOS).",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Wealth Path AI Global",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Wealth Path AI Global",
    description:
      "An independent research organization developing structured financial systems and the Human Financial Operating System (HFOS).",
    images: ["/twitter-image"],
  },

  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <OrganizationJsonLd />
        <WebsiteJsonLd />

        {children}
      </body>
    </html>
  );
}