import { RANK_NAMES, RANK_THRESHOLDS } from "@/lib/abis";
import { cn } from "@/lib/utils";

const colors = ["text-bronze", "text-silver", "text-gold", "text-platinum", "text-diamond"];

export function RankBadge({ rank, xp }: { rank: number; xp: bigint }) {
  const name = RANK_NAMES[rank] ?? "Bronze";
  const next = RANK_THRESHOLDS[rank + 1];
  const cur = Number(xp);
  const progress = next ? Math.min(100, Math.round((cur / next) * 100)) : 100;

  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <div className="flex items-center gap-2">
          <span className={cn("text-xl font-bold uppercase tracking-tight", colors[rank])}>
            {name}
          </span>
          <span className="text-xs uppercase text-[color:var(--muted-foreground)]">rank</span>
        </div>
        <div className="text-2xl font-bold">
          {cur.toLocaleString()}
          <span className="ml-1 text-xs font-normal text-[color:var(--muted-foreground)]">XP</span>
        </div>
      </div>
      {next ? (
        <>
          <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--secondary)" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progress}%`, background: "var(--brand-red)" }}
            />
          </div>
          <div className="text-xs text-[color:var(--muted-foreground)]">
            {(next - cur).toLocaleString()} XP → {RANK_NAMES[rank + 1]}
          </div>
        </>
      ) : (
        <div className="text-xs text-diamond">// max rank achieved</div>
      )}
    </div>
  );
}
