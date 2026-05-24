"use client";

import { useAccount, useReadContracts } from "wagmi";
import { formatEther } from "viem";
import { MezoCirclesVaultAbi } from "@/lib/abi";
import { VAULT_ADDRESS } from "@/lib/mezo";
import { useBtcPrice } from "@/lib/btc-price";
import {
  distanceToLiqPct,
  formatPct,
  formatUsd,
  icrPercent,
  icrZone,
  liquidationPriceUsd,
  ZONE_LABEL,
} from "@/lib/vault-math";

const STATUS_LABEL: Record<number, string> = {
  0: "Not opened",
  1: "Active",
  2: "Closed (owner)",
  3: "Closed (liquidated)",
  4: "Closed (redeemed)",
};

export function VaultStatus() {
  const { address } = useAccount();
  const enabled = Boolean(VAULT_ADDRESS) && Boolean(address);

  const { data, isLoading, isError, error } = useReadContracts({
    contracts: VAULT_ADDRESS
      ? [
          { address: VAULT_ADDRESS, abi: MezoCirclesVaultAbi, functionName: "vaultStatus" },
          { address: VAULT_ADDRESS, abi: MezoCirclesVaultAbi, functionName: "vaultDebt" },
          { address: VAULT_ADDRESS, abi: MezoCirclesVaultAbi, functionName: "vaultCollateral" },
        ]
      : [],
    query: { enabled },
  });

  const { data: btcUsd } = useBtcPrice();
  const priceRow =
    btcUsd !== undefined ? <Row label="BTC price" value={formatUsd(btcUsd)} /> : null;

  if (!VAULT_ADDRESS) {
    return (
      <StateCard
        tone="warning"
        eyebrow="Configuration"
        title="Setup missing"
        detail={
          <>
            Set <code>NEXT_PUBLIC_VAULT_ADDRESS</code> in <code>web/.env.local</code>.
          </>
        }
      >
        <Row label="Network" value="Mezo testnet" />
        {priceRow}
      </StateCard>
    );
  }

  if (!address) {
    return (
      <StateCard
        tone="neutral"
        eyebrow="Wallet"
        title="Connect owner wallet"
        detail="Position reads start after a wallet connects."
      >
        <Row label="Network" value="Mezo testnet" />
        {priceRow}
      </StateCard>
    );
  }

  if (isLoading) {
    return (
      <div className="card status-card" aria-busy="true">
        <StatusTop eyebrow="Position" title="Reading position" tone="neutral" label="Syncing" />
        <SkeletonRows count={4} />
        {priceRow && <div className="status-rows">{priceRow}</div>}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <StateCard
        tone="danger"
        eyebrow="Read failed"
        title="Unable to read position"
        detail={trimErr(error?.message ?? "The app could not read this position.")}
      >
        <Row label="Network" value="Mezo testnet" />
        {priceRow}
      </StateCard>
    );
  }

  const failedRead = data.find((entry) => entry.status === "failure");
  if (failedRead) {
    return (
      <StateCard
        tone="danger"
        eyebrow="Read failed"
        title="Position read failed"
        detail={trimErr(failedRead.error?.message ?? "One of the position reads failed.")}
      >
        <Row label="Network" value="Mezo testnet" />
        {priceRow}
      </StateCard>
    );
  }

  const status = Number(data[0]?.result ?? 0);
  const debt = (data[1]?.result as bigint) ?? 0n;
  const collateral = (data[2]?.result as bigint) ?? 0n;

  const isActive = status === 1;
  const hasPosition = collateral > 0n && debt > 0n;

  const collateralBtc = Number(formatEther(collateral));
  const debtMusd = Number(formatEther(debt));

  const collUsd = btcUsd ? collateralBtc * btcUsd : null;
  const icr = btcUsd ? icrPercent(collateralBtc, debtMusd, btcUsd) : null;
  const liqPrice = hasPosition ? liquidationPriceUsd(collateralBtc, debtMusd) : null;
  const distance =
    btcUsd && liqPrice !== null ? distanceToLiqPct(btcUsd, liqPrice) : null;
  const zone = icr !== null ? icrZone(icr) : null;
  const statusTone = status === 1 ? "success" : status === 0 ? "neutral" : "warning";
  const statusLabel = STATUS_LABEL[status] ?? `Unknown (${status})`;

  return (
    <>
      {zone && (zone === "liquidatable" || zone === "danger") && (
        <LiquidationBanner zone={zone} icrPct={icr ?? 0} />
      )}
      <div className="card status-card">
        <StatusTop eyebrow="Position" title={statusLabel} tone={statusTone} label={statusLabel} />

        {isActive && hasPosition ? (
          <div className="metric-grid">
            <Metric
              label="ICR"
              value={
                icr !== null && zone ? (
                  <>
                    {formatPct(icr)}
                    <span className={`zone-tag zone-${zone}`}>{ZONE_LABEL[zone]}</span>
                  </>
                ) : (
                  "Price pending"
                )
              }
            />
            <Metric label="Collateral" value={`${formatBtc(collateral)} BTC`} />
            <Metric label="Debt" value={`${formatMusd(debt)} MUSD`} />
          </div>
        ) : (
          <p className="state-note">
            {status === 0
              ? "No position is open yet."
              : "This position is not active."}
          </p>
        )}

        <div className="status-rows">
          <Row label="Debt" value={`${formatMusd(debt)} MUSD`} />
          <Row label="Collateral" value={`${formatBtc(collateral)} BTC`} />

          {isActive && hasPosition && collUsd !== null && (
            <Row label="Coll. value" value={formatUsd(collUsd)} />
          )}

          {isActive && hasPosition && liqPrice !== null && (
            <Row label="Liquidation price" value={formatUsd(liqPrice)} />
          )}

          {isActive && hasPosition && distance !== null && (
            <Row
              label="BTC drop to liquidate"
              value={distance > 0 ? `-${formatPct(distance)}` : "Already at risk"}
            />
          )}

          {btcUsd !== undefined && <Row label="BTC price" value={formatUsd(btcUsd)} />}
        </div>
      </div>
    </>
  );
}

function LiquidationBanner({ zone, icrPct }: { zone: "liquidatable" | "danger"; icrPct: number }) {
  const message =
    zone === "liquidatable"
      ? "Position is below the 110% liquidation threshold. Add collateral or repay debt now."
      : "Position is close to the 110% liquidation threshold. Consider adding collateral or repaying.";
  return (
    <div className="liq-banner">
      <div className="liq-eyebrow">
        {zone === "liquidatable" ? "Liquidatable" : "Liquidation risk"} · ICR {formatPct(icrPct)}
      </div>
      <p>{message}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="card-row">
      <span className="label">{label}</span>
      <span className="value">{value}</span>
    </div>
  );
}

type StateTone = "neutral" | "success" | "warning" | "danger";

function StateCard({
  tone,
  eyebrow,
  title,
  detail,
  children,
}: {
  tone: StateTone;
  eyebrow: string;
  title: string;
  detail: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className={`card state-card state-${tone}`}>
      <StatusTop eyebrow={eyebrow} title={title} tone={tone} label={title} />
      <p className="state-note">{detail}</p>
      {children && <div className="status-rows">{children}</div>}
    </div>
  );
}

function StatusTop({
  eyebrow,
  title,
  tone,
  label,
}: {
  eyebrow: string;
  title: string;
  tone: StateTone;
  label: string;
}) {
  return (
    <div className="status-top">
      <div>
        <p className="section-eyebrow">{eyebrow}</p>
        <h3>{title}</h3>
      </div>
      <span className={`status-badge status-${tone}`}>
        <span className="status-dot" aria-hidden="true" />
        {label}
      </span>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="metric">
      <span className="metric-label">{label}</span>
      <span className="metric-value">{value}</span>
    </div>
  );
}

function SkeletonRows({ count }: { count: number }) {
  return (
    <div className="skeleton-rows" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className="skeleton-row" />
      ))}
    </div>
  );
}

function trimErr(msg: string): string {
  return msg.split("\n")[0];
}

function formatBtc(v: bigint): string {
  return Number(formatEther(v)).toLocaleString(undefined, {
    maximumFractionDigits: 6,
  });
}

function formatMusd(v: bigint): string {
  return Number(formatEther(v)).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
}
