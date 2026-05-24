"use client";

import { useState, type ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider } from "connectkit";
import { wagmiConfig } from "@/lib/wagmi";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider
          mode="light"
          options={{
            initialChainId: 31611,
            hideBalance: false,
            hideTooltips: false,
            walletConnectName: "WalletConnect",
          }}
          customTheme={{
            "--ck-font-family": "var(--font-body)",
            "--ck-border-radius": "8px",
            "--ck-primary-button-background": "var(--color-ink)",
            "--ck-primary-button-color": "var(--color-paper)",
            "--ck-primary-button-border-radius": "6px",
            "--ck-secondary-button-background": "var(--color-paper-2)",
            "--ck-secondary-button-color": "var(--color-ink)",
            "--ck-secondary-button-border-radius": "6px",
            "--ck-body-background": "var(--color-paper)",
            "--ck-body-color": "var(--color-ink)",
            "--ck-body-color-muted": "var(--color-muted)",
            "--ck-focus-color": "var(--color-accent)",
          }}
        >
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
