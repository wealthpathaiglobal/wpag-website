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
  title: {
    default: "Wealth Path AI Global",
    template: "%s | Wealth Path AI Global",
  },

  description:
    "Independent research and development focused on structured financial systems, stability, and the Human Financial Operating System (HFOS).",

  keywords: [
    "Wealth Path AI Global",
    "WPAG",
    "HFOS",
    "Human Financial Operating System",
    "Financial Stability",
    "Financial Research",
    "Structured Finance",
  ],

  authors: [
    {
      name: "Srinivas Goud",
    },
  ],


creator: "Wealth Path AI Global",

manifest: "/manifest.webmanifest",

icons: {
  icon: "/icon.png",
  apple: "/apple-icon.png",
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
