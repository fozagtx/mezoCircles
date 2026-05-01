"use client";

import Link from "next/link";
import { useDiscoveryFeed } from "@/hooks/useCircles";
import { CircleCard } from "@/components/CircleCard";

export default function CirclesPage() {
  const { data: list, isLoading } = useDiscoveryFeed(50);

  return (
    <div className="flex flex-col gap-4 pt-2">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold uppercase tracking-tight">discover</h1>
        <Link href="/circles/new" className="btn-primary">+ new</Link>
      </div>

      {isLoading && <div className="card text-sm text-[color:var(--muted-foreground)]">loading…</div>}

      {!isLoading && (list?.length ?? 0) === 0 && (
        <div className="card text-sm text-[color:var(--muted-foreground)]">
          no circles yet.{" "}
          <Link href="/circles/new" className="text-brand-red underline">be the first →</Link>
        </div>
      )}

      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
        {list?.map(addr => <CircleCard key={addr} address={addr} />)}
      </div>
    </div>
  );
}
