// Hand-trimmed ABIs (only the functions/events the UI uses).

export const factoryAbi = [
  {
    type: "function", name: "createCircle", stateMutability: "nonpayable",
    inputs: [
      { name: "name", type: "string" },
      { name: "contributionAmount", type: "uint256" },
      { name: "cycleDuration", type: "uint256" },
      { name: "maxMembers", type: "uint8" },
      { name: "token", type: "address" },
      { name: "yieldVault", type: "address" },
    ],
    outputs: [{ name: "circle", type: "address" }],
  },
  { type: "function", name: "allCirclesLength", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "page", stateMutability: "view",
    inputs: [{ name: "offset", type: "uint256" }, { name: "limit", type: "uint256" }],
    outputs: [{ type: "address[]" }] },
  { type: "function", name: "getCirclesByCreator", stateMutability: "view",
    inputs: [{ name: "who", type: "address" }], outputs: [{ type: "address[]" }] },
  { type: "function", name: "getCirclesByMember", stateMutability: "view",
    inputs: [{ name: "who", type: "address" }], outputs: [{ type: "address[]" }] },
  { type: "event", name: "CircleCreated", inputs: [
    { name: "circleId", type: "uint256", indexed: true },
    { name: "circle", type: "address", indexed: true },
    { name: "creator", type: "address", indexed: true },
    { name: "name", type: "string", indexed: false },
    { name: "contributionAmount", type: "uint256", indexed: false },
    { name: "cycleDuration", type: "uint256", indexed: false },
    { name: "maxMembers", type: "uint8", indexed: false },
  ]},
] as const;

export const circleAbi = [
  { type: "function", name: "join", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { type: "function", name: "deposit", stateMutability: "payable", inputs: [], outputs: [] },
  { type: "function", name: "settleCycle", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { type: "function", name: "claimPayout", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { type: "function", name: "claimRefund", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { type: "function", name: "abort", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { type: "function", name: "startEarly", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { type: "function", name: "pendingPayout", stateMutability: "view",
    inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "refundOwed", stateMutability: "view",
    inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "ABORT_GRACE", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "name", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "creator", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "contributionAmount", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "cycleDuration", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "maxMembers", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  { type: "function", name: "token", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "yieldVault", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "totalAssets", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "membersList", stateMutability: "view", inputs: [], outputs: [{ type: "address[]" }] },
  { type: "function", name: "payoutOrderList", stateMutability: "view", inputs: [], outputs: [{ type: "address[]" }] },
  { type: "function", name: "isMember", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "hasDeposited", stateMutability: "view",
    inputs: [{ type: "uint256" }, { type: "address" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "summary", stateMutability: "view", inputs: [],
    outputs: [
      { name: "status", type: "uint8" },
      { name: "currentCycle", type: "uint256" },
      { name: "memberCount", type: "uint8" },
      { name: "depositsThisCycle", type: "uint8" },
      { name: "potBalance", type: "uint256" },
      { name: "nextDeadline", type: "uint256" },
      { name: "nextRecipient", type: "address" },
    ]},
] as const;

export const reputationAbi = [
  { type: "function", name: "claimDailyQuest", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { type: "function", name: "registerReferral", stateMutability: "nonpayable",
    inputs: [{ name: "referrer", type: "address" }], outputs: [] },
  { type: "function", name: "summary", stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [
      { name: "xp", type: "uint64" },
      { name: "rank", type: "uint8" },
      { name: "deposits", type: "uint32" },
      { name: "missed", type: "uint32" },
      { name: "circlesCompleted", type: "uint32" },
      { name: "currentStreak", type: "uint32" },
      { name: "questClaimableToday", type: "bool" },
    ]},
] as const;

export const badgeAbi = [
  { type: "function", name: "balanceOf", stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "hasBadge", stateMutability: "view",
    inputs: [{ type: "address" }, { type: "uint256" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "circleCompletions", stateMutability: "view",
    inputs: [{ type: "address" }], outputs: [{ type: "uint32" }] },
] as const;

export const BADGE_NAMES = [
  "First Deposit",
  "7-Day Streak",
  "30-Day Streak",
  "Circle Completed",
  "Five Circles",
  "Ten Circles",
] as const;

export const RANK_NAMES = ["Bronze", "Silver", "Gold", "Platinum", "Diamond"] as const;
export const RANK_THRESHOLDS = [0, 200, 750, 2000, 5000] as const;

export const erc20Abi = [
  { type: "function", name: "balanceOf", stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "allowance", stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }],
    outputs: [{ type: "uint256" }] },
  { type: "function", name: "approve", stateMutability: "nonpayable",
    inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }],
    outputs: [{ type: "bool" }] },
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  { type: "function", name: "symbol", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
] as const;
