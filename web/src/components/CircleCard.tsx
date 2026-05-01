"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useCircleSummary } from "@/hooks/useCircles";
import { formatBtc, formatDuration } from "@/lib/utils";

const STATUS = ["Pending", "Active", "Completed"] as const;

export function CircleCard({ address }: { address: `0x${string}` }) {
  const { data, isLoading } = useCircleSummary(address);

  if (isLoading || !data) {
    return <div className="card h-20 animate-pulse" />;
  }

  const name = data[0].result as string;
  const contribution = data[1].result as bigint;
  const cycleDuration = data[2].result as bigint;
  const maxMembers = data[3].result as number;
  const summary = data[5].result as readonly [number, bigint, number, number, bigint, bigint, `0x${string}`] | undefined;

  const status = summary ? STATUS[summary[0]] : "Pending";
  const memberCount = summary?.[2] ?? 0;
  const pot = summary?.[4] ?? 0n;

  const statusStyle =
    status === "Active"   ? { color: "#15803d", background: "rgba(34,197,94,0.12)" } :
    status === "Completed"? { color: "var(--muted-foreground)", background: "var(--secondary)" } :
                            { color: "var(--brand-red)", background: "rgba(229,50,45,0.12)" };

  return (
    <motion.div whileTap={{ scale: 0.98 }}>
      <Link href={`/circles/${address}`} className="card flex flex-col gap-2 transition hover:border-brand-red/40">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-semibold">{name || "untitled circle"}</div>
            <div className="text-xs text-[color:var(--muted-foreground)]">
              {formatBtc(contribution, 4)} BTC / {formatDuration(cycleDuration)}
            </div>
          </div>
          <span className="pill" style={statusStyle}>{status.toLowerCase()}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-[color:var(--muted-foreground)]">
          <span>{memberCount}/{maxMembers} members</span>
          <span>pot: <span className="text-foreground">{formatBtc(pot, 4)} BTC</span></span>
        </div>
      </Link>
    </motion.div>
  );
}
