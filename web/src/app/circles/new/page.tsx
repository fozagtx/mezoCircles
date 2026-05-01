"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { parseEther, parseUnits } from "viem";
import { factoryAbi } from "@/lib/abis";
import {
  FACTORY_ADDRESS,
  MUSD_ADDRESS,
  YIELD_VAULT_ADDRESS,
  MUSD_AVAILABLE,
  YIELD_VAULT_AVAILABLE,
} from "@/lib/wagmi";
import toast from "react-hot-toast";

const ZERO_ADDR = "0x0000000000000000000000000000000000000000" as const;

const CYCLE_OPTIONS = [
  { label: "1 day",  seconds: 24 * 60 * 60 },
  { label: "3 days", seconds: 3 * 24 * 60 * 60 },
  { label: "1 week", seconds: 7 * 24 * 60 * 60 },
  { label: "2 weeks", seconds: 14 * 24 * 60 * 60 },
];

export default function NewCirclePage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const pub = usePublicClient();
  const { writeContractAsync, isPending } = useWriteContract();

  const [name, setName] = useState("");
  const [contribution, setContribution] = useState("0.001");
  const [cycle, setCycle] = useState(CYCLE_OPTIONS[2].seconds);
  const [members, setMembers] = useState(5);
  const [asset, setAsset] = useState<"BTC" | "MUSD">("BTC");
  const [enableYield, setEnableYield] = useState(false);

  const isMUSD = asset === "MUSD";
  const yieldOn = isMUSD && enableYield && YIELD_VAULT_AVAILABLE;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isConnected) { toast.error("connect wallet first"); return; }
    if (!name.trim()) { toast.error("name required"); return; }

    // mUSD uses 18 decimals on Mezo; native BTC contributions use parseEther.
    const amount = isMUSD ? parseUnits(contribution, 18) : parseEther(contribution);
    const tokenArg = (isMUSD ? MUSD_ADDRESS : ZERO_ADDR) as `0x${string}`;
    const vaultArg = (yieldOn ? YIELD_VAULT_ADDRESS : ZERO_ADDR) as `0x${string}`;

    try {
      const hash = await writeContractAsync({
        abi: factoryAbi,
        address: FACTORY_ADDRESS,
        functionName: "createCircle",
        args: [name.trim(), amount, BigInt(cycle), members, tokenArg, vaultArg],
      });

      toast.loading("creating circle…", { id: "create" });
      const receipt = await pub!.waitForTransactionReceipt({ hash });
      toast.dismiss("create");

      // Parse the CircleCreated event from the receipt to find the new clone address.
      const ev = receipt.logs.find(l => l.address.toLowerCase() === FACTORY_ADDRESS.toLowerCase());
      const created = ev?.topics[2] ? `0x${ev.topics[2].slice(26)}` : null;

      toast.success("circle created!");
      router.push(created ? `/circles/${created}` : "/circles");
    } catch (err: any) {
      toast.dismiss("create");
      toast.error(err?.shortMessage || err?.message || "tx failed");
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 pt-2">
      <h1 className="text-xl font-bold uppercase tracking-tight">new circle</h1>

      <Field label="name">
        <input
          className="input"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. team-savings-q2"
          maxLength={32}
        />
      </Field>

      <Field label="asset">
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => setAsset("BTC")}
            className={`rounded-full px-2 py-1.5 text-xs font-mono transition ${
              asset === "BTC"
                ? "bg-brand-black text-white"
                : "border border-[color:var(--border)] hover:bg-[color:var(--secondary)]"
            }`}
          >
            BTC (native)
          </button>
          <button
            type="button"
            disabled={!MUSD_AVAILABLE}
            onClick={() => setAsset("MUSD")}
            className={`rounded-full px-2 py-1.5 text-xs font-mono transition disabled:opacity-50 disabled:cursor-not-allowed ${
              asset === "MUSD"
                ? "bg-brand-red text-white"
                : "border border-[color:var(--border)] hover:bg-[color:var(--secondary)]"
            }`}
            title={MUSD_AVAILABLE ? "" : "set NEXT_PUBLIC_MUSD_ADDRESS in .env.local"}
          >
            mUSD {MUSD_AVAILABLE ? "" : "(unset)"}
          </button>
        </div>
      </Field>

      <Field label={`contribution per cycle (${isMUSD ? "mUSD" : "BTC"})`}>
        <input
          className="input"
          type="number"
          step={isMUSD ? "1" : "0.0001"}
          min={isMUSD ? "1" : "0.0001"}
          value={contribution}
          onChange={e => setContribution(e.target.value)}
        />
      </Field>

      {isMUSD && (
        <label className="card flex items-center justify-between gap-3 text-xs">
          <div>
            <div className="font-medium">earn yield on idle pot</div>
            <div className="text-[color:var(--muted-foreground)]">
              {YIELD_VAULT_AVAILABLE
                ? "// stake the pot in the Mezo lending vault between payouts"
                : "// vault address not configured (testnet)"}
            </div>
          </div>
          <input
            type="checkbox"
            disabled={!YIELD_VAULT_AVAILABLE}
            checked={enableYield && YIELD_VAULT_AVAILABLE}
            onChange={e => setEnableYield(e.target.checked)}
            className="h-4 w-4 accent-brand-red"
          />
        </label>
      )}

      <Field label="cycle length">
        <div className="grid grid-cols-4 gap-1.5">
          {CYCLE_OPTIONS.map(o => (
            <button
              key={o.seconds}
              type="button"
              onClick={() => setCycle(o.seconds)}
              className={`rounded-full px-2 py-1.5 text-xs font-mono transition ${
                cycle === o.seconds
                  ? "bg-brand-black text-white"
                  : "border border-[color:var(--border)] text-[color:var(--foreground)] hover:bg-[color:var(--secondary)]"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </Field>

      <Field label={`members: ${members}`}>
        <input
          type="range" min={3} max={10} value={members}
          onChange={e => setMembers(Number(e.target.value))}
          className="w-full accent-brand-red"
        />
        <div className="mt-1 flex justify-between text-[10px] text-[color:var(--muted-foreground)]">
          <span>3 (min)</span>
          <span>10 (max)</span>
        </div>
      </Field>

      <div className="card text-xs text-[color:var(--muted-foreground)]">
        // total pot per cycle = <span className="text-foreground">{(parseFloat(contribution || "0") * members).toFixed(isMUSD ? 2 : 4)} {isMUSD ? "mUSD" : "BTC"}</span>
        <br />
        // total circle duration = <span className="text-foreground">{Math.round(cycle * members / 86400)} days</span>
        {yieldOn && <><br />// yield: idle pot staked in mezo vault between payouts</>}
      </div>

      <button type="submit" disabled={isPending} className="btn-red">
        {isPending ? "submitting…" : "create circle"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] uppercase tracking-wide text-[color:var(--muted-foreground)]">{label}</span>
      {children}
    </label>
  );
}
