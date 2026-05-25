# Checkpoint 3 Submission - mezoCircles

## Submission Details

mezoCircles is a BTC-backed MUSD borrowing app built on Mezo. The project gives a user a simple dashboard for opening and managing a Mezo MUSD Trove through a per-user smart contract vault. Instead of exposing the raw BorrowerOperations interface directly, mezoCircles wraps the core actions into four user-facing operations: open a vault, add collateral, repay debt, and close the position.

For this checkpoint, the work includes a deployed Mezo testnet vault contract, Foundry tests, a Mezo capability validation pass, deployment scripts, a live Next.js frontend, protected dashboard routing, wallet connection UX, a liquidity/position monitor, borrowing limits, action controls, and a guided demo prompt. The product scope is intentionally narrow and honest: it focuses on BTC-backed MUSD borrowing first, with liquidation protection and automation planned next.

Key achievements:
- Built `MezoCirclesVault.sol`, a per-user vault contract that owns one Mezo MUSD Trove on behalf of its owner.
- Implemented open, add collateral, repay, and close flows against Mezo's MUSD BorrowerOperations interface.
- Added mock-based Foundry tests and a fork-test path to validate assumptions against live Mezo testnet contracts.
- Deployed a vault on Mezo testnet and ran a manual end-to-end open-vault transaction.
- Built and deployed the web dashboard with Next.js, wagmi, viem, ConnectKit, and Vercel.
- Added product UX for protected wallet-gated dashboard access, position monitoring, protocol limits, repayment approvals, and onboarding/demo guidance.

## Link to Code

https://github.com/fozagtx/mezoCircles

## Link to Presentation

https://github.com/fozagtx/mezoCircles/blob/aura/main/docs/presentation/mezoCircles-checkpoint-3.pptx

## Link to Demo Video

PASTE DEMO VIDEO URL HERE

## Live Demo Link

https://mezocircles.vercel.app/app

## Project Readiness

Working Demo

## How it works

mezoCircles solves the problem of BTC holders needing dollar liquidity without selling BTC, wrapping into a separate asset, or using a bank. A user connects a wallet on Mezo, deposits BTC as collateral, borrows MUSD, and manages the position from a focused dashboard.

On-chain, each user has a `MezoCirclesVault` contract that owns a single Mezo Trove. The vault calls Mezo's BorrowerOperations contract to open the Trove, add collateral, repay MUSD, or close the Trove. When a vault opens, borrowed MUSD is forwarded to the owner wallet. When repaying or closing, the user approves MUSD first, then the vault repays the protocol and returns released BTC collateral.

MUSD is positioned as the borrowed dollar liquidity layer. BTC remains the collateral asset; MUSD is what the user receives, uses, and later repays to close or reduce the loan.

## Target Group

The target users are BTC holders and BTCFi users who want access to dollar liquidity while keeping Bitcoin exposure. It also fits DeFi users who understand collateralized borrowing but want a cleaner, safer interface for Mezo MUSD positions. This aligns with a BTCFi / DeFi lending track because the product increases practical MUSD usage by making BTC-backed borrowing easier to access.

## Product / Product Category

Automated Lending / BTC-backed MUSD Borrowing / CDP Position Management

## Tech Stack

- Solidity 0.8.24
- Foundry for contract build, tests, and fork testing
- Mezo testnet
- Mezo MUSD, BorrowerOperations, TroveManager
- Next.js 16, React 19, TypeScript
- Tailwind CSS v4
- wagmi, viem, ConnectKit
- TanStack Query
- Driver.js for guided demo prompts
- Vercel for deployment

## Unique Value Proposition

Similar products include Liquity-style CDP frontends and DeFi Saver-style position managers. mezoCircles is different because it is purpose-built for Mezo MUSD and uses a per-user vault contract that can become an automation layer, rather than only being a frontend over raw protocol calls. The first version makes BTC-backed MUSD borrowing easier to understand, while the roadmap adds liquidation protection and repayment automation.

## Future Milestones

1. Next 2 weeks: add a vault factory and app-based vault deployment so users no longer need manual vault setup or environment configuration.
2. Next 4 weeks: add liquidation protection, alerts, risk zones, and optional keeper-assisted collateral top-up or repayment flows.
3. Next 6-8 weeks: prepare for mainnet with audit review, finalized Mezo mainnet addresses, bridge-to-borrow documentation, and production monitoring.

## Team Info

Fawuzan / fozagtx - product, smart contracts, frontend, and deployment.

X / LinkedIn: PASTE SOCIAL LINK HERE

## Link to testnet staging environment

https://mezocircles.vercel.app/app

## Demo Video Script

1. Open the live demo and connect a Mezo testnet wallet.
2. Show the protected dashboard state before wallet connection.
3. Connect the wallet and show the position monitor.
4. Explain the borrowing limits: 1,800 MUSD minimum debt and 110% minimum ICR.
5. Show open-position inputs and how the dashboard previews risk.
6. Show the manage-position actions: add collateral, repay debt, approve MUSD, close position.
7. End by showing the deployed testnet contract and explaining that MUSD is the borrowed liquidity layer against BTC collateral.
