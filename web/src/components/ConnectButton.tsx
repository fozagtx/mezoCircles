"use client";

import { useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import { mezoTestnet } from "@/lib/chain";
import { shortAddr } from "@/lib/utils";
import toast from "react-hot-toast";

export function ConnectButton() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  if (!mounted) {
    return <button className="btn-primary" disabled>connect</button>;
  }

  if (!isConnected) {
    const injected = connectors.find(c => c.id === "injected") ?? connectors[0];
    return (
      <button
        className="btn-primary"
        onClick={() => {
          if (!injected) { toast.error("No wallet detected"); return; }
          connect({ connector: injected });
        }}
        disabled={isPending}
      >
        {isPending ? "connecting…" : "connect"}
      </button>
    );
  }

  if (chainId !== mezoTestnet.id) {
    return (
      <button className="btn-red" onClick={() => switchChain({ chainId: mezoTestnet.id })}>
        switch to mezo
      </button>
    );
  }

  return (
    <button className="btn-ghost" onClick={() => disconnect()} title="disconnect">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      <span className="font-mono">{shortAddr(address)}</span>
    </button>
  );
}
