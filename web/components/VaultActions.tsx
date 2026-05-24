"use client";

import { useEffect, useState } from "react";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { parseEther, zeroAddress } from "viem";
import { Erc20Abi, MezoCirclesVaultAbi } from "@/lib/abi";
import { MEZO_TESTNET, VAULT_ADDRESS } from "@/lib/mezo";
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
import { Modal } from "@/components/Modal";

export function VaultActions() {
  const { address, isConnected } = useAccount();
  const queryClient = useQueryClient();
  const {
    writeContract,
    isPending,
    error,
    data: txHash,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash: txHash });

  const vaultAddr = (VAULT_ADDRESS || undefined) as `0x${string}` | undefined;

  const {
    data: vaultOwner,
    isLoading: isOwnerLoading,
    isError: isOwnerError,
    error: ownerError,
  } = useReadContract({
    address: vaultAddr,
    abi: MezoCirclesVaultAbi,
    functionName: "owner",
    query: { enabled: Boolean(vaultAddr) },
  });

  const {
    data: vaultStatus,
    isLoading: isStatusLoading,
    isError: isStatusError,
    error: statusError,
  } = useReadContract({
    address: vaultAddr,
    abi: MezoCirclesVaultAbi,
    functionName: "vaultStatus",
    query: { enabled: Boolean(vaultAddr) },
  });

  const {
    data: vaultDebt,
    isLoading: isDebtLoading,
    isError: isDebtError,
    error: debtError,
  } = useReadContract({
    address: vaultAddr,
    abi: MezoCirclesVaultAbi,
    functionName: "vaultDebt",
    query: { enabled: Boolean(vaultAddr) },
  });

  const {
    data: musdAllowance,
    isLoading: isAllowanceLoading,
    isError: isAllowanceError,
    error: allowanceError,
  } = useReadContract({
    address: MEZO_TESTNET.musd,
    abi: Erc20Abi,
    functionName: "allowance",
    args: address && vaultAddr ? [address, vaultAddr] : undefined,
    query: { enabled: Boolean(address && vaultAddr) },
  });

  useEffect(() => {
    if (isConfirmed) queryClient.invalidateQueries();
  }, [isConfirmed, queryClient]);

  const [collateralBtc, setCollateralBtc] = useState("");
  const [debtMusd, setDebtMusd] = useState("");
  const [addBtc, setAddBtc] = useState("");
  const [repayMusd, setRepayMusd] = useState("");
  const [rulesModalOpen, setRulesModalOpen] = useState(false);

  const ownerMismatch =
    Boolean(vaultOwner) &&
    Boolean(address) &&
    (vaultOwner as string).toLowerCase() !== address!.toLowerCase();

  const readsLoading =
    Boolean(vaultAddr) &&
    (isOwnerLoading ||
      isStatusLoading ||
      isDebtLoading ||
      (Boolean(address) && isAllowanceLoading));
  const readError = ownerError ?? statusError ?? debtError ?? allowanceError;
  const hasReadError = isOwnerError || isStatusError || isDebtError || isAllowanceError;
  const busy = isPending || isConfirming;
  const baseDisabled =
    !isConnected || !vaultAddr || busy || ownerMismatch || readsLoading || hasReadError;

  const blocker = !vaultAddr
    ? "Setup missing"
    : !isConnected
      ? "Connect wallet to act"
      : readsLoading
        ? "Reading position"
        : hasReadError
          ? "Unable to read position"
          : ownerMismatch
            ? `Connected wallet is not the owner (${shortAddr(vaultOwner as string)})`
            : null;

  const status: TxStatus = isPending
    ? "submitting"
    : isConfirming
      ? "confirming"
      : isConfirmed
        ? "confirmed"
        : txHash
          ? "submitted"
          : "idle";

  const approveMusd = (amount: bigint) => {
    if (!vaultAddr) return;
    writeContract({
      address: MEZO_TESTNET.musd,
      abi: Erc20Abi,
      functionName: "approve",
      args: [vaultAddr, amount],
    });
  };

  const open = () => {
    if (!vaultAddr) return;
    writeContract({
      address: vaultAddr,
      abi: MezoCirclesVaultAbi,
      functionName: "openVault",
      args: [openDebtWei, zeroAddress, zeroAddress],
      value: openCollateralWei,
    });
  };

  const handleOpenClick = () => {
    if (!openValidation.ok) {
      setRulesModalOpen(true);
      return;
    }
    open();
  };

  const addColl = () => {
    if (!vaultAddr) return;
    writeContract({
      address: vaultAddr,
      abi: MezoCirclesVaultAbi,
      functionName: "addCollateral",
      args: [zeroAddress, zeroAddress],
      value: addAmount,
    });
  };

  const repay = () => {
    if (!vaultAddr) return;
    writeContract({
      address: vaultAddr,
      abi: MezoCirclesVaultAbi,
      functionName: "repayDebt",
      args: [repayAmount, zeroAddress, zeroAddress],
    });
  };

  const close = () => {
    if (!vaultAddr) return;
    writeContract({
      address: vaultAddr,
      abi: MezoCirclesVaultAbi,
      functionName: "closeVault",
    });
  };

  const allowance = (musdAllowance as bigint | undefined) ?? 0n;
  const debt = (vaultDebt as bigint | undefined) ?? 0n;
  const vaultStatusNum = Number((vaultStatus as bigint | undefined) ?? 0n);
  const isActive = vaultStatusNum === 1;

  const openCollateralWei = collateralBtc ? safeParseEther(collateralBtc) : 0n;
  const openDebtWei = debtMusd ? safeParseEther(debtMusd) : 0n;
  const addAmount = addBtc ? safeParseEther(addBtc) : 0n;
  const repayAmount = repayMusd ? safeParseEther(repayMusd) : 0n;
  const repayNeedsApproval = repayAmount > 0n && allowance < repayAmount;
  const closeNeedsApproval = debt > 0n && allowance < debt;

  // Open-vault client-side validation. Protocol min debt is 1,800 MUSD;
  // protocol min ICR is 110%. Both must be satisfied or the borrowerOps
  // call will revert (and the user pays gas for nothing).
  const { data: btcUsdForOpen } = useBtcPrice();
  const openCollNum = parseFloat(collateralBtc);
  const openDebtNum = parseFloat(debtMusd);
  const openValidation = ((): { ok: boolean; reason: string | null } => {
    if (openCollateralWei <= 0n || openDebtWei <= 0n)
      return { ok: false, reason: "Enter a BTC collateral amount and MUSD debt." };
    if (!Number.isFinite(openCollNum) || openCollNum <= 0)
      return { ok: false, reason: "Collateral must be a positive BTC amount." };
    if (!Number.isFinite(openDebtNum) || openDebtNum <= 0)
      return { ok: false, reason: "Debt must be a positive MUSD amount." };
    if (openDebtNum < 1800)
      return { ok: false, reason: "Debt must be at least 1,800 MUSD (protocol minimum)." };
    if (btcUsdForOpen) {
      const icr = ((openCollNum * btcUsdForOpen) / openDebtNum) * 100;
      if (icr < 110)
        return {
          ok: false,
          reason: `ICR ${icr.toFixed(1)}% is below the 110% minimum. Add more collateral or lower the debt.`,
        };
    }
    return { ok: true, reason: null };
  })();

  const actionTone: NoticeTone = error || hasReadError ? "danger" : busy ? "neutral" : blocker ? "warning" : "success";
  const actionTitle = error
    ? "Transaction failed"
    : hasReadError
      ? "Read failed"
      : busy
        ? STATUS_LABEL[status]
        : blocker
          ? "Action blocked"
          : "Ready";
  const actionDetail = error
    ? trimErr(error.message)
    : hasReadError
      ? trimErr(readError?.message ?? "The position could not be read.")
      : blocker
        ? blocker
        : isActive
          ? "Manage your active BTC-backed loan."
          : "Deposit BTC and borrow MUSD.";

  return (
    <div className="card action-card">
      <ActionNotice tone={actionTone} title={actionTitle} detail={actionDetail} />

      <div className="action-context" aria-label="Position context">
        <span>{vaultAddr ? "Ready" : "Setup missing"}</span>
        <span>{vaultOwner ? `Owner ${shortAddr(vaultOwner as string)}` : "Connect wallet"}</span>
        <span>{isActive ? "Active" : "Not opened"}</span>
      </div>

      {!isActive ? (
        <ActionGroup heading="Open position" hint="Minimum debt 1,800 MUSD. Minimum ICR 110%.">
          <Field label="Collateral (BTC)" value={collateralBtc} onChange={setCollateralBtc} placeholder="1.0" />
          <Field label="Debt (MUSD)" value={debtMusd} onChange={setDebtMusd} placeholder="1800" />
          <OpenPreview
            collateralBtc={collateralBtc}
            debtMusd={debtMusd}
            validationError={openValidation.reason}
          />
          <Button onClick={handleOpenClick} disabled={baseDisabled}>
            {openValidation.ok ? "Open position" : "Review limits"}
          </Button>
          <Modal
            open={rulesModalOpen}
            onClose={() => setRulesModalOpen(false)}
            title="Mezo protocol limits"
          >
            <p>
              These limits are set by Mezo&apos;s <code>BorrowerOperations</code>{" "}
              contract. They apply to every position on the network — mezoCircles
              can&apos;t override them.
            </p>
            <ul className="modal-rules">
              <li>
                <strong>Minimum debt</strong>
                <span>1,800 MUSD per position</span>
              </li>
              <li>
                <strong>Minimum ICR</strong>
                <span>110% (collateral value ÷ debt)</span>
              </li>
              <li>
                <strong>Interest rate</strong>
                <span>1–5% APR, locked at open</span>
              </li>
              <li>
                <strong>Redemption fee</strong>
                <span>0.75% charged on BTC released</span>
              </li>
            </ul>
            {openValidation.reason && (
              <div className="modal-violation">
                <strong>Your current input</strong>
                <p>{openValidation.reason}</p>
              </div>
            )}
          </Modal>
        </ActionGroup>
      ) : (
        <>
          <ActionGroup heading="Add collateral" hint="Top up BTC to improve ICR.">
            <Field label="Add (BTC)" value={addBtc} onChange={setAddBtc} placeholder="0.5" />
            <Button onClick={addColl} disabled={baseDisabled || addAmount === 0n}>Add collateral</Button>
          </ActionGroup>

          <ActionGroup
            heading="Repay debt"
            hint="Burn MUSD to reduce debt. Approve MUSD first so repayment can go through."
          >
            <Field label="Repay (MUSD)" value={repayMusd} onChange={setRepayMusd} placeholder="100" />
            {repayNeedsApproval ? (
              <Button
                onClick={() => approveMusd(repayAmount)}
                disabled={baseDisabled || repayAmount === 0n}
              >
                Approve {repayMusd || "0"} MUSD
              </Button>
            ) : (
              <Button onClick={repay} disabled={baseDisabled || repayAmount === 0n}>
                Repay
              </Button>
            )}
          </ActionGroup>

          <ActionGroup
            heading="Close position"
            hint="Pay off all outstanding debt and withdraw all BTC. Requires MUSD approval for the full debt."
          >
            {debt > 0n && (
              <div className="card-row">
                <span className="label">Outstanding debt</span>
                <span className="value">{formatMusd(debt)} MUSD</span>
              </div>
            )}
            {closeNeedsApproval ? (
              <Button onClick={() => approveMusd(debt)} disabled={baseDisabled}>
                Approve {formatMusd(debt)} MUSD for close
              </Button>
            ) : (
              <Button onClick={close} disabled={baseDisabled}>
                Close position
              </Button>
            )}
          </ActionGroup>
        </>
      )}

      {txHash && (
        <p className="tx-line">
          {STATUS_LABEL[status]}:{" "}
          <a
            className="tx-link"
            target="_blank"
            rel="noreferrer"
            href={`https://explorer.test.mezo.org/tx/${txHash}`}
          >
            {txHash}
          </a>
        </p>
      )}
    </div>
  );
}

type TxStatus = "idle" | "submitting" | "submitted" | "confirming" | "confirmed";
const STATUS_LABEL: Record<TxStatus, string> = {
  idle: "tx",
  submitting: "Awaiting wallet",
  submitted: "Submitted",
  confirming: "Confirming",
  confirmed: "Confirmed",
};

function safeParseEther(v: string): bigint {
  try {
    return parseEther(v);
  } catch {
    return 0n;
  }
}

function formatMusd(v: bigint): string {
  return (Number(v) / 1e18).toFixed(4);
}

function OpenPreview({
  collateralBtc,
  debtMusd,
  validationError,
}: {
  collateralBtc: string;
  debtMusd: string;
  validationError: string | null;
}) {
  const { data: btcUsd } = useBtcPrice();
  const coll = parseFloat(collateralBtc);
  const debt = parseFloat(debtMusd);

  if (!btcUsd || !Number.isFinite(coll) || !Number.isFinite(debt) || coll <= 0 || debt <= 0) {
    return null;
  }

  const icr = icrPercent(coll, debt, btcUsd);
  const liqPrice = liquidationPriceUsd(coll, debt);
  const distance = distanceToLiqPct(btcUsd, liqPrice);
  const zone = icrZone(icr);
  const collUsd = coll * btcUsd;

  return (
    <div className="open-preview">
      <h4 className="open-preview-eyebrow">Preview at current BTC price</h4>
      <div className="open-preview-row">
        <span className="open-preview-label">Coll. value</span>
        <span className="open-preview-value">{formatUsd(collUsd)}</span>
      </div>
      <div className="open-preview-row">
        <span className="open-preview-label">ICR</span>
        <span className="open-preview-value">
          {formatPct(icr)}{" "}
          <span className={`zone-tag zone-${zone}`}>{ZONE_LABEL[zone]}</span>
        </span>
      </div>
      <div className="open-preview-row">
        <span className="open-preview-label">Liquidation price</span>
        <span className="open-preview-value">{formatUsd(liqPrice)}</span>
      </div>
      <div className="open-preview-row">
        <span className="open-preview-label">BTC drop to liquidate</span>
        <span className="open-preview-value">
          {distance > 0 ? `-${formatPct(distance)}` : "Already at risk"}
        </span>
      </div>
      {validationError && <p className="open-preview-error">{validationError}</p>}
    </div>
  );
}

function shortAddr(a: string): string {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

function trimErr(msg: string): string {
  return msg.split("\n")[0];
}

type NoticeTone = "neutral" | "success" | "warning" | "danger";

function ActionNotice({
  tone,
  title,
  detail,
}: {
  tone: NoticeTone;
  title: string;
  detail: string;
}) {
  return (
    <div className={`action-notice action-notice-${tone}`}>
      <span className="action-notice-dot" aria-hidden="true" />
      <div>
        <strong>{title}</strong>
        <p>{detail}</p>
      </div>
    </div>
  );
}

function ActionGroup({
  heading,
  hint,
  children,
}: {
  heading: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="action-group">
      <div>
        <h3>{heading}</h3>
        <p className="hint">{hint}</p>
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <input
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="field-input"
      />
    </label>
  );
}

function Button({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="action-btn">
      {children}
    </button>
  );
}
