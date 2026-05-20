import { Clock, Gauge } from "lucide-react";
import { EOD_STATUS_LABELS } from "@/lib/eod/status";
import type { EodStatus } from "@prisma/client";

type Props = {
  reportDate: string;
  status: string;
  dueAt?: string | null;
  complianceScore?: number | null;
  branchLabel?: string;
};

export function EodCockpitHeader({
  reportDate,
  status,
  dueAt,
  complianceScore,
  branchLabel,
}: Props) {
  const statusLabel = EOD_STATUS_LABELS[status as EodStatus] ?? status;
  const dueLabel = dueAt
    ? new Date(dueAt).toLocaleString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <div className="eod-cockpit-header">
      <div>
        <p className="eod-cockpit-eyebrow">Smart Branch Operations</p>
        <h2 className="eod-cockpit-title">Daily operations report</h2>
        <p className="eod-cockpit-meta">
          {reportDate}
          {branchLabel ? ` · ${branchLabel}` : ""}
        </p>
      </div>
      <div className="eod-cockpit-header-metrics">
        <div className="eod-metric-pill">
          <span className={`eod-status-badge eod-status-${status.toLowerCase()}`}>
            {statusLabel}
          </span>
        </div>
        {complianceScore != null && (
          <div className="eod-metric-pill">
            <Gauge className="h-4 w-4" />
            <span>{complianceScore}% compliance</span>
          </div>
        )}
        {dueLabel && status === "PENDING" && (
          <div className="eod-metric-pill">
            <Clock className="h-4 w-4" />
            <span>Due {dueLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
}
