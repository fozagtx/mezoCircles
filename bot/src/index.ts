import "dotenv/config";
import { Bot, InlineKeyboard } from "grammy";
import { createPublicClient, http, isAddress, formatEther, parseAbiItem } from "viem";
import { factoryAbi, circleAbi } from "./abis.js";
import { load, save, type Store } from "./storage.js";

const env = (k: string, fallback?: string) => {
  const v = process.env[k] ?? fallback;
  if (!v) throw new Error(`missing env: ${k}`);
  return v;
};

const BOT_TOKEN     = env("BOT_TOKEN");
const WEBAPP_URL    = env("WEBAPP_URL");
const RPC_URL       = env("RPC_URL", "https://rpc.test.mezo.org");
const FACTORY       = env("FACTORY_ADDRESS") as `0x${string}`;
const EXPLORER_URL  = env("EXPLORER_URL", "https://explorer.test.mezo.org");
const POLL_SECONDS  = Number(process.env.POLL_INTERVAL_SECONDS ?? 15);

const pub = createPublicClient({ transport: http(RPC_URL) });
const bot = new Bot(BOT_TOKEN);
let store: Store = load();

// --------- COMMANDS ---------

bot.command("start", async (ctx) => {
  const payload = ctx.match?.toString().trim();
  const chatId = String(ctx.chat.id);
  store.users[chatId] ??= {};

  // Referral payload format: ref_<address>
  let referralNote = "";
  if (payload?.startsWith("ref_")) {
    const ref = payload.slice(4);
    if (isAddress(ref)) referralNote = `\n\nyou were invited by \`${ref}\` — link your wallet then run /referral to claim +50 XP.`;
  }

  save(store);
  await ctx.reply(
    [
      "*mezoCircles* — save BTC together on Mezo.",
      "",
      "/link `0x…`        link your wallet so I can ping you on circle events",
      "/me                show your linked wallet",
      "/circles           list circles you're a member of",
      "/quest             open today's daily quest",
      "/help              show all commands",
      referralNote,
    ].join("\n"),
    {
      parse_mode: "Markdown",
      reply_markup: new InlineKeyboard().webApp("✦ open mini app", WEBAPP_URL),
    }
  );
});

bot.command("help", (ctx) =>
  ctx.reply(
    "/link `0x…` — bind a wallet\n/me — show binding\n/circles — your circles\n/quest — daily quest\n/invite — get your referral link",
    { parse_mode: "Markdown" }
  )
);

bot.command("link", async (ctx) => {
  const arg = ctx.match.toString().trim();
  if (!isAddress(arg)) return ctx.reply("usage: /link 0xYourAddress");
  const chatId = String(ctx.chat.id);
  const lower = arg.toLowerCase();

  store.users[chatId] = { wallet: lower };
  store.walletToChat[lower] = chatId;
  save(store);

  await ctx.reply(`linked \`${lower}\` ✓`, { parse_mode: "Markdown" });
});

bot.command("me", (ctx) => {
  const w = store.users[String(ctx.chat.id)]?.wallet;
  return ctx.reply(w ? `your wallet: \`${w}\`` : "no wallet linked. use /link 0x…", { parse_mode: "Markdown" });
});

bot.command("circles", async (ctx) => {
  const w = store.users[String(ctx.chat.id)]?.wallet;
  if (!w) return ctx.reply("link a wallet first with /link 0x…");

  const all: `0x${string}`[] = [];
  for (const c of store.circles) all.push(c as `0x${string}`);

  if (all.length === 0) return ctx.reply("no circles tracked yet — create one in the mini app.");
  const lines = all.map((addr, i) => `${i + 1}. ${EXPLORER_URL}/address/${addr}`);
  await ctx.reply(`tracked circles:\n\n${lines.join("\n")}`);
});

bot.command("quest", (ctx) =>
  ctx.reply("daily quest lives in the mini app:", {
    reply_markup: new InlineKeyboard().webApp("✶ open quests", `${WEBAPP_URL}/quests`),
  })
);

bot.command("invite", (ctx) => {
  const w = store.users[String(ctx.chat.id)]?.wallet;
  if (!w) return ctx.reply("link a wallet first with /link 0x…");
  const me = ctx.me?.username ?? "mezocircles_bot";
  const url = `https://t.me/${me}?start=ref_${w}`;
  return ctx.reply(`share this link:\n${url}\n\nwhen a friend joins via it, both of you get +50 XP.`);
});

// --------- EVENT POLLER ---------

const depositedEvt = parseAbiItem("event Deposited(address indexed member, uint256 indexed cycle, uint256 amount)");
const payoutEvt    = parseAbiItem("event PayoutClaimed(address indexed recipient, uint256 indexed cycle, uint256 amount)");
const completedEvt = parseAbiItem("event CircleCompleted()");
const createdEvt   = parseAbiItem("event CircleCreated(uint256 indexed circleId, address indexed circle, address indexed creator, string name, uint256 contributionAmount, uint256 cycleDuration, uint8 maxMembers)");

async function poll() {
  try {
    const head = await pub.getBlockNumber();
    const from = store.lastBlock === 0 ? head : BigInt(store.lastBlock + 1);
    if (from > head) return;

    // 1. discover new circles
    const created = await pub.getLogs({ address: FACTORY, event: createdEvt, fromBlock: from, toBlock: head });
    for (const log of created) {
      const circle = log.args.circle!;
      const creator = log.args.creator!;
      if (!store.circles.includes(circle)) store.circles.push(circle);
      const chat = store.walletToChat[creator.toLowerCase()];
      if (chat) {
        await bot.api.sendMessage(chat, `✓ your circle "${log.args.name}" is live\n${EXPLORER_URL}/address/${circle}`);
      }
    }

    // 2. for each known circle, scan deposit / payout / completion events and ping members
    for (const c of store.circles as `0x${string}`[]) {
      const [deposits, payouts, completions] = await Promise.all([
        pub.getLogs({ address: c, event: depositedEvt, fromBlock: from, toBlock: head }),
        pub.getLogs({ address: c, event: payoutEvt,    fromBlock: from, toBlock: head }),
        pub.getLogs({ address: c, event: completedEvt, fromBlock: from, toBlock: head }),
      ]);

      for (const log of deposits) {
        const m = log.args.member!.toLowerCase();
        const chat = store.walletToChat[m];
        if (chat) await bot.api.sendMessage(chat, `+10 XP · deposit confirmed (${formatEther(log.args.amount!)} BTC)`);
      }
      for (const log of payouts) {
        const r = log.args.recipient!.toLowerCase();
        const chat = store.walletToChat[r];
        if (chat) {
          await bot.api.sendMessage(
            chat,
            `🎉 payout received: ${formatEther(log.args.amount!)} BTC\n${EXPLORER_URL}/address/${c}`
          );
        }
      }
      for (const _ of completions) {
        // Broadcast circle completion to every linked member chat (best-effort, ignores who).
        const message = `✓ circle completed · ${EXPLORER_URL}/address/${c}`;
        for (const chat of Object.values(store.walletToChat)) {
          await bot.api.sendMessage(chat, message).catch(() => {});
        }
      }
    }

    store.lastBlock = Number(head);
    save(store);
  } catch (e) {
    console.error("poll error:", (e as Error).message);
  }
}

// --------- BOOT ---------

bot.catch((err) => console.error("bot error:", err));

await bot.start({
  onStart: (info) => {
    console.log(`bot @${info.username} online; polling chain every ${POLL_SECONDS}s`);
    setInterval(poll, POLL_SECONDS * 1000);
    void poll();
  },
});
