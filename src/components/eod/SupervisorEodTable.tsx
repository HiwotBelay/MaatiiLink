"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { EOD_STATUS_LABELS } from "@/lib/eod/status";
import type { EodStatus } from "@prisma/client";

type Row = {
  branchId: string;
  name: string;
  branchCode: string;
  district: string | null;
  eodStatus: string;
  reportId: string | null;
  complianceScore?: number | null;
};

export function SupervisorEodTable({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function reviewReport(reportId: string) {
    setLoadingId(reportId);
    try {
      const res = await fetch(`/api/eod/${reportId}/review`, { method: "POST" });
      if (res.ok) router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="eod-history-table-wrap">
      <table className="eod-history-table">
        <thead>
          <tr>
            <th>Branch</th>
            <th>Code</th>
            <th>Status</th>
            <th>Score</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.branchId}>
              <td className="font-medium">{r.name}</td>
              <td className="text-[var(--muted-foreground)]">{r.branchCode}</td>
              <td>
                <EodStatusPill status={r.eodStatus} />
              </td>
              <td>
                {r.complianceScore != null ? `${r.complianceScore}%` : "—"}
              </td>
              <td>
                {["SUBMITTED", "LATE", "ESCALATED"].includes(r.eodStatus) &&
                  r.reportId && (
                    <button
                      type="button"
                      disabled={loadingId === r.reportId}
                      onClick={() => reviewReport(r.reportId!)}
                      className="eod-history-link border-0 bg-transparent p-0 cursor-pointer"
                    >
                      Approve & lock
                    </button>
                  )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EodStatusPill({ status }: { status: string }) {
  const label =
    status === "MISSING"
      ? "Missing"
      : (EOD_STATUS_LABELS[status as EodStatus] ?? status);
  return (
    <span className={`eod-status-badge eod-status-${status.toLowerCase()}`}>
      {label}
    </span>
  );
}
