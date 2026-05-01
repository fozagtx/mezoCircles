"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useAccount } from "wagmi";
import { RankBadge } from "@/components/RankBadge";
import { useReputation } from "@/hooks/useReputation";
import { useMyCircles, useDiscoveryFeed } from "@/hooks/useCircles";
import { CircleCard } from "@/components/CircleCard";
import { CONTRACTS_DEPLOYED } from "@/lib/wagmi";

export default function HomePage() {
  const { address, isConnected } = useAccount();
  const { data: rep } = useReputation(address);
  const { data: myCircles } = useMyCircles(address);
  const { data: feed } = useDiscoveryFeed(6);

  const xp = rep?.[0] ?? 0n;
  const rank = Number(rep?.[1] ?? 0);
  const deposits = rep?.[2] ?? 0;
  const completed = rep?.[4] ?? 0;
  const streak = rep?.[5] ?? 0;
  const questClaimable = rep?.[6] ?? false;

  return (
    <div className="flex flex-col gap-8">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-2 md:pt-6"
      >
        <h1 className="text-3xl font-bold leading-[1.08] tracking-tight md:text-5xl lg:text-6xl">
          save BTC together.
          <br />
          <span className="text-brand-red">take turns<span className="caret" /></span>
        </h1>
        <p className="mt-3 max-w-2xl text-xs text-[color:var(--muted-foreground)] md:text-sm">
          // on-chain savings circles on mezo. trustless rotation, reputation, badges.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/circles/new" className="btn-red">+ new circle</Link>
          <Link href="/circles" className="btn-ghost">browse circles →</Link>
        </div>
      </motion.section>

      {!isConnected ? (
        <section className="card text-sm text-[color:var(--muted-foreground)]">
          // connect a wallet to unlock your stats &amp; reputation
        </section>
      ) : (
        // Connected: 2-column grid on desktop (left = rank/stats, right = circles)
        <div className="grid gap-6 md:grid-cols-[minmax(0,360px)_1fr]">
          {/* Left column — rank, stats, daily quest */}
          <div className="flex flex-col gap-3">
            <RankBadge rank={rank} xp={xp} />

            <div className="grid grid-cols-3 gap-2">
              <Stat label="deposits"  value={String(deposits)} />
              <Stat label="completed" value={String(completed)} />
              <Stat label="streak"    value={`${streak}d`} />
            </div>

            {questClaimable && (
              <Link
                href="/quests"
                className="card flex items-center justify-between"
                style={{ background: "rgba(229,50,45,0.08)", borderColor: "rgba(229,50,45,0.3)" }}
              >
                <div>
                  <div className="text-sm font-medium">✶ daily quest available</div>
                  <div className="text-xs text-[color:var(--muted-foreground)]">
                    +5 XP · keep your streak alive
                  </div>
                </div>
                <span className="text-brand-red">→</span>
              </Link>
            )}
          </div>

          {/* Right column — your circles + a peek of discovery */}
          <div className="flex flex-col gap-6">
            <section>
              <SectionHead title="your circles" cta={{ href: "/circles/new", label: "+ new" }} />
              {(myCircles?.length ?? 0) === 0 ? (
                <div className="card text-sm text-[color:var(--muted-foreground)]">
                  no circles yet.{" "}
                  <Link href="/circles" className="text-brand-red underline">browse →</Link>
                </div>
              ) : (
                <div className="grid gap-2 md:grid-cols-2">
                  {myCircles!.map(addr => (
                    <CircleCard key={addr} address={addr} />
                  ))}
                </div>
              )}
            </section>

            {(feed?.length ?? 0) > 0 && (
              <section>
                <SectionHead title="discover" cta={{ href: "/circles", label: "see all →" }} />
                <div className="grid gap-2 md:grid-cols-2">
                  {feed!.slice(0, 4).map(addr => <CircleCard key={addr} address={addr} />)}
                </div>
              </section>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card text-center">
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      <div className="mt-0.5 text-[10px] uppercase text-[color:var(--muted-foreground)]">{label}</div>
    </div>
  );
}

function SectionHead({ title, cta }: { title: string; cta: { href: string; label: string } }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h2 className="text-base font-semibold uppercase tracking-tight">{title}</h2>
      <Link href={cta.href} className="text-xs text-brand-red">{cta.label}</Link>
    </div>
  );
}
