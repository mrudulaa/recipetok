import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

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
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className} style={{ height: "100%", background: "#ffffff" }}>
      <body style={{ height: "100%", background: "#ffffff", margin: 0, padding: 0, color: "#1A1A1A" }}>
        {children}
      </body>
    </html>
  );
}
