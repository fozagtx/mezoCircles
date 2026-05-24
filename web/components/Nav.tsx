"use client";

import Link from "next/link";
import { ConnectKitButton } from "connectkit";

export function Nav() {
  return (
    <nav aria-label="Primary" className="nav-pill">
      <Link href="/" className="wordmark">
        mezoCircles
      </Link>
      <Link href="/app" className="nav-link">
        Borrow
      </Link>
      <ConnectKitButton.Custom>
        {({ isConnected, show, truncatedAddress }) => (
          <button type="button" onClick={show} className="cta-fill">
            {isConnected ? truncatedAddress : "Connect wallet"}
          </button>
        )}
      </ConnectKitButton.Custom>
    </nav>
  );
}
