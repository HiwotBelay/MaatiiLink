"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type ComplianceRow = {
  branchId: string;
  name: string;
  branchCode: string;
  district: string | null;
  eodStatus: string;
  reportId: string | null;
  openIncidents: number;
  overdueDirectives: number;
};

type Props = {
  rows: ComplianceRow[];
};

export function ComplianceTable({ rows }: Props) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function lockReport(reportId: string) {
    setLoadingId(reportId);
    try {
      const res = await fetch(`/api/eod/${reportId}/lock`, { method: "POST" });
      if (res.ok) router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="polished-card overflow-hidden rounded-[1.5rem]">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Branch</th>
            <th className="px-4 py-3">EOD today</th>
            <th className="px-4 py-3">Open incidents</th>
            <th className="px-4 py-3">Overdue acks</th>
            <th className="px-4 py-3">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.branchId} className="border-b border-slate-100 last:border-0">
              <td className="px-4 py-3">
                <p className="font-medium">{r.name}</p>
                <p className="text-xs text-slate-500">{r.branchCode}</p>
              </td>
              <td className="px-4 py-3">
                <EodStatusPill status={r.eodStatus} />
              </td>
              <td className="px-4 py-3">
                <span
                  className={
                    r.openIncidents > 0 ? "font-medium text-amber-700" : "text-slate-500"
                  }
                >
                  {r.openIncidents}
                </span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={
                    r.overdueDirectives > 0 ? "font-medium text-red-700" : "text-slate-500"
                  }
                >
                  {r.overdueDirectives}
                </span>
              </td>
              <td className="px-4 py-3">
                {r.eodStatus === "SUBMITTED" && r.reportId && (
                  <button
                    type="button"
                    disabled={loadingId === r.reportId}
                    onClick={() => lockReport(r.reportId!)}
                    className="text-sm font-bold text-[var(--primary)] hover:underline disabled:opacity-50"
                  >
                    Lock EOD
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
  const styles: Record<string, string> = {
    MISSING: "bg-red-100 text-red-800",
    LATE: "bg-orange-100 text-orange-800",
    DRAFT: "bg-slate-100 text-slate-700",
    SUBMITTED: "bg-blue-100 text-blue-800",
    LOCKED: "bg-emerald-100 text-emerald-800",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] ?? ""}`}>
      {status}
    </span>
  );
}
