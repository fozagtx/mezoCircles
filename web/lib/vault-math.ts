export type IcrZone = "safe" | "caution" | "danger" | "liquidatable";

const MIN_ICR = 1.1;
const SAFE_ICR = 1.5;
const CAUTION_ICR = 1.25;

export function icrZone(icrPct: number): IcrZone {
  if (icrPct < MIN_ICR * 100) return "liquidatable";
  if (icrPct < CAUTION_ICR * 100) return "danger";
  if (icrPct < SAFE_ICR * 100) return "caution";
  return "safe";
}

export const ZONE_LABEL: Record<IcrZone, string> = {
  safe: "Safe",
  caution: "Caution",
  danger: "Danger",
  liquidatable: "Liquidatable",
};

/**
 * Effective ICR % given collateral, debt, and current BTC price (in USD).
 * Returns 0 for zero/negative debt (open position, no liquidation risk).
 */
export function icrPercent(
  collateralBtc: number,
  debtMusd: number,
  btcUsd: number,
): number {
  if (debtMusd <= 0 || collateralBtc <= 0 || btcUsd <= 0) return 0;
  return ((collateralBtc * btcUsd) / debtMusd) * 100;
}

/**
 * The BTC price (USD) at which this position becomes liquidatable
 * (ICR drops to the protocol minimum, 110%).
 */
export function liquidationPriceUsd(
  collateralBtc: number,
  debtMusd: number,
): number {
  if (collateralBtc <= 0) return 0;
  return (debtMusd * MIN_ICR) / collateralBtc;
}

/**
 * % drop from current BTC price to the liquidation price. Negative if already past.
 */
export function distanceToLiqPct(
  currentBtcUsd: number,
  liquidationBtcUsd: number,
): number {
  if (currentBtcUsd <= 0) return 0;
  return ((currentBtcUsd - liquidationBtcUsd) / currentBtcUsd) * 100;
}

export function formatUsd(v: number): string {
  return v.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

export function formatPct(v: number, frac = 1): string {
  return v.toLocaleString(undefined, { maximumFractionDigits: frac }) + "%";
}
