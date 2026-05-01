"use client";

import { useAccount, useReadContract, useReadContracts } from "wagmi";
import { RankBadge } from "@/components/RankBadge";
import { useReputation } from "@/hooks/useReputation";
import { badgeAbi, BADGE_NAMES } from "@/lib/abis";
import { BADGE_ADDRESS } from "@/lib/wagmi";
import { shortAddr } from "@/lib/utils";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const { data: rep } = useReputation(address);

  const xp = rep?.[0] ?? 0n;
  const rank = Number(rep?.[1] ?? 0);
  const deposits = rep?.[2] ?? 0;
  const missed = rep?.[3] ?? 0;
  const completed = rep?.[4] ?? 0;
  const streak = rep?.[5] ?? 0;

  const { data: badges } = useReadContracts({
    contracts: address
      ? Array.from({ length: BADGE_NAMES.length }, (_, i) => ({
          abi: badgeAbi,
          address: BADGE_ADDRESS,
          functionName: "hasBadge" as const,
          args: [address, BigInt(i)] as [`0x${string}`, bigint],
        }))
      : [],
    query: { enabled: Boolean(address) },
  });

  function copyInvite() {
    if (!address) return;
    const url = `https://t.me/mezocircles_bot?start=ref_${address}`;
    navigator.clipboard.writeText(url);
    toast.success("invite link copied");
  }

  return (
    <div className="flex flex-col gap-4 pt-2">
      <h1 className="text-xl font-bold uppercase tracking-tight">profile</h1>

      {!isConnected ? (
        <div className="card text-sm text-[color:var(--muted-foreground)]">connect wallet first.</div>
      ) : (
        <>
          <div className="card flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase text-[color:var(--muted-foreground)]">// address</div>
              <div className="font-mono text-sm">{shortAddr(address)}</div>
            </div>
            <button onClick={copyInvite} className="btn-ghost text-xs">
              copy invite
            </button>
          </div>

          <RankBadge rank={rank} xp={xp} />

          <div className="grid grid-cols-2 gap-2">
            <Stat label="deposits"  value={String(deposits)} />
            <Stat label="completed" value={String(completed)} />
            <Stat label="streak"    value={`${streak}d`} />
            <Stat label="missed"    value={String(missed)} accent={Number(missed) > 0} />
          </div>

          <div>
            <h2 className="mb-2 text-xs uppercase tracking-wide text-[color:var(--muted-foreground)]">
              // achievements
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {BADGE_NAMES.map((name, i) => {
                const owned = badges?.[i]?.result as boolean | undefined;
                return (
                  <div
                    key={name}
                    className="card flex flex-col items-center gap-1 p-3 text-center transition"
                    style={{ opacity: owned ? 1 : 0.35, background: owned ? "rgba(229,50,45,0.05)" : "var(--card)" }}
                  >
                    <div className="text-2xl leading-none">
                      {["✦", "△", "⬢", "○", "◆", "★"][i]}
                    </div>
                    <div className="text-[10px] leading-tight">{name}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="card">
      <div className="text-[10px] uppercase text-[color:var(--muted-foreground)]">{label}</div>
      <div className={`mt-1 text-lg font-bold ${accent ? "text-destructive" : ""}`}>{value}</div>
    </div>
  );
}
