import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Providers } from "./providers";
import "driver.js/dist/driver.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "mezoCircles",
  description:
    "Borrow dollars against your Bitcoin. Deposit BTC, borrow MUSD, and repay when ready.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
