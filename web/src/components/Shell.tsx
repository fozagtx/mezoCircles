"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ConnectButton } from "./ConnectButton";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/",         label: "home",     glyph: "~/" },
  { href: "/circles",  label: "circles",  glyph: "○" },
  { href: "/quests",   label: "quests",   glyph: "✶" },
  { href: "/profile",  label: "profile",  glyph: "@" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const isActive = (href: string) =>
    path === href || (href !== "/" && path.startsWith(href));

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="brand-strip h-[3px] w-full" />

      {/* Header — same on mobile + desktop, but desktop adds nav links inline */}
      <header
        className="sticky top-0 z-40"
        style={{
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(12px)",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded font-bold text-white"
              style={{ background: "var(--brand-black)" }}
            >
              m
            </span>
            <span className="font-mono text-sm font-semibold tracking-tight">
              mezo<span className="text-brand-red">Circles</span>
            </span>
          </Link>

          {/* Desktop nav (hidden on mobile) */}
          <nav className="hidden items-center gap-1 md:flex">
            {tabs.map(t => (
              <Link
                key={t.href}
                href={t.href}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-mono transition",
                  isActive(t.href)
                    ? "text-brand-red"
                    : "text-[color:var(--muted-foreground)] hover:text-foreground"
                )}
                style={isActive(t.href) ? { background: "rgba(254, 226, 226, 0.5)" } : undefined}
              >
                {t.label}
              </Link>
            ))}
          </nav>

          <ConnectButton />
        </div>
      </header>

      {/* Main content — narrower on mobile, wider grid on desktop */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-2 md:pb-12 md:pt-6">
        <div className="mx-auto max-w-2xl md:max-w-none">
          {children}
        </div>
      </main>

      {/* Footer marker on desktop */}
      <footer className="hidden border-t border-[color:var(--border)] md:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 text-[11px] text-[color:var(--muted-foreground)]">
          <span>// mezoCircles · on-chain ROSCA on Mezo</span>
          <a
            href="https://explorer.test.mezo.org"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground"
          >
            explorer ↗
          </a>
        </div>
      </footer>

      {/* Bottom mobile nav (hidden on desktop) */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-md items-center justify-around p-2 md:hidden"
        style={{
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(12px)",
          borderTop: "1px solid var(--border)",
        }}
      >
        {tabs.map(t => {
          const active = isActive(t.href);
          return (
            <Link key={t.href} href={t.href} className="relative flex-1">
              <div
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-lg py-1.5 text-[11px] font-mono",
                  active ? "text-brand-red" : "text-[color:var(--muted-foreground)]"
                )}
              >
                <span className="text-base leading-none">{t.glyph}</span>
                <span>{t.label}</span>
              </div>
              {active && (
                <motion.div
                  layoutId="tab-pill"
                  className="absolute inset-0 -z-10 rounded-lg"
                  style={{ background: "rgba(254, 226, 226, 0.5)" }}
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
