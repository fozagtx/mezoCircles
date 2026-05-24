import { useQuery } from "@tanstack/react-query";

async function fetchBtcPrice(): Promise<number> {
  const res = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
    { cache: "no-store" },
  );
  if (!res.ok) throw new Error(`btc price fetch failed: ${res.status}`);
  const data = (await res.json()) as { bitcoin?: { usd?: number } };
  const usd = data.bitcoin?.usd;
  if (typeof usd !== "number") throw new Error("malformed price response");
  return usd;
}

export function useBtcPrice() {
  return useQuery({
    queryKey: ["btc-price-coingecko"],
    queryFn: fetchBtcPrice,
    staleTime: 60_000,
    refetchInterval: 60_000,
    retry: 2,
  });
}
