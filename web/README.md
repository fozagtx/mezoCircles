# mezoCircles · web

Next.js 16 frontend for the `MezoCirclesVault` contract on Mezo testnet.

## Stack

- Next.js 16.2.6 (May 2026 security release — patched against CVE-2026-44572 through CVE-2026-44582)
- React 19.2.6
- Wagmi 2.19.5 + viem 2.50.4
- ConnectKit 1.9.2 (Family)
- TanStack Query 5.100.11
- Tailwind CSS 4

All versions pinned. No `^` ranges on direct deps.

## Local dev

```bash
cd web
pnpm install                      # or npm install
cp .env.local.example .env.local  # fill WalletConnect ID, vault address if deployed
pnpm dev                          # http://localhost:3000
```

If `NEXT_PUBLIC_VAULT_ADDRESS` is empty, the UI shows an honest "not deployed yet" state — no fake data.

## Build

```bash
pnpm build
pnpm start
```

## Notes

- Single page. Two-column on `lg:`, single column below.
- Connects via RainbowKit; only Mezo testnet (chain 31611) configured.
- Reads `vaultStatus`, `vaultDebt`, `vaultCollateral` from the deployed vault.
- Writes: `openVault`, `addCollateral`, `repayDebt`, `closeVault` — same surface as the Solidity contract.
