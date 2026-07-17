import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/context/StoreContext";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Product Config Prototype",
  description: "Prototype for Digital Storefront Product Configuration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={geistMono.variable}
      suppressHydrationWarning
    >
      <body
        className="font-sans antialiased text-slate-900 bg-slate-50"
        suppressHydrationWarning
      >
        <StoreProvider>
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}
