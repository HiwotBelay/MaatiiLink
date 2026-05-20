"use client";

import { useEffect, useState } from "react";
import { TrendingDown, ShieldAlert } from "lucide-react";

type Analytics = {
  lateTrend: { date: string; onTime: number; late: number; pending: number }[];
  riskIndicators: {
    key: string;
    label: string;
    value: number;
    level: "low" | "medium" | "high";
  }[];
  avgCompliance: number;
};

export function EodSupervisorAnalytics() {
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    fetch("/api/eod/analytics?days=14", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => setData(d.analytics ?? null))
      .catch(() => setData(null));
  }, []);

  if (!data) return null;

  const maxLate = Math.max(...data.lateTrend.map((p) => p.late + p.pending), 1);

  return (
    <div className="eod-analytics-grid">
      <div className="eod-cockpit-panel">
        <header className="eod-cockpit-panel-header">
          <TrendingDown className="h-4 w-4 text-[var(--accent)]" />
          <h3>Late submission trend (14d)</h3>
        </header>
        <div className="eod-trend-chart">
          {data.lateTrend.slice(-7).map((p) => (
            <div key={p.date} className="eod-trend-bar-group" title={p.date}>
              <div
                className="eod-trend-bar eod-trend-bar-late"
                style={{
                  height: `${((p.late + p.pending) / maxLate) * 100}%`,
                }}
              />
              <span className="eod-trend-label">{p.date.slice(5)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="eod-cockpit-panel">
        <header className="eod-cockpit-panel-header">
          <ShieldAlert className="h-4 w-4 text-[var(--accent)]" />
          <h3>Operational risk</h3>
        </header>
        <ul className="eod-risk-list">
          {data.riskIndicators.map((r) => (
            <li key={r.key} className={`eod-risk-item eod-risk-${r.level}`}>
              <span>{r.label}</span>
              <strong>
                {r.value}
                {r.key === "avg_compliance" ? "%" : ""}
              </strong>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-[var(--muted-foreground)]">
          Network avg compliance: <strong>{data.avgCompliance}%</strong>
        </p>
      </div>
    </div>
  );
}
