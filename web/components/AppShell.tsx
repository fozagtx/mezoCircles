"use client";

import { useEffect, useRef } from "react";
import { ConnectKitButton } from "connectkit";
import { driver } from "driver.js";
import { useAccount } from "wagmi";
import { Sidebar } from "@/components/Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isConnected, status } = useAccount();
  const isCheckingWallet = status === "connecting" || status === "reconnecting";
  const connectPromptRef = useRef<ReturnType<typeof driver> | null>(null);
  const promptShownRef = useRef(false);

  useEffect(() => {
    if (isConnected) {
      promptShownRef.current = false;
      connectPromptRef.current?.destroy();
      connectPromptRef.current = null;
      return;
    }

    if (isCheckingWallet || promptShownRef.current) return;

    const promptTimer = window.setTimeout(() => {
      if (!document.querySelector(".connect-again-trigger")) return;

      const connectPrompt = driver({
        steps: [
          {
            element: ".connect-again-trigger",
            popover: {
              title: "Connect wallet",
              description: "Click Connect again to unlock the dashboard.",
              side: "right",
              align: "center",
            },
          },
        ],
        animate: true,
        overlayColor: "#11100d",
        overlayOpacity: 0.16,
        allowClose: true,
        allowKeyboardControl: true,
        overlayClickBehavior: "close",
        stagePadding: 8,
        stageRadius: 4,
        popoverClass: "mezo-driver-popover",
        popoverOffset: 12,
        showButtons: ["close"],
        doneBtnText: "Got it",
      });

      connectPromptRef.current = connectPrompt;
      promptShownRef.current = true;
      connectPrompt.drive();
    }, 220);

    return () => window.clearTimeout(promptTimer);
  }, [isConnected, isCheckingWallet]);

  useEffect(() => {
    return () => connectPromptRef.current?.destroy();
  }, []);

  if (!isConnected) {
    return (
      <div className="app-shell app-shell-locked">
        <div className="app-shell-background" aria-hidden="true" inert>
          <Sidebar />
          <main className="app-main lock-preview">
            <div className="lock-preview-grid">
              <section className="card lock-preview-card">
                <span className="lock-preview-line lock-preview-line-short" />
                <span className="lock-preview-line lock-preview-line-title" />
                <div className="lock-preview-metrics">
                  <span />
                  <span />
                  <span />
                </div>
                <span className="lock-preview-line" />
                <span className="lock-preview-line" />
                <span className="lock-preview-line" />
              </section>
              <section className="card lock-preview-card">
                <span className="lock-preview-line lock-preview-line-short" />
                <span className="lock-preview-line lock-preview-line-title" />
                <span className="lock-preview-field" />
                <span className="lock-preview-field" />
                <span className="lock-preview-button" />
              </section>
            </div>
          </main>
        </div>
        <main className="app-main app-main-gate" aria-label="Connect wallet">
          <section
            className="card connect-gate"
            role="dialog"
            aria-modal="true"
            aria-label="Connect wallet"
          >
            {isCheckingWallet ? (
              <div className="connect-gate-loading skeleton-rows" aria-hidden="true">
                <span className="skeleton-row" />
                <span className="skeleton-row" />
              </div>
            ) : (
              <>
                <div className="connect-gate-copy">
                  <div className="connect-gate-actions">
                    <ConnectKitButton.Custom>
                      {({ show }) => (
                        <button
                          type="button"
                          onClick={show}
                          className="sidebar-connect connect-again-trigger"
                          autoFocus
                        >
                          Connect again
                        </button>
                      )}
                    </ConnectKitButton.Custom>
                  </div>
                </div>
                <div className="connect-arrow-animation" aria-hidden="true">
                  <span className="connect-arrow-glyph">&larr;</span>
                </div>
              </>
            )}
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">{children}</div>
    </div>
  );
}
