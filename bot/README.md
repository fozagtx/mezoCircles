# mezoCircles bot

Grammy Telegram bot. Two jobs:

1. **Mini App launcher** — every command surface a button that opens the Next.js web app inside Telegram.
2. **On-chain notifier** — polls the factory + tracked circle clones every `POLL_INTERVAL_SECONDS`, pings linked users on deposits, payouts, and circle completion.

State lives in `.data/store.json` (gitignored). For production, swap `storage.ts` for Postgres or Redis.

## Run

```bash
cp .env.example .env
# fill BOT_TOKEN (from @BotFather) + WEBAPP_URL + FACTORY_ADDRESS
pnpm install
pnpm dev
```

## Hook the Mini App into BotFather

In `@BotFather` → your bot → **Mini Apps** → **Configure Mini App** → URL = your Next.js deployment.

The bot already includes a `webApp(...)` button on `/start`, so once Mini App config is set, the button opens it inline.

## Commands

| | |
|---|---|
| `/start [ref_<addr>]` | onboarding; supports referral payload |
| `/link 0x…` | bind a wallet to this chat |
| `/me`       | show current binding |
| `/circles`  | list tracked circles |
| `/quest`    | open the daily-quest screen in the mini app |
| `/invite`   | get your referral link |
| `/help`     | command list |
