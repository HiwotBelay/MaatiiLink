"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Row = {
  branchId: string;
  name: string;
  branchCode: string;
  district: string | null;
  eodStatus: string;
  reportId: string | null;
};

export function SupervisorEodTable({ rows }: { rows: Row[] }) {
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
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Branch</th>
            <th className="px-4 py-3">Code</th>
            <th className="px-4 py-3">EOD today</th>
            <th className="px-4 py-3">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.branchId} className="border-b border-slate-100 last:border-0">
              <td className="px-4 py-3 font-medium">{r.name}</td>
              <td className="px-4 py-3 text-slate-600">{r.branchCode}</td>
              <td className="px-4 py-3">
                <EodStatusPill status={r.eodStatus} />
              </td>
              <td className="px-4 py-3">
                {r.eodStatus === "SUBMITTED" && r.reportId && (
                  <button
                    type="button"
                    disabled={loadingId === r.reportId}
                    onClick={() => lockReport(r.reportId!)}
                    className="text-sm font-medium text-[#00529b] hover:underline disabled:opacity-50"
                  >
                    Lock
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
