import { http, createConfig } from "wagmi";
import { injected, walletConnect } from "wagmi/connectors";
import { mezoTestnet } from "./chain";

const wcId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

export const wagmiConfig = createConfig({
  chains: [mezoTestnet],
  connectors: [
    injected({ shimDisconnect: true }),
    ...(wcId
      ? [walletConnect({ projectId: wcId, showQrModal: true, metadata: {
          name: "mezoCircles",
          description: "On-chain ROSCA savings circles on Mezo",
          url: "https://mezocircles.app",
          icons: [],
        }})]
      : []),
  ],
  transports: {
    [mezoTestnet.id]: http(),
  },
  ssr: true,
});

export const FACTORY_ADDRESS = (process.env.NEXT_PUBLIC_FACTORY_ADDRESS ?? "0x0000000000000000000000000000000000000000") as `0x${string}`;
export const REPUTATION_ADDRESS = (process.env.NEXT_PUBLIC_REPUTATION_ADDRESS ?? "0x0000000000000000000000000000000000000000") as `0x${string}`;
export const BADGE_ADDRESS = (process.env.NEXT_PUBLIC_BADGE_ADDRESS ?? "0x0000000000000000000000000000000000000000") as `0x${string}`;

// Optional Mezo banking integrations. Both default to zero (= not configured) on testnet
// until the user fills these in with real Mezo testnet addresses.
export const MUSD_ADDRESS = (process.env.NEXT_PUBLIC_MUSD_ADDRESS ?? "0x0000000000000000000000000000000000000000") as `0x${string}`;
export const YIELD_VAULT_ADDRESS = (process.env.NEXT_PUBLIC_YIELD_VAULT_ADDRESS ?? "0x0000000000000000000000000000000000000000") as `0x${string}`;

const ZERO = "0x0000000000000000000000000000000000000000";

/// True only when all three contract addresses are real (non-zero).
/// Hooks gate on this so they don't hang forever calling a non-existent contract.
export const CONTRACTS_DEPLOYED =
  FACTORY_ADDRESS.toLowerCase() !== ZERO &&
  REPUTATION_ADDRESS.toLowerCase() !== ZERO &&
  BADGE_ADDRESS.toLowerCase() !== ZERO;

export const MUSD_AVAILABLE = MUSD_ADDRESS.toLowerCase() !== ZERO;
export const YIELD_VAULT_AVAILABLE = YIELD_VAULT_ADDRESS.toLowerCase() !== ZERO && MUSD_AVAILABLE;
