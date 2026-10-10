import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { InlineScript } from "@/app/components/common/InlineScript";
import { Toaster } from "@/app/components/ui";
import { THEME_INIT_SCRIPT } from "@/constants/theme";

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
  title: { default: "Invoice SaaS", template: "%s · Invoice SaaS" },
  description: "Products, customers, orders and GST invoices for B2B businesses.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The theme script sets data-theme on <html> before React loads.
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <InlineScript html={THEME_INIT_SCRIPT} />
      </head>
      {/* Browser extensions (e.g. ColorZilla) add attributes to <body> before React loads. */}
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
