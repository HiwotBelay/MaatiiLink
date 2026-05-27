"use client";

import { useEffect, useState } from "react";
import { Activity, AlertTriangle, Clock, TrendingUp } from "lucide-react";

type Analytics = {
  trends: { date: string; count: number; critical: number }[];
  recurringIssues: { category: string; count: number }[];
  branchRiskScore: {
    branchId: string;
    name: string;
    code: string;
    riskScore: number;
    open: number;
    overdue: number;
  }[];
  avgResponseHours: number | null;
  totalIncidents: number;
  openIncidents: number;
  overdueCount: number;
  criticalOpen: number;
};

export function IncidentAnalyticsPanel() {
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    fetch("/api/incidents/analytics?days=30", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => setData(d.analytics ?? null))
      .catch(() => setData(null));
  }, []);

  if (!data) return null;

  const maxTrend = Math.max(...data.trends.map((t) => t.count), 1);

  return (
    <section className="incident-analytics">
      <h2 className="incident-section-title">Operational analytics</h2>
      <div className="incident-analytics-kpis">
        <Kpi icon={Activity} label="Total (30d)" value={String(data.totalIncidents)} />
        <Kpi icon={AlertTriangle} label="Open" value={String(data.openIncidents)} tone="warn" />
        <Kpi icon={Clock} label="Overdue SLA" value={String(data.overdueCount)} tone="danger" />
        <Kpi
          icon={TrendingUp}
          label="Avg response"
          value={data.avgResponseHours != null ? `${data.avgResponseHours}h` : "—"}
        />
      </div>

      <div className="incident-analytics-grid">
        <div className="incident-panel">
          <h3>Incident trends</h3>
          <div className="incident-trend-chart">
            {data.trends.slice(-10).map((t) => (
              <div key={t.date} className="incident-trend-col" title={t.date}>
                <div
                  className="incident-trend-bar"
                  style={{ height: `${(t.count / maxTrend) * 100}%` }}
                />
                <span className="incident-trend-date">{t.date.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="incident-panel">
          <h3>Recurring issues</h3>
          <ul className="incident-recurring-list">
            {data.recurringIssues.map((r) => (
              <li key={r.category}>
                <span>{r.category.replace(/_/g, " ")}</span>
                <strong>{r.count}</strong>
              </li>
            ))}
          </ul>
        </div>

        <div className="incident-panel incident-panel-wide">
          <h3>Branch risk score</h3>
          <div className="incident-risk-table-wrap">
            <table className="incident-risk-table">
              <thead>
                <tr>
                  <th>Branch</th>
                  <th>Open</th>
                  <th>Overdue</th>
                  <th>Risk</th>
                </tr>
              </thead>
              <tbody>
                {data.branchRiskScore.map((b) => (
                  <tr key={b.branchId}>
                    <td>
                      <span className="font-medium">{b.code}</span>
                      <span className="block text-xs opacity-70">{b.name}</span>
                    </td>
                    <td>{b.open}</td>
                    <td>{b.overdue}</td>
                    <td>
                      <span
                        className={`incident-risk-pill ${
                          b.riskScore >= 60
                            ? "incident-risk-high"
                            : b.riskScore >= 30
                              ? "incident-risk-med"
                              : "incident-risk-low"
                        }`}
                      >
                        {b.riskScore}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone?: "warn" | "danger";
}) {
  return (
    <div className={`incident-kpi incident-kpi-${tone ?? "default"}`}>
      <Icon className="h-4 w-4" />
      <div>
        <p className="incident-kpi-value">{value}</p>
        <p className="incident-kpi-label">{label}</p>
      </div>
    </div>
  );
}
