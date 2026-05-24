"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { Modal } from "@/components/Modal";

const STORAGE_KEY = "mezocircles:getting-started-seen";

const steps = [
  {
    title: "Connect owner wallet",
    detail: "Use the wallet that owns this vault so actions are allowed.",
  },
  {
    title: "Check limits",
    detail: "Minimum debt is 1,800 MUSD and the position must stay above 110% ICR.",
  },
  {
    title: "Open position",
    detail: "Deposit BTC collateral, choose MUSD debt, then confirm the vault transaction.",
  },
  {
    title: "Monitor risk",
    detail: "Watch ICR, liquidation price, and BTC drop buffer after the position is live.",
  },
  {
    title: "Manage debt",
    detail: "Add BTC, repay MUSD after approval, or close when the full debt is available.",
  },
] as const;

export function GettingStartedGuide() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let shouldOpen = false;
    try {
      if (!window.localStorage.getItem(STORAGE_KEY)) {
        window.localStorage.setItem(STORAGE_KEY, "1");
        shouldOpen = true;
      }
    } catch {
      shouldOpen = true;
    }

    if (!shouldOpen) return;
    const id = window.setTimeout(() => setOpen(true), 0);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <>
      <button
        type="button"
        className="sidebar-demo-tag"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <span className="sidebar-demo-dot" aria-hidden="true" />
        <span>Demo</span>
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Demo flow"
      >
        <div className="guide-flow" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
        <ol className="guide-steps">
          {steps.map((step, index) => (
            <li key={step.title} style={{ "--guide-step": index } as CSSProperties}>
              <span className="guide-step-index">{index + 1}</span>
              <div>
                <strong>{step.title}</strong>
                <p>{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>
        <button
          type="button"
          className="guide-primary"
          onClick={() => setOpen(false)}
        >
          Got it
        </button>
      </Modal>
    </>
  );
}
