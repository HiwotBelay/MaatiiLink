import Link from "next/link";
import { EOD_STATUS_LABELS } from "@/lib/eod/status";
import type { EodStatus } from "@prisma/client";

type Row = {
  id: string;
  reportDate: string;
  status: string;
  submittedAt: string | null;
  complianceScore?: number | null;
};

export function EodHistory({ reports }: { reports: Row[] }) {
  if (reports.length === 0) {
    return (
      <p className="text-sm text-[var(--muted-foreground)]">No reports in this period.</p>
    );
  }

  return (
    <div className="eod-history-table-wrap">
      <table className="eod-history-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Status</th>
            <th>Score</th>
            <th>Submitted</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {reports.map((r) => (
            <tr key={r.id}>
              <td className="font-medium">{r.reportDate}</td>
              <td>
                <span className={`eod-status-badge eod-status-${r.status.toLowerCase()}`}>
                  {EOD_STATUS_LABELS[r.status as EodStatus] ?? r.status}
                </span>
              </td>
              <td>{r.complianceScore != null ? `${r.complianceScore}%` : "—"}</td>
              <td className="text-[var(--muted-foreground)]">
                {r.submittedAt
                  ? new Date(r.submittedAt).toLocaleString()
                  : "—"}
              </td>
              <td>
                <Link href={`/eod?date=${r.reportDate}`} className="eod-history-link">
                  Open
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
