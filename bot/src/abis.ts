export const factoryAbi = [
  {
    type: "event", name: "CircleCreated",
    inputs: [
      { name: "circleId", type: "uint256", indexed: true },
      { name: "circle", type: "address", indexed: true },
      { name: "creator", type: "address", indexed: true },
      { name: "name", type: "string", indexed: false },
      { name: "contributionAmount", type: "uint256", indexed: false },
      { name: "cycleDuration", type: "uint256", indexed: false },
      { name: "maxMembers", type: "uint8", indexed: false },
    ],
  },
] as const;

export const circleAbi = [
  {
    type: "event", name: "Deposited",
    inputs: [
      { name: "member", type: "address", indexed: true },
      { name: "cycle", type: "uint256", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event", name: "PayoutClaimed",
    inputs: [
      { name: "recipient", type: "address", indexed: true },
      { name: "cycle", type: "uint256", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event", name: "MemberDefaulted",
    inputs: [
      { name: "member", type: "address", indexed: true },
      { name: "cycle", type: "uint256", indexed: true },
    ],
  },
  {
    type: "event", name: "CircleCompleted",
    inputs: [],
  },
] as const;
