import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RecipeTok",
  description: "Turn TikTok recipes into your meal plan",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "RecipeTok",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#FF6B35",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} bg-[#F8F7F4] text-gray-900 antialiased h-full`}>
        {children}
      </body>
    </html>
  );
}
