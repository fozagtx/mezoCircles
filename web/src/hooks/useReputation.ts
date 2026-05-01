"use client";

import { useReadContract } from "wagmi";
import { reputationAbi } from "@/lib/abis";
import { REPUTATION_ADDRESS, CONTRACTS_DEPLOYED } from "@/lib/wagmi";

export function useReputation(address?: `0x${string}`) {
  return useReadContract({
    abi: reputationAbi,
    address: REPUTATION_ADDRESS,
    functionName: "summary",
    args: address ? [address] : undefined,
    query: { enabled: CONTRACTS_DEPLOYED && Boolean(address) },
  });
}
