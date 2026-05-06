"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ConnectButton } from "./ConnectButton";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/",         label: "home" },
  { href: "/circles",  label: "circles" },
  { href: "/quests",   label: "quests" },
  { href: "/profile",  label: "profile" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const isActive = (href: string) =>
    path === href || (href !== "/" && path.startsWith(href));

  return (
    <div className="flex min-h-dvh flex-col bg-cream text-brown">
      {/* Header — generous height, lowercase wordmark, pill nav. */}
      <header
        className="sticky top-0 z-40 border-b border-[color:var(--border)]"
        style={{
          background: "rgba(245, 240, 224, 0.85)",
          backdropFilter: "blur(14px)",
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <Spiral />
            <span className="text-lg font-semibold tracking-tight">
              mezocircles
            </span>
          </Link>

          {/* Desktop nav — pill chips, lime active state. */}
          <nav className="hidden items-center gap-1 md:flex">
            {tabs.map(t => (
              <Link
                key={t.href}
                href={t.href}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm transition",
                  isActive(t.href)
                    ? "bg-acid text-brown font-semibold"
                    : "text-[color:var(--muted-foreground)] hover:text-brown"
                )}
              >
                {t.label}
              </Link>
            ))}
          </nav>

          <ConnectButton />
        </div>
      </header>

      {/* Marquee ticker — editorial-magazine device. */}
      <div className="overflow-hidden border-b border-[color:var(--border)] bg-cream py-3">
        <div className="ticker text-2xl text-brown md:text-3xl">
          {Array.from({ length: 4 }).map((_, i) => (
            <Marquee key={i} />
          ))}
        </div>
      </div>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-32 pt-6 md:pb-16 md:pt-10">
        {children}
      </main>

      <footer className="hidden border-t border-[color:var(--border)] md:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 text-xs text-[color:var(--muted-foreground)]">
          <span>mezocircles · save BTC together · on Mezo</span>
          <a
            href="https://explorer.test.mezo.org"
            target="_blank"
            rel="noreferrer"
            className="hover:text-brown"
          >
            explorer ↗
          </a>
        </div>
      </footer>

      {/* Bottom mobile nav — pill chip with lime active state. */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-md items-center justify-around p-2 md:hidden"
        style={{
          background: "rgba(245, 240, 224, 0.95)",
          backdropFilter: "blur(14px)",
          borderTop: "1px solid var(--border)",
        }}
      >
        {tabs.map(t => {
          const active = isActive(t.href);
          return (
            <Link key={t.href} href={t.href} className="relative flex-1">
              <div
                className={cn(
                  "flex items-center justify-center rounded-full py-2 text-xs font-semibold transition",
                  active ? "text-brown" : "text-[color:var(--muted-foreground)]"
                )}
              >
                {t.label}
              </div>
              {active && (
                <motion.div
                  layoutId="tab-pill"
                  className="absolute inset-0 -z-10 rounded-full bg-acid"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

/** Onboard-style spiral mark — abstract motion symbol for the wordmark. */
function Spiral() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
      <path
        d="M14 6.5a7.5 7.5 0 1 1-7.5 7.5 5.5 5.5 0 0 1 5.5-5.5 4 4 0 0 1 4 4 2.5 2.5 0 0 1-2.5 2.5"
        fill="none"
        stroke="#1A1200"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Marquee() {
  const items = ["save BTC together", "✦", "rotating circles", "✦", "earn yield", "✦", "no banks", "✦"];
  return (
    <span className="flex gap-10">
      {items.map((t, i) => <span key={i}>{t}</span>)}
    </span>
  );
}
