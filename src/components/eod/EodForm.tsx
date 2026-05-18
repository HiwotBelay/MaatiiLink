"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CASH_BANDS } from "@/lib/eod/constants";

export type EodFormData = {
  id?: string;
  reportDate: string;
  status: string;
  openingCashBand: string;
  closingCashBand: string;
  anomalyNotes: string;
  complaintCount: number;
  staffingNotes: string;
};

type Props = {
  initial: EodFormData;
  readOnly?: boolean;
  canSubmit?: boolean;
  pastCutoff?: boolean;
};

export function EodForm({ initial, readOnly = false, canSubmit = false, pastCutoff }: Props) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const locked = form.status !== "DRAFT" || readOnly;

  async function saveDraftAndGetId(): Promise<string | null> {
    try {
      const res = await fetch("/api/eod", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportDate: form.reportDate,
          openingCashBand: form.openingCashBand,
          closingCashBand: form.closingCashBand,
          anomalyNotes: form.anomalyNotes || null,
          complaintCount: form.complaintCount,
          staffingNotes: form.staffingNotes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Save failed");
        return null;
      }
      setForm((f) => ({ ...f, id: data.report.id, status: data.report.status }));
      return data.report.id as string;
    } catch {
      setError("Network error");
      return null;
    }
  }

  async function saveDraft() {
    setLoading(true);
    setError(null);
    setMessage(null);
    const id = await saveDraftAndGetId();
    if (id) setMessage("Draft saved.");
    setLoading(false);
    router.refresh();
  }

  async function submitReport() {
    setLoading(true);
    setError(null);

    let reportId: string | undefined = form.id;
    if (!reportId) {
      reportId = (await saveDraftAndGetId()) ?? undefined;
      if (!reportId) {
        setLoading(false);
        return;
      }
    }

    try {
      const res = await fetch(`/api/eod/${reportId}/submit`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Submit failed");
        return;
      }
      setForm((f) => ({ ...f, status: data.report.status }));
      setMessage("EOD submitted to Head Office.");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="polished-card space-y-6 rounded-[1.75rem] p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">End of day report</h2>
          <p className="text-sm text-slate-500">{form.reportDate}</p>
        </div>
        <StatusBadge status={form.status} />
      </div>

      {pastCutoff && form.status === "DRAFT" && (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          Past 18:00 Addis Ababa cutoff — please submit as soon as possible.
        </p>
      )}

      {error && (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{error}</p>
      )}
      {message && (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{message}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Opening cash band">
          <select
            disabled={locked}
            value={form.openingCashBand}
            onChange={(e) => setForm({ ...form, openingCashBand: e.target.value })}
            className={inputClass}
          >
            <option value="">Select…</option>
            {CASH_BANDS.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Closing cash band">
          <select
            disabled={locked}
            value={form.closingCashBand}
            onChange={(e) => setForm({ ...form, closingCashBand: e.target.value })}
            className={inputClass}
          >
            <option value="">Select…</option>
            {CASH_BANDS.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Customer complaints (count)">
        <input
          type="number"
          min={0}
          disabled={locked}
          value={form.complaintCount}
          onChange={(e) =>
            setForm({ ...form, complaintCount: Number(e.target.value) || 0 })
          }
          className={inputClass}
        />
      </Field>

      <Field label="Transaction anomalies / notes">
        <textarea
          disabled={locked}
          rows={3}
          value={form.anomalyNotes}
          onChange={(e) => setForm({ ...form, anomalyNotes: e.target.value })}
          className={inputClass}
          placeholder="Unusual transactions, system issues…"
        />
      </Field>

      <Field label="Staffing notes">
        <textarea
          disabled={locked}
          rows={2}
          value={form.staffingNotes}
          onChange={(e) => setForm({ ...form, staffingNotes: e.target.value })}
          className={inputClass}
          placeholder="Absences, short staff…"
        />
      </Field>

      {!locked && (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={saveDraft}
            className="btn-secondary px-4 py-2 text-sm disabled:opacity-50"
          >
            Save draft
          </button>
          {canSubmit && (
            <button
              type="button"
              disabled={loading || !form.openingCashBand || !form.closingCashBand}
              onClick={submitReport}
              className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
            >
              Submit EOD
            </button>
          )}
        </div>
      )}

      {form.status === "SUBMITTED" && (
        <p className="text-sm text-slate-500">
          Submitted — awaiting supervisor review / lock.
        </p>
      )}
      {form.status === "LOCKED" && (
        <p className="text-sm text-slate-500">Locked by supervisor. No further changes.</p>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "field-control disabled:bg-slate-100";

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    DRAFT: "bg-slate-100 text-slate-700",
    SUBMITTED: "bg-blue-100 text-blue-800",
    LOCKED: "bg-emerald-100 text-emerald-800",
  };
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${colors[status] ?? "bg-slate-100"}`}
    >
      {status}
    </span>
  );
}
