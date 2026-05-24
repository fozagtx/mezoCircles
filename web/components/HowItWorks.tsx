type Step = {
  n: string;
  title: string;
  body: string;
};

const STEPS: ReadonlyArray<Step> = [
  {
    n: "01",
    title: "Connect wallet",
    body: "Use any wallet on Mezo testnet (chain 31611). BTC pays the gas.",
  },
  {
    n: "02",
    title: "Deposit BTC",
    body: "Send BTC into your vault as collateral. The protocol requires at least 110% coverage.",
  },
  {
    n: "03",
    title: "Mint MUSD",
    body: "Borrow at least 1,800 MUSD against your locked BTC. Interest is locked at 1–5% APR.",
  },
  {
    n: "04",
    title: "Manage or close",
    body: "Add collateral, repay debt, or close the vault at any time and reclaim your BTC.",
  },
];

export function HowItWorks() {
  return (
    <section className="how" aria-labelledby="how-heading">
      <h2 id="how-heading" className="how-eyebrow">
        How it works
      </h2>
      <ol className="how-steps">
        {STEPS.map((s, i) => (
          <li
            key={s.n}
            className="how-step"
            style={{ animationDelay: `${i * 90}ms` }}
          >
            <span className="how-num">{s.n}</span>
            <h3 className="how-title">{s.title}</h3>
            <p className="how-body">{s.body}</p>
          </li>
        ))}
        <span className="how-cursor" aria-hidden="true">
          <svg viewBox="0 0 18 22" width="22" height="22">
            <path
              d="M2 1.5 L16 11 L9.5 11.7 L7.7 19 Z"
              fill="var(--color-ink)"
              stroke="var(--color-paper)"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </ol>
    </section>
  );
}
