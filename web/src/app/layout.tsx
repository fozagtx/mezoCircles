import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { Providers } from "./providers";
import { Shell } from "@/components/Shell";

export const metadata: Metadata = {
  title: "mezoCircles — Save together on Bitcoin",
  description: "On-chain ROSCA savings circles on Mezo. Save BTC together, take turns, level up.",
};

export const viewport: Viewport = {
  themeColor: "#1A1A18",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Telegram WebApp SDK — non-blocking; layout works without it */}
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
        <Providers>
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  );
}
