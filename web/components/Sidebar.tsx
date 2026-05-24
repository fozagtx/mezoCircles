"use client";

import Image from "next/image";
import Link from "next/link";
import { useAccount, useDisconnect } from "wagmi";
import { ConnectKitButton } from "connectkit";

function shortAddr(a: string): string {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export function Sidebar() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  return (
    <aside className="sidebar" aria-label="App navigation">
      <div className="sidebar-top">
        <Link href="/" className="sidebar-wordmark">
          <Image
            src="/7kdk10p5h9j.png"
            alt="mezoCircles"
            width={1024}
            height={1024}
            className="sidebar-logo"
            priority
          />
        </Link>
      </div>

      <div className="sidebar-bottom">
        <div className="sidebar-wallet">
          <span className="sidebar-wallet-label">Wallet</span>
          <span className="sidebar-wallet-addr">
            {isConnected && address ? shortAddr(address) : "Not connected"}
          </span>
        </div>

        {isConnected ? (
          <button
            type="button"
            onClick={() => disconnect()}
            className="sidebar-disconnect"
          >
            Disconnect
          </button>
        ) : (
          <ConnectKitButton.Custom>
            {({ show }) => (
              <button
                type="button"
                onClick={show}
                className="sidebar-connect"
              >
                Connect wallet
              </button>
            )}
          </ConnectKitButton.Custom>
        )}
      </div>
    </aside>
  );
}
