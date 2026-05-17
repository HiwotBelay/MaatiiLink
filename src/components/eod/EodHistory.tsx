import Link from "next/link";

type Row = {
  id: string;
  reportDate: string;
  status: string;
  submittedAt: string | null;
};

export function EodHistory({ reports }: { reports: Row[] }) {
  if (reports.length === 0) {
    return <p className="text-sm text-slate-500">No reports in the last 30 days.</p>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Submitted</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {reports.map((r) => (
            <tr key={r.id} className="border-b border-slate-100 last:border-0">
              <td className="px-4 py-3 font-medium">{r.reportDate}</td>
              <td className="px-4 py-3">{r.status}</td>
              <td className="px-4 py-3 text-slate-600">
                {r.submittedAt
                  ? new Date(r.submittedAt).toLocaleString("en-ET", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })
                  : "—"}
              </td>
              <td className="px-4 py-3 text-right">
                <Link href={`/eod?date=${r.reportDate}`} className="text-[#00529b] hover:underline">
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
