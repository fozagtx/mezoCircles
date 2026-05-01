"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { WagmiProvider } from "wagmi";
import { Toaster } from "react-hot-toast";
import { wagmiConfig } from "@/lib/wagmi";

export function Providers({ children }: { children: React.ReactNode }) {
  const [qc] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 10_000, refetchOnWindowFocus: false } },
  }));

  // Eager Telegram WebApp init: tells Telegram we're ready, expand to full height.
  useEffect(() => {
    const tg = (typeof window !== "undefined" && (window as any).Telegram?.WebApp) || null;
    if (tg) {
      try { tg.ready(); tg.expand(); tg.setHeaderColor("#1A1A18"); tg.setBackgroundColor("#fafaf7"); } catch {}
    }
  }, []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={qc}>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#1A1A18",
              color: "#fff",
              fontFamily: "JetBrains Mono, monospace",
              fontSize: "13px",
              borderRadius: "8px",
            },
          }}
        />
      </QueryClientProvider>
    </WagmiProvider>
  );
}
