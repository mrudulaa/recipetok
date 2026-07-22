import type { Metadata, Viewport } from "next";
import "./globals.css";

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
  themeColor: "#FAF8F4",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ height: "100%", background: "#FAF8F4" }}>
      <body style={{ height: "100%", background: "#FAF8F4", margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}
