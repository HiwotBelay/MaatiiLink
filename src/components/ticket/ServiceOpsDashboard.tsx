"use client";

import { useEffect, useState } from "react";

type Analytics = {
  overdueTickets: number;
  slaBreaches: number;
  activeTickets: number;
  teamWorkload: { assigneeName: string; openCount: number }[];
  branchHeatmap: {
    branchCode: string;
    name: string;
    openTickets: number;
    region: string | null;
  }[];
  departmentQueues: { label: string; openCount: number }[];
};

export function ServiceOpsDashboard() {
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    void fetch("/api/tickets/analytics")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) setData(j.analytics);
      });
  }, []);

  if (!data) return null;

  const maxHeat = Math.max(1, ...data.branchHeatmap.map((b) => b.openTickets));

  return (
    <section className="svc-ops-dashboard">
      <h2 className="svc-section-title">Operations dashboard</h2>
      <div className="svc-dashboard-kpis">
        <div className="svc-kpi svc-kpi-danger">
          <span className="svc-kpi-value">{data.overdueTickets}</span>
          <span className="svc-kpi-label">Overdue tickets</span>
        </div>
        <div className="svc-kpi svc-kpi-warn">
          <span className="svc-kpi-value">{data.slaBreaches}</span>
          <span className="svc-kpi-label">SLA breaches</span>
        </div>
        <div className="svc-kpi">
          <span className="svc-kpi-value">{data.activeTickets}</span>
          <span className="svc-kpi-label">Active tickets</span>
        </div>
      </div>

      <div className="svc-dashboard-grid">
        <div className="svc-panel">
          <h3 className="svc-panel-title">Team workload</h3>
          <ul className="svc-workload-list">
            {data.teamWorkload.map((w) => (
              <li key={w.assigneeName}>
                <span>{w.assigneeName}</span>
                <span className="svc-workload-count">{w.openCount}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="svc-panel">
          <h3 className="svc-panel-title">Department queues</h3>
          <ul className="svc-workload-list">
            {data.departmentQueues.map((d) => (
              <li key={d.label}>
                <span>{d.label}</span>
                <span className="svc-workload-count">{d.openCount}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="svc-panel svc-panel-wide">
          <h3 className="svc-panel-title">Branch issue heatmap</h3>
          {data.branchHeatmap.length === 0 ? (
            <p className="svc-muted">No branch hotspots in the active queue.</p>
          ) : (
            <div className="svc-heatmap">
              {data.branchHeatmap.map((b) => (
                <div key={b.branchCode} className="svc-heat-cell">
                  <div
                    className="svc-heat-bar"
                    style={{
                      height: `${Math.max(12, (b.openTickets / maxHeat) * 72)}px`,
                    }}
                    title={`${b.openTickets} open`}
                  />
                  <span className="svc-heat-code">{b.branchCode}</span>
                  <span className="svc-heat-count">{b.openTickets}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
