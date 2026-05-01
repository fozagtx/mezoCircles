"use client";

import { useReadContract, useReadContracts } from "wagmi";
import { circleAbi, factoryAbi } from "@/lib/abis";
import { FACTORY_ADDRESS, CONTRACTS_DEPLOYED } from "@/lib/wagmi";

export function useMyCircles(address?: `0x${string}`) {
  return useReadContract({
    abi: factoryAbi,
    address: FACTORY_ADDRESS,
    functionName: "getCirclesByMember",
    args: address ? [address] : undefined,
    query: { enabled: CONTRACTS_DEPLOYED && Boolean(address) },
  });
}

export function useDiscoveryFeed(limit = 20) {
  return useReadContract({
    abi: factoryAbi,
    address: FACTORY_ADDRESS,
    functionName: "page",
    args: [0n, BigInt(limit)],
    query: { enabled: CONTRACTS_DEPLOYED },
  });
}

export function useCircleSummary(circle?: `0x${string}`) {
  return useReadContracts({
    contracts: circle ? [
      { abi: circleAbi, address: circle, functionName: "name" },
      { abi: circleAbi, address: circle, functionName: "contributionAmount" },
      { abi: circleAbi, address: circle, functionName: "cycleDuration" },
      { abi: circleAbi, address: circle, functionName: "maxMembers" },
      { abi: circleAbi, address: circle, functionName: "creator" },
      { abi: circleAbi, address: circle, functionName: "summary" },
      { abi: circleAbi, address: circle, functionName: "membersList" },
      { abi: circleAbi, address: circle, functionName: "payoutOrderList" },
    ] : [],
    query: { enabled: CONTRACTS_DEPLOYED && Boolean(circle) },
  });
}
