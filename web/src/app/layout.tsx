import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Shell } from "@/components/Shell";

export const metadata: Metadata = {
  title: "mezoCircles — Save BTC together",
  description: "Save BTC together. On-chain rotating savings circles on Mezo, built for the new generation.",
};

export const viewport: Viewport = {
  themeColor: "#F5F0E0",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  );
}
