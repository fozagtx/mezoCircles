"use client";

import { useParams } from "next/navigation";
import { useAccount, useWriteContract, useReadContract } from "wagmi";
import { circleAbi } from "@/lib/abis";
import { useCircleSummary } from "@/hooks/useCircles";
import { formatBtc, formatDuration, shortAddr, timeUntil } from "@/lib/utils";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

const STATUS = ["pending", "active", "completed", "aborted"] as const;

export default function CircleDetailPage() {
  const params = useParams<{ address: string }>();
  const circle = params.address as `0x${string}`;
  const { address: me } = useAccount();
  const { data, refetch } = useCircleSummary(circle);
  const { writeContractAsync, isPending } = useWriteContract();

  const { data: meIsMember } = useReadContract({
    abi: circleAbi, address: circle, functionName: "isMember",
    args: me ? [me] : undefined,
    query: { enabled: Boolean(me) },
  });

  const { data: myPending, refetch: refetchPending } = useReadContract({
    abi: circleAbi, address: circle, functionName: "pendingPayout",
    args: me ? [me] : undefined,
    query: { enabled: Boolean(me) },
  });

  const { data: myRefund, refetch: refetchRefund } = useReadContract({
    abi: circleAbi, address: circle, functionName: "refundOwed",
    args: me ? [me] : undefined,
    query: { enabled: Boolean(me) },
  });

  if (!data) return <div className="card text-sm text-[color:var(--muted-foreground)]">loading…</div>;

  const name = data[0].result as string;
  const contribution = data[1].result as bigint;
  const cycleDuration = data[2].result as bigint;
  const maxMembers = data[3].result as number;
  const creator = data[4].result as `0x${string}`;
  const summary = data[5].result as readonly [number, bigint, number, number, bigint, bigint, `0x${string}`];
  const members = (data[6].result as `0x${string}`[]) ?? [];
  const order = (data[7].result as `0x${string}`[]) ?? [];

  const status = summary[0];
  const currentCycle = summary[1];
  const memberCount = summary[2];
  const depositsThis = summary[3];
  const pot = summary[4];
  const deadline = summary[5];
  const recipient = summary[6];

  const isMyTurn = me && recipient && me.toLowerCase() === recipient.toLowerCase();

  async function call(
    fn: "join" | "deposit" | "settleCycle" | "startEarly" | "claimPayout" | "claimRefund" | "abort",
    value?: bigint,
  ) {
    try {
      await writeContractAsync({
        abi: circleAbi, address: circle, functionName: fn,
        args: [], value,
      } as any);
      toast.success(`${fn} ✓`);
      refetch();
      refetchPending();
      refetchRefund();
    } catch (e: any) {
      toast.error(e?.shortMessage || e?.message || "tx failed");
    }
  }

  const pendingAmt = (myPending as bigint | undefined) ?? 0n;
  const refundAmt = (myRefund as bigint | undefined) ?? 0n;
  const now = Math.floor(Date.now() / 1000);
  const abortable =
    summary && summary[0] === 1 && Number(summary[5]) > 0 && now - Number(summary[5]) > 7 * 24 * 60 * 60;

  return (
    <div className="flex flex-col gap-4 pt-2">
      <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-[11px] uppercase text-[color:var(--muted-foreground)]">// circle</div>
        <h1 className="text-2xl font-bold tracking-tight">{name}</h1>
        <div className="mt-1 text-xs text-[color:var(--muted-foreground)]">
          by {shortAddr(creator)} · {formatBtc(contribution, 4)} BTC / {formatDuration(cycleDuration)}
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-2">
        <Stat label="status" value={STATUS[status]} accent={status === 1} />
        <Stat label="cycle"  value={`${Number(currentCycle) + 1} / ${members.length || maxMembers}`} />
        <Stat label="pot"    value={`${formatBtc(pot, 4)} BTC`} />
        <Stat label="members" value={`${memberCount}/${maxMembers}`} />
      </div>

      {/* Action panel */}
      {status === 0 && !meIsMember && memberCount < maxMembers && (
        <button onClick={() => call("join")} disabled={isPending} className="btn-red">
          join circle
        </button>
      )}
      {status === 0 && me && me.toLowerCase() === creator.toLowerCase() && memberCount >= 3 && (
        <button onClick={() => call("startEarly")} disabled={isPending} className="btn-primary">
          start now ({memberCount} members)
        </button>
      )}
      {status === 1 && meIsMember && (
        <DepositPanel
          contribution={contribution}
          deadline={deadline}
          depositsThis={depositsThis}
          memberCount={memberCount}
          onDeposit={() => call("deposit", contribution)}
          onSettle={() => call("settleCycle")}
          isMyTurn={Boolean(isMyTurn)}
          recipient={recipient}
        />
      )}

      {pendingAmt > 0n && (
        <button onClick={() => call("claimPayout")} disabled={isPending} className="btn-red">
          claim payout · {formatBtc(pendingAmt, 4)} BTC
        </button>
      )}

      {refundAmt > 0n && (
        <button onClick={() => call("claimRefund")} disabled={isPending} className="btn-primary">
          claim refund · {formatBtc(refundAmt, 4)} BTC
        </button>
      )}

      {abortable && me && me.toLowerCase() === creator.toLowerCase() && (
        <button onClick={() => call("abort")} disabled={isPending} className="btn-primary">
          abort circle (stalled past grace period)
        </button>
      )}

      <div>
        <h2 className="mb-2 text-xs uppercase tracking-wide text-[color:var(--muted-foreground)]">// payout order</h2>
        <ol className="card flex flex-col divide-y divide-[color:var(--border)] p-0">
          {(order.length ? order : members).map((m, i) => {
            const upcoming = status === 1 && BigInt(i) === currentCycle;
            return (
              <li
                key={m + i}
                className={`flex items-center justify-between px-4 py-2.5 text-xs ${upcoming ? "bg-[rgba(229,50,45,0.08)]" : ""}`}
              >
                <span className="flex items-center gap-2">
                  <span className="text-[color:var(--muted-foreground)]">#{i + 1}</span>
                  <span className="font-mono">{shortAddr(m)}</span>
                  {me && m.toLowerCase() === me.toLowerCase() && <span className="pill bg-brand-black text-white">you</span>}
                </span>
                {upcoming && <span className="text-brand-red">▸ now</span>}
                {status === 1 && BigInt(i) < currentCycle && <span className="text-emerald-600">paid</span>}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

function Stat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="card">
      <div className="text-[10px] uppercase text-[color:var(--muted-foreground)]">{label}</div>
      <div className={`mt-1 text-lg font-bold ${accent ? "text-brand-red" : ""}`}>{value}</div>
    </div>
  );
}

function DepositPanel({
  contribution, deadline, depositsThis, memberCount, isMyTurn, recipient, onDeposit, onSettle,
}: {
  contribution: bigint; deadline: bigint; depositsThis: number; memberCount: number;
  isMyTurn: boolean; recipient: `0x${string}`;
  onDeposit: () => void; onSettle: () => void;
}) {
  const now = Math.floor(Date.now() / 1000);
  const ready = Number(deadline) - now <= 0;
  return (
    <div className="card flex flex-col gap-3">
      <div>
        <div className="text-[10px] uppercase text-[color:var(--muted-foreground)]">// next payout to</div>
        <div className="font-mono text-sm">
          {shortAddr(recipient)}
          {isMyTurn && <span className="ml-2 text-brand-red">(that's you)</span>}
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-[color:var(--muted-foreground)]">
        <span>{depositsThis}/{memberCount} deposited</span>
        <span>{timeUntil(deadline)}</span>
      </div>
      <div className="flex gap-2">
        <button onClick={onDeposit} className="btn-red flex-1">
          deposit {formatBtc(contribution, 4)} BTC
        </button>
        {ready && (
          <button onClick={onSettle} className="btn-primary">
            settle
          </button>
        )}
      </div>
    </div>
  );
}
