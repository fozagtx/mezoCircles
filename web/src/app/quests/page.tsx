"use client";

import { motion } from "framer-motion";
import { useAccount, useWriteContract } from "wagmi";
import { useReputation } from "@/hooks/useReputation";
import { reputationAbi } from "@/lib/abis";
import { REPUTATION_ADDRESS } from "@/lib/wagmi";
import toast from "react-hot-toast";
import { useState } from "react";
import { isAddress } from "viem";

export default function QuestsPage() {
  const { address, isConnected } = useAccount();
  const { data: rep, refetch } = useReputation(address);
  const { writeContractAsync, isPending } = useWriteContract();
  const [referrer, setReferrer] = useState("");

  const streak = Number(rep?.[5] ?? 0);
  const claimable = rep?.[6] ?? false;

  async function claim() {
    try {
      await writeContractAsync({
        abi: reputationAbi, address: REPUTATION_ADDRESS, functionName: "claimDailyQuest",
      });
      toast.success("+5 XP claimed");
      refetch();
    } catch (e: any) {
      toast.error(e?.shortMessage || e?.message || "tx failed");
    }
  }

  async function referral() {
    if (!isAddress(referrer)) { toast.error("invalid address"); return; }
    try {
      await writeContractAsync({
        abi: reputationAbi, address: REPUTATION_ADDRESS, functionName: "registerReferral",
        args: [referrer as `0x${string}`],
      });
      toast.success("+50 XP for both of you");
      setReferrer("");
      refetch();
    } catch (e: any) {
      toast.error(e?.shortMessage || e?.message || "tx failed");
    }
  }

  return (
    <div className="flex flex-col gap-4 pt-2">
      <h1 className="text-xl font-bold uppercase tracking-tight">quests</h1>

      {!isConnected ? (
        <div className="card text-sm text-[color:var(--muted-foreground)]">connect wallet to play.</div>
      ) : (
        <>
          <motion.div
            className="card flex items-center justify-between"
            style={{
              background: claimable ? "rgba(229,50,45,0.08)" : "var(--card)",
              borderColor: claimable ? "rgba(229,50,45,0.3)" : "var(--border)",
            }}
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          >
            <div>
              <div className="text-sm font-medium">✶ daily check-in</div>
              <div className="text-xs text-[color:var(--muted-foreground)]">+5 XP · streak: {streak}d</div>
            </div>
            <button
              onClick={claim}
              disabled={!claimable || isPending}
              className={claimable ? "btn-red" : "btn-ghost"}
            >
              {claimable ? "claim" : "tomorrow"}
            </button>
          </motion.div>

          <div className="card flex flex-col gap-3">
            <div>
              <div className="text-sm font-medium">↗ refer a friend</div>
              <div className="text-xs text-[color:var(--muted-foreground)]">
                paste your inviter's address. both of you earn +50 XP.
              </div>
            </div>
            <input
              className="input"
              placeholder="0x…"
              value={referrer}
              onChange={e => setReferrer(e.target.value)}
            />
            <button onClick={referral} disabled={isPending || !referrer} className="btn-primary">
              register referral
            </button>
          </div>

          <div className="card">
            <div className="text-[10px] uppercase tracking-wide text-[color:var(--muted-foreground)]">
              // earn XP
            </div>
            <ul className="mt-2 space-y-1.5 text-xs">
              <li>+10 XP per deposit</li>
              <li>+100 XP per circle completed</li>
              <li>+5 XP daily quest · keep streak alive</li>
              <li>+50 XP referral (both sides)</li>
              <li className="text-destructive">−25 XP missed payment</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
