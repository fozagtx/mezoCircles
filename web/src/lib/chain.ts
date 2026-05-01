import { defineChain } from "viem";

export const mezoTestnet = defineChain({
  id: 31611,
  name: "Mezo Testnet",
  nativeCurrency: { name: "Bitcoin", symbol: "BTC", decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_RPC_URL ?? "https://rpc.test.mezo.org"] },
  },
  blockExplorers: {
    default: {
      name: "Mezo Explorer",
      url: process.env.NEXT_PUBLIC_EXPLORER_URL ?? "https://explorer.test.mezo.org",
    },
  },
  testnet: true,
});
