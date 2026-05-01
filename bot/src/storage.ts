import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

/**
 * Tiny JSON file store. Holds:
 *  - users:  telegram chat id ↔ wallet address
 *  - circles: known circle clone addresses
 *  - cursor: last block we processed for events
 *  - subs: which chat ids should be pinged for which addresses
 */
export type Store = {
  users: Record<string, { wallet?: string }>;       // chatId -> profile
  walletToChat: Record<string, string>;             // lowercased address -> chatId
  circles: string[];                                 // discovered clone addresses
  lastBlock: number;
};

const PATH = process.env.STORE_PATH ?? ".data/store.json";

function ensureDir() {
  const dir = dirname(PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

export function load(): Store {
  ensureDir();
  if (!existsSync(PATH)) {
    return { users: {}, walletToChat: {}, circles: [], lastBlock: 0 };
  }
  return JSON.parse(readFileSync(PATH, "utf8"));
}

export function save(s: Store) {
  ensureDir();
  writeFileSync(PATH, JSON.stringify(s, null, 2));
}
