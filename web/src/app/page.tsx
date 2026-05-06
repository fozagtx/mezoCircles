"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useAccount } from "wagmi";
import { RankBadge } from "@/components/RankBadge";
import { useReputation } from "@/hooks/useReputation";
import { useMyCircles, useDiscoveryFeed } from "@/hooks/useCircles";
import { CircleCard } from "@/components/CircleCard";

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
    <div className="flex flex-col gap-16">
      {/* HERO — editorial poster headline + ghost text trick. */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
        className="relative pt-4 md:pt-10"
      >
        <div className="pill mb-6 inline-flex">why mezocircles</div>

        <h1 className="font-display text-[3.25rem] leading-[0.92] tracking-tighter sm:text-7xl md:text-8xl">
          your money,
          <br />
          <span className="ghost-text">minus</span> the banks.
        </h1>

        <p className="mt-8 max-w-xl text-base leading-relaxed text-[color:var(--muted-foreground)] md:text-lg">
          A new generation saves in BTC, takes turns receiving the pot, and
          earns yield on the idle balance — no middlemen, no paperwork,
          just a circle of friends and a smart contract.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link href="/circles/new" className="btn-acid text-base">
            get onboard →
          </Link>
          <Link href="/circles" className="btn-ghost text-base">
            browse circles
          </Link>
        </div>
      </motion.section>

      {!isConnected ? (
        <ConnectPrompt />
      ) : (
        <div className="grid gap-10 md:grid-cols-[minmax(0,360px)_1fr]">
          {/* Left — rank, stats, daily quest */}
          <div className="flex flex-col gap-4">
            <RankBadge rank={rank} xp={xp} />

            <div className="grid grid-cols-3 gap-3">
              <Stat label="deposits"  value={String(deposits)} />
              <Stat label="completed" value={String(completed)} />
              <Stat label="streak"    value={`${streak}d`} />
            </div>

            {questClaimable && (
              <Link
                href="/quests"
                className="card flex items-center justify-between hover:bg-acid hover:text-brown transition"
              >
                <div>
                  <div className="text-sm font-semibold">✶ daily quest</div>
                  <div className="text-xs text-[color:var(--muted-foreground)]">
                    +5 XP · keep your streak alive
                  </div>
                </div>
                <span>→</span>
              </Link>
            )}
          </div>

          {/* Right — your circles + a peek of discovery */}
          <div className="flex flex-col gap-10">
            <section>
              <SectionHead label="your circles" cta={{ href: "/circles/new", label: "+ new" }} />
              {(myCircles?.length ?? 0) === 0 ? (
                <div className="card text-sm text-[color:var(--muted-foreground)]">
                  No circles yet.{" "}
                  <Link href="/circles" className="font-semibold text-brown underline">browse →</Link>
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {myCircles!.map(addr => (
                    <CircleCard key={addr} address={addr} />
                  ))}
                </div>
              )}
            </section>

            {(feed?.length ?? 0) > 0 && (
              <section>
                <SectionHead label="discover" cta={{ href: "/circles", label: "see all →" }} />
                <div className="grid gap-3 md:grid-cols-2">
                  {feed!.slice(0, 4).map(addr => <CircleCard key={addr} address={addr} />)}
                </div>
              </section>
            )}
          </div>
        </div>
      )}

      {/* Dark "All In One" editorial section. */}
      <DarkSection />
    </div>
  );
}

function ConnectPrompt() {
  return (
    <section className="card flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <div className="text-base font-semibold">Connect a wallet to see your circles</div>
        <div className="text-sm text-[color:var(--muted-foreground)]">
          Reputation, badges and active circles unlock once you sign in.
        </div>
      </div>
    </section>
  );
}

function DarkSection() {
  return (
    <section className="-mx-6 rounded-3xl bg-brown px-6 py-16 text-cream md:px-12 md:py-24">
      <div className="pill mb-6 inline-flex border-cream/40 text-cream">all in one</div>
      <h2 className="font-display text-4xl leading-[0.95] tracking-tighter md:text-6xl">
        Save together.
        <br />
        Earn yield on idle BTC.
        <br />
        <span className="text-acid">No banks.</span>
      </h2>
      <p className="mt-6 max-w-xl text-base text-cream/70 md:text-lg">
        Every deposit auto-stakes into the circle&rsquo;s yield vault until
        it&rsquo;s the recipient&rsquo;s turn. Principal plus accrued yield,
        every cycle.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/circles/new" className="btn-acid">+ new circle</Link>
        <Link href="/circles" className="btn-primary" style={{ background: "transparent", border: "1px solid rgba(245,240,224,0.4)", color: "var(--cream)" }}>
          see all circles
        </Link>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card text-center">
      <div className="font-display text-3xl font-black">{value}</div>
      <div className="mt-1 text-[10px] uppercase tracking-widest text-[color:var(--muted-foreground)]">{label}</div>
    </div>
  );
}

function SectionHead({ label, cta }: { label: string; cta: { href: string; label: string } }) {
  return (
    <div className="mb-4 flex items-end justify-between">
      <h2 className="font-display text-2xl tracking-tighter">{label}</h2>
      <Link href={cta.href} className="text-sm font-semibold text-brown hover:opacity-70">{cta.label}</Link>
    </div>
  );
}
