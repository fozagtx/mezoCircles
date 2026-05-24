"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";

export function ConnectRedirect({ to }: { to: string }) {
  const router = useRouter();
  const { isConnected } = useAccount();

  useEffect(() => {
    if (isConnected) router.replace(to);
  }, [isConnected, router, to]);

  return null;
}
