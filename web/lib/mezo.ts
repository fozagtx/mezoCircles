import { defineChain } from "viem";

export const mezoTestnet = defineChain({
  id: 31611,
  name: "Mezo Testnet",
  nativeCurrency: { name: "BTC", symbol: "BTC", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.test.mezo.org"] } },
  blockExplorers: {
    default: { name: "Mezo Explorer", url: "https://explorer.test.mezo.org" },
  },
  testnet: true,
});

export const MEZO_TESTNET = {
  borrowerOps: "0xa14cbA6DD12D537A8decc7dd3c4aC413B8711eba" as const,
  troveManager: "0x7FE0A5a7EeBD88530c58824475edEae33424671F" as const,
  musd: "0xf9BBcCC0F1b68EA07c86de6F88C76b3d8E2dD0af" as const,
  // Liquity-style oracle. fetchPrice() returns 18-dec USD per BTC.
  // Testnet's price is a stubbed value (~$20M/BTC) — surfaced in UI as such.
  priceFeed: "0xf28B0d5165b4ad9D5C04CdE1E37B400f8ca5A8cb" as const,
};

// Set via NEXT_PUBLIC_VAULT_ADDRESS after running scripts/deploy-testnet.sh.
// Read at runtime; absence is a real state (vault not yet deployed), not an error.
export const VAULT_ADDRESS = (process.env.NEXT_PUBLIC_VAULT_ADDRESS ?? "") as `0x${string}` | "";
