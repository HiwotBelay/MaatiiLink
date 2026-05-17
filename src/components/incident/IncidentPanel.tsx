"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  INCIDENT_CATEGORIES,
  INCIDENT_SEVERITIES,
  INCIDENT_STATUSES,
  STATUS_TRANSITIONS,
} from "@/lib/incident/constants";

export type IncidentRow = {
  id: string;
  category: string;
  severity: string;
  status: string;
  title: string;
  description: string;
  branch?: { name: string; branchCode: string } | null;
  createdAt: string;
};

type Props = {
  incidents: IncidentRow[];
  canCreate: boolean;
  canUpdate: boolean;
  showBranch?: boolean;
};

export function IncidentPanel({
  incidents,
  canCreate,
  canUpdate,
  showBranch = false,
}: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    category: "SYSTEM_DOWNTIME",
    severity: "MEDIUM",
    title: "",
    description: "",
  });

  const filtered = incidents.filter((i) => {
    if (statusFilter && i.status !== statusFilter) return false;
    if (severityFilter && i.severity !== severityFilter) return false;
    return true;
  });

  async function createIncident(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create incident");
        return;
      }
      setShowForm(false);
      setForm({
        category: "SYSTEM_DOWNTIME",
        severity: "MEDIUM",
        title: "",
        description: "",
      });
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/incidents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Update failed");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">All statuses</option>
            {INCIDENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="ml-2 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">All severities</option>
            {INCIDENT_SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="rounded-lg bg-[#00529b] px-4 py-2 text-sm font-medium text-white hover:bg-[#003d73]"
          >
            + Report incident
          </button>
        )}
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {showForm && canCreate && (
        <form
          onSubmit={createIncident}
          className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="mb-4 font-semibold">New incident</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-slate-600">Category</span>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                {INCIDENT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-slate-600">Severity</span>
              <select
                value={form.severity}
                onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                {INCIDENT_SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="mt-4 block text-sm">
            <span className="text-slate-600">Title</span>
            <input
              required
              minLength={3}
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="mt-4 block text-sm">
            <span className="text-slate-600">Details</span>
            <textarea
              required
              minLength={10}
              rows={4}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-[#00529b] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Submit
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Severity</th>
              {showBranch && <th className="px-4 py-3">Branch</th>}
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Status</th>
              {canUpdate && <th className="px-4 py-3">Action</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={showBranch ? 5 : canUpdate ? 4 : 3}
                  className="px-4 py-8 text-center text-slate-500"
                >
                  No incidents match filters.
                </td>
              </tr>
            ) : (
              filtered.map((i) => (
                <tr key={i.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3">
                    <SeverityPill severity={i.severity} />
                  </td>
                  {showBranch && (
                    <td className="px-4 py-3 text-slate-600">
                      {i.branch?.branchCode ?? "—"}
                    </td>
                  )}
                  <td className="px-4 py-3 font-medium">{i.title}</td>
                  <td className="px-4 py-3">{i.status}</td>
                  {canUpdate && (
                    <td className="px-4 py-3">
                      <StatusActions
                        current={i.status}
                        onSelect={(status) => updateStatus(i.id, status)}
                        disabled={loading}
                      />
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusActions({
  current,
  onSelect,
  disabled,
}: {
  current: string;
  onSelect: (s: string) => void;
  disabled: boolean;
}) {
  const allowed = STATUS_TRANSITIONS[current] ?? [];
  if (allowed.length === 0) return <span className="text-slate-400">—</span>;

  return (
    <select
      disabled={disabled}
      defaultValue=""
      onChange={(e) => {
        if (e.target.value) onSelect(e.target.value);
        e.target.value = "";
      }}
      className="rounded border border-slate-300 text-xs"
    >
      <option value="">Update…</option>
      {allowed.map((s) => (
        <option key={s} value={s}>
          → {s}
        </option>
      ))}
    </select>
  );
}

function SeverityPill({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    CRITICAL: "bg-red-100 text-red-800",
    HIGH: "bg-orange-100 text-orange-800",
    MEDIUM: "bg-amber-100 text-amber-800",
    LOW: "bg-slate-100 text-slate-700",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[severity] ?? ""}`}
    >
      {severity}
    </span>
  );
}
