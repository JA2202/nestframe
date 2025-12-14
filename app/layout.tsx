import "./globals.css";
import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import { Suspense } from "react";
import GtmBridge from "./components/GtmBridge";
import SiteShell from "../components/layout/SiteShell";
import { CartProvider } from "@/components/cart/CartProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  title: "nestframe - Custom AI wall art",
  description:
    "Custom wall art, created in minutes, that looks like it came from a gallery not a prompt.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-nf-bg text-nf-text antialiased">
        <CartProvider>
          <Suspense fallback={null}>
            <GtmBridge />
          </Suspense>
          <SiteShell>{children}</SiteShell>
        </CartProvider>
      </body>
    </html>
  );
}