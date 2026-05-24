import { createConfig, http } from "wagmi";
import { getDefaultConfig } from "connectkit";
import { mezoTestnet } from "./mezo";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "";

export const wagmiConfig = createConfig(
  getDefaultConfig({
    appName: "mezoCircles",
    appDescription: "Per-user MUSD Trove on Mezo testnet.",
    appUrl: "https://github.com/fozagtx/mezoCircles",
    walletConnectProjectId: projectId,
    chains: [mezoTestnet],
    transports: {
      [mezoTestnet.id]: http("https://rpc.test.mezo.org"),
    },
    ssr: true,
  }),
);
