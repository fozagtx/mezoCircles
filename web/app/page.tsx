import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { ConnectRedirect } from "@/components/ConnectRedirect";
import { HowItWorks } from "@/components/HowItWorks";

/* Hallmark · genre: modern-minimal · macrostructure: Marquee Hero · theme: paper-amber
 * H1 Marquee knobs: size=xxl, alignment=left-bias, underlay=rule-below
 * nav: N5 · footer: Ft2 · enrichment: none
 * design-system: design.md · designed-as-app
 */

export default function Landing() {
  return (
    <>
      <ConnectRedirect to="/app" />
      <Nav />
      <main className="landing">
        <section className="marquee">
          <h1 className="display">
            Borrow dollars
            <br />
            against your Bitcoin.
          </h1>
        </section>

        <hr className="rule-thick" aria-hidden />

        <section className="below">
          <div className="lede">
            <p>
              No selling, no wrapping, no bank. Deposit BTC, borrow MUSD, and
              repay when ready to release your Bitcoin back.
            </p>
          </div>

          <HowItWorks />

          <dl className="facts">
            <Fact term="Minimum debt" value="1,800 MUSD" note="Per vault, protocol-set." />
            <Fact term="Minimum ICR" value="110%" note="Below this, vaults are liquidatable." />
            <Fact term="Interest" value="1–5% APR" note="Set by InterestRateManager, locked at open." />
            <Fact term="Redemption fee" value="0.75%" note="Charged on BTC released via redemption." />
            <Fact term="Gas token" value="BTC" note="Mezo pays gas natively in BTC." />
            <Fact term="Network" value="Mezo testnet" note="Real testnet, not mock." />
          </dl>

          <div className="cta-row">
            <Link href="/app" className="primary-cta">
              Borrow MUSD
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Fact({ term, value, note }: { term: string; value: string; note: string }) {
  return (
    <div className="fact">
      <dt>{term}</dt>
      <dd className="value">{value}</dd>
      <dd className="note">{note}</dd>
    </div>
  );
}
