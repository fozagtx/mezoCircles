"use client";

import { useMemo, useState } from "react";

const MIN_DEBT_MUSD = 1800;

const musdFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

export function PaybackCalculator() {
  const [loanAmount, setLoanAmount] = useState("1800");
  const [months, setMonths] = useState("12");
  const [apr, setApr] = useState("5");

  const result = useMemo(() => {
    const principal = positiveNumber(loanAmount);
    const termMonths = positiveNumber(months);
    const annualRate = positiveNumber(apr);
    const interest = principal * (annualRate / 100) * (termMonths / 12);
    const payback = principal + interest;

    return {
      annualRate,
      interest,
      payback,
      principal,
      termMonths,
    };
  }, [apr, loanAmount, months]);

  const hasValidLoan = result.principal > 0 && result.termMonths > 0;
  const belowMinimum = result.principal > 0 && result.principal < MIN_DEBT_MUSD;

  return (
    <div className="card payback-card">
      <div className="payback-copy">
        <div>
          <h3 className="section-eyebrow">Borrow time machine</h3>
          <p>
            If I borrowed{" "}
            <strong>{hasValidLoan ? formatMusd(result.principal) : "--"} MUSD</strong>, I would pay back...
          </p>
        </div>
        <div className="payback-total" aria-live="polite">
          <span>{hasValidLoan ? formatMusd(result.payback) : "--"}</span>
          <small>MUSD</small>
        </div>
      </div>

      <div className="payback-controls">
        <label className="field">
          <span className="field-label">Loan amount (MUSD)</span>
          <input
            className="field-input"
            inputMode="decimal"
            value={loanAmount}
            onChange={(event) => setLoanAmount(event.target.value)}
            placeholder="1800"
          />
        </label>
        <label className="field">
          <span className="field-label">Months</span>
          <input
            className="field-input"
            inputMode="decimal"
            value={months}
            onChange={(event) => setMonths(event.target.value)}
            placeholder="12"
          />
        </label>
        <label className="field">
          <span className="field-label">APR (%)</span>
          <input
            className="field-input"
            inputMode="decimal"
            value={apr}
            onChange={(event) => setApr(event.target.value)}
            placeholder="5"
          />
        </label>
      </div>

      <div className="payback-rows">
        <div className="card-row">
          <span className="label">Interest</span>
          <span className="value">{hasValidLoan ? `${formatMusd(result.interest)} MUSD` : "--"}</span>
        </div>
        <div className="card-row">
          <span className="label">Term</span>
          <span className="value">
            {hasValidLoan ? `${formatTerm(result.termMonths)} at ${formatRate(result.annualRate)} APR` : "--"}
          </span>
        </div>
        {belowMinimum && (
          <p className="payback-warning">Mezo minimum debt is 1,800 MUSD.</p>
        )}
      </div>
    </div>
  );
}

function positiveNumber(value: string): number {
  const parsed = Number.parseFloat(value.replaceAll(",", ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function formatMusd(value: number): string {
  return musdFormatter.format(value);
}

function formatRate(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "--";
  return `${value.toFixed(value % 1 === 0 ? 0 : 2)}%`;
}

function formatTerm(value: number): string {
  const rounded = Number.isInteger(value) ? value.toString() : value.toFixed(1);
  return `${rounded} ${value === 1 ? "month" : "months"}`;
}
