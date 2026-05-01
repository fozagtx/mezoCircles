# mezoCircles web

Next.js 14 (App Router) + wagmi v2 + viem + Tailwind + Framer Motion.

## Run locally

```bash
pnpm install
cp .env.example .env.local
# fill NEXT_PUBLIC_FACTORY_ADDRESS / REPUTATION_ADDRESS / BADGE_ADDRESS from your forge deploy
pnpm dev
```

## Telegram Mini App

The Telegram WebApp SDK is loaded in `app/layout.tsx`. When opened from inside Telegram (via the bot's Mini App button), `Providers` calls `Telegram.WebApp.ready()` + `expand()` and themes the header. Outside Telegram the app still works as a normal web app.

## Design system

- Font: **JetBrains Mono** everywhere
- Background: warm off-white `oklch(98% .003 85)`
- Brand red `#E5322D` for accents/active nav/links
- Brand black `#1A1A18` for primary CTAs
- Pill-shape buttons (`rounded-full`)
- 8 px radius cards
