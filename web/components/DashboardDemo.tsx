"use client";

import { driver, type DriveStep } from "driver.js";

const steps: DriveStep[] = [
  {
    element: ".monitor-card",
    popover: {
      title: "Position",
      description: "Track collateral, debt, ICR, liquidation price, and BTC drop buffer.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "#borrowing-limits",
    popover: {
      title: "Limits",
      description: "Check the minimum debt, ICR floor, interest range, and fees before acting.",
      side: "right",
      align: "start",
    },
  },
  {
    element: ".action-card",
    popover: {
      title: "Actions",
      description: "Open, add collateral, repay, approve MUSD, or close the position here.",
      side: "left",
      align: "start",
    },
  },
];

export function DashboardDemo() {
  function startDemo() {
    const availableSteps = steps.filter((step) => {
      if (!step.element || typeof step.element !== "string") return true;
      return Boolean(document.querySelector(step.element));
    });

    driver({
      steps: availableSteps,
      animate: true,
      overlayColor: "#11100d",
      overlayOpacity: 0.24,
      smoothScroll: true,
      allowClose: true,
      allowKeyboardControl: true,
      overlayClickBehavior: "close",
      stagePadding: 8,
      stageRadius: 4,
      popoverClass: "mezo-driver-popover",
      popoverOffset: 12,
      showButtons: ["previous", "next", "close"],
      showProgress: true,
      progressText: "{{current}}/{{total}}",
      nextBtnText: "Next",
      prevBtnText: "Back",
      doneBtnText: "Done",
    }).drive();
  }

  return (
    <button
      type="button"
      className="dashboard-demo-trigger"
      onClick={startDemo}
      aria-label="Start dashboard demo"
    >
      <span className="dashboard-demo-dot" aria-hidden="true" />
      <span>Demo</span>
    </button>
  );
}
