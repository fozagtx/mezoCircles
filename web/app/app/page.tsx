/* Hallmark · macrostructure: Workbench · design-system: design.md · designed-as-app */

import { VaultStatus } from "@/components/VaultStatus";
import { VaultActions } from "@/components/VaultActions";
import {
  MotionAside,
  MotionSection,
  MotionWorkbench,
  MotionWorkbenchGrid,
} from "@/components/PageMotion";
import { MEZO_TESTNET } from "@/lib/mezo";

export default function App() {
  return (
    <MotionWorkbench>
      <MotionWorkbenchGrid>
        <MotionAside>
          <VaultStatus />
          <Constraints />
        </MotionAside>

        <MotionSection>
          <div className="panel-heading">
            <h2 className="section-eyebrow">Actions</h2>
            <span>Open, repay, close</span>
          </div>
          <VaultActions />
        </MotionSection>
      </MotionWorkbenchGrid>
    </MotionWorkbench>
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
    <div id="borrowing-limits" className="card protocol-card">
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
