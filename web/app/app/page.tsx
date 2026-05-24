/* Hallmark · macrostructure: Workbench · design-system: design.md · designed-as-app */

import { VaultStatus } from "@/components/VaultStatus";
import { VaultActions } from "@/components/VaultActions";
import { MEZO_TESTNET, VAULT_ADDRESS } from "@/lib/mezo";

export default function App() {
  return (
    <main className="workbench">
      <header className="workbench-header">
        <div>
          <p className="workbench-kicker">Mezo testnet</p>
          <h1>Borrow MUSD</h1>
        </div>
        <div className="workbench-meta" aria-label="Deployment state">
          <span>{VAULT_ADDRESS ? "Ready" : "Setup needed"}</span>
        </div>
      </header>

      <div className="workbench-grid">
        <aside>
          <div className="panel-heading">
            <h2 className="section-eyebrow">Position</h2>
            <span>Your BTC and MUSD</span>
          </div>
          <VaultStatus />
          <Constraints />
        </aside>

        <section>
          <div className="panel-heading">
            <h2 className="section-eyebrow">Actions</h2>
            <span>Open, repay, close</span>
          </div>
          <VaultActions />
        </section>
      </div>
    </main>
  );
}

function Constraints() {
  const items: ReadonlyArray<readonly [string, string]> = [
    ["Min debt", "1,800 MUSD"],
    ["Min ICR", "110%"],
    ["Interest", "1–5% APR"],
    ["Redemption fee", "0.75%"],
    ["MUSD", shortAddr(MEZO_TESTNET.musd)],
  ];
  return (
    <div className="card protocol-card">
      <h3 className="section-eyebrow">Borrowing limits</h3>
      {items.map(([k, v]) => (
        <div key={k} className="card-row">
          <span className="label">{k}</span>
          <span className="value">{v}</span>
        </div>
      ))}
    </div>
  );
}

function shortAddr(a: string): string {
  return `${a.slice(0, 6)}...${a.slice(-4)}`;
}
