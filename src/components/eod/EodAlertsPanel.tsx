"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Bell } from "lucide-react";

type Alert = {
  id: string;
  type: string;
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
};

export function EodAlertsPanel({ branchId }: { branchId?: string }) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = branchId ? `?branchId=${branchId}` : "";
    fetch(`/api/eod/alerts${q}`, { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => setAlerts(d.alerts ?? []))
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  }, [branchId]);

  if (loading) {
    return (
      <div className="eod-cockpit-panel">
        <p className="text-sm text-[var(--muted-foreground)]">Loading alerts…</p>
      </div>
    );
  }

  return (
    <div className="eod-cockpit-panel">
      <header className="eod-cockpit-panel-header">
        <Bell className="h-4 w-4 text-[var(--accent)]" />
        <h3>Smart alerts</h3>
        {alerts.length > 0 && (
          <span className="eod-alert-count">{alerts.length}</span>
        )}
      </header>
      {alerts.length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">No active alerts</p>
      ) : (
        <ul className="eod-alert-list">
          {alerts.slice(0, 6).map((a) => (
            <li key={a.id} className={`eod-alert-item eod-alert-${a.severity}`}>
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <div>
                <p className="text-sm font-medium">{a.title}</p>
                <p className="text-xs opacity-80">{a.message}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
