import clsx, { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatUnits } from "viem";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortAddr(addr?: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function formatBtc(wei: bigint, decimals = 6) {
  const s = formatUnits(wei, 18);
  const [int, frac = ""] = s.split(".");
  return `${int}.${frac.slice(0, decimals).padEnd(decimals, "0")}`;
}

export function formatDuration(seconds: bigint | number) {
  const s = typeof seconds === "bigint" ? Number(seconds) : seconds;
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.round(s / 60)}m`;
  if (s < 86400) return `${Math.round(s / 3600)}h`;
  return `${Math.round(s / 86400)}d`;
}

export function timeUntil(deadlineSec: bigint): string {
  const now = Math.floor(Date.now() / 1000);
  const remaining = Number(deadlineSec) - now;
  if (remaining <= 0) return "ready to settle";
  return formatDuration(remaining) + " left";
}
