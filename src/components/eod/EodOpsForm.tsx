"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Banknote,
  Users,
  Server,
  Shield,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { CASH_BANDS, LIQUIDITY_OPTIONS } from "@/lib/eod/constants";
import { EOD_STATUS_LABELS } from "@/lib/eod/status";

export type EodOpsFormData = {
  id?: string;
  reportDate: string;
  status: string;
  dueAt?: string | null;
  complianceScore?: number | null;
  openingCashBand: string;
  closingCashBand: string;
  cashInflowBand: string;
  cashOutflowBand: string;
  liquidityStatus: string;
  complaintCount: number;
  staffingIssues: string;
  atmDowntimeMinutes: number;
  systemDowntimeMinutes: number;
  operationalBlockers: string;
  securityConcerns: string;
  highValueTransactionNotes: string;
  performanceNotes: string;
  anomalyNotes: string;
};

type Props = {
  initial: EodOpsFormData;
  readOnly?: boolean;
  canSubmit?: boolean;
  /** Branch manager accountable submit copy and certification note */
  managerMode?: boolean;
};

const SECTIONS = [
  { id: "cash", label: "Cash & liquidity", icon: Banknote },
  { id: "ops", label: "Operations", icon: Server },
  { id: "risk", label: "Risk & security", icon: Shield },
  { id: "perf", label: "Performance", icon: TrendingUp },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

export function EodOpsForm({
  initial,
  readOnly = false,
  canSubmit = false,
  managerMode = false,
}: Props) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [section, setSection] = useState<SectionId>("cash");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const locked = form.status !== "PENDING" || readOnly;

  function payload() {
    return {
      reportDate: form.reportDate,
      openingCashBand: form.openingCashBand || null,
      closingCashBand: form.closingCashBand || null,
      cashInflowBand: form.cashInflowBand || null,
      cashOutflowBand: form.cashOutflowBand || null,
      liquidityStatus: form.liquidityStatus || null,
      complaintCount: form.complaintCount,
      staffingIssues: form.staffingIssues || null,
      atmDowntimeMinutes: form.atmDowntimeMinutes,
      systemDowntimeMinutes: form.systemDowntimeMinutes,
      operationalBlockers: form.operationalBlockers || null,
      securityConcerns: form.securityConcerns || null,
      highValueTransactionNotes: form.highValueTransactionNotes || null,
      performanceNotes: form.performanceNotes || null,
      anomalyNotes: form.anomalyNotes || null,
    };
  }

  async function saveDraftAndGetId(): Promise<string | null> {
    const res = await fetch("/api/eod", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload()),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Save failed");
      return null;
    }
    setForm((f) => ({
      ...f,
      id: data.report.id,
      status: data.report.status,
      complianceScore: data.report.complianceScore,
    }));
    return data.report.id as string;
  }

  async function saveDraft() {
    setLoading(true);
    setError(null);
    setMessage(null);
    const id = await saveDraftAndGetId();
    if (id) setMessage("Draft saved — operations data secured.");
    setLoading(false);
    router.refresh();
  }

  async function submitReport() {
    setLoading(true);
    setError(null);
    const reportId = (await saveDraftAndGetId()) ?? form.id;
    if (!reportId) {
      setLoading(false);
      return;
    }
    const res = await fetch(`/api/eod/${reportId}/submit`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Submit failed");
    } else {
      setForm((f) => ({ ...f, status: data.report.status }));
      setMessage(
        data.report.status === "LATE"
          ? "Submitted late — flagged for supervisor review."
          : "Operations report submitted on time.",
      );
      router.refresh();
    }
    setLoading(false);
  }

  const statusLabel =
    EOD_STATUS_LABELS[form.status as keyof typeof EOD_STATUS_LABELS] ?? form.status;

  return (
    <div className="eod-cockpit-form">
      {managerMode && !readOnly && (
        <p className="eod-manager-cert mb-4 rounded-xl border border-[var(--border)] bg-[var(--primary-soft)] px-4 py-3 text-sm text-[var(--foreground)]">
          <strong>Branch manager certification:</strong> you are submitting this branch&apos;s
          official end-of-day report. Verify cash bands, complaints, downtime, and risk notes
          before submit — branch staff cannot submit on your behalf.
        </p>
      )}
      {readOnly && (
        <p className="eod-view-only-note mb-4 text-sm text-[var(--muted-foreground)]">
          View-only — your branch manager prepares and submits the daily EOD report.
        </p>
      )}
      <div className="eod-cockpit-form-tabs">
        {SECTIONS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setSection(id)}
            className={`eod-cockpit-tab ${section === id ? "eod-cockpit-tab-active" : ""}`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {error && <div className="eod-cockpit-alert eod-cockpit-alert-error">{error}</div>}
      {message && <div className="eod-cockpit-alert eod-cockpit-alert-success">{message}</div>}

      {section === "cash" && (
        <div className="eod-cockpit-section-grid">
          <Field label="Cash inflow band">
            <BandSelect
              disabled={locked}
              value={form.cashInflowBand || form.openingCashBand}
              onChange={(v) => setForm({ ...form, cashInflowBand: v, openingCashBand: v })}
            />
          </Field>
          <Field label="Cash outflow band">
            <BandSelect
              disabled={locked}
              value={form.cashOutflowBand || form.closingCashBand}
              onChange={(v) => setForm({ ...form, cashOutflowBand: v, closingCashBand: v })}
            />
          </Field>
          <Field label="Liquidity status" className="sm:col-span-2">
            <select
              disabled={locked}
              value={form.liquidityStatus}
              onChange={(e) => setForm({ ...form, liquidityStatus: e.target.value })}
              className="eod-field-control"
            >
              <option value="">Select status…</option>
              {LIQUIDITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="High-value transaction notes" className="sm:col-span-2">
            <TextArea
              disabled={locked}
              value={form.highValueTransactionNotes}
              onChange={(v) => setForm({ ...form, highValueTransactionNotes: v })}
              placeholder="Wire transfers, large withdrawals…"
            />
          </Field>
        </div>
      )}

      {section === "ops" && (
        <div className="eod-cockpit-section-grid">
          <Field label="Customer complaints (count)">
            <input
              type="number"
              min={0}
              disabled={locked}
              value={form.complaintCount}
              onChange={(e) =>
                setForm({ ...form, complaintCount: Number(e.target.value) || 0 })
              }
              className="eod-field-control"
            />
          </Field>
          <Field label="ATM downtime (minutes)">
            <input
              type="number"
              min={0}
              disabled={locked}
              value={form.atmDowntimeMinutes}
              onChange={(e) =>
                setForm({ ...form, atmDowntimeMinutes: Number(e.target.value) || 0 })
              }
              className="eod-field-control"
            />
          </Field>
          <Field label="System downtime (minutes)">
            <input
              type="number"
              min={0}
              disabled={locked}
              value={form.systemDowntimeMinutes}
              onChange={(e) =>
                setForm({ ...form, systemDowntimeMinutes: Number(e.target.value) || 0 })
              }
              className="eod-field-control"
            />
          </Field>
          <Field label="Operational blockers" className="sm:col-span-2">
            <TextArea
              disabled={locked}
              value={form.operationalBlockers}
              onChange={(v) => setForm({ ...form, operationalBlockers: v })}
              placeholder="Processes, systems, or logistics blocking service…"
            />
          </Field>
          <Field label="Staffing issues" className="sm:col-span-2">
            <TextArea
              disabled={locked}
              value={form.staffingIssues}
              onChange={(v) => setForm({ ...form, staffingIssues: v })}
              placeholder="Absences, coverage gaps, training gaps…"
              icon={Users}
            />
          </Field>
        </div>
      )}

      {section === "risk" && (
        <div className="eod-cockpit-section-grid">
          <Field label="Security concerns" className="sm:col-span-2">
            <TextArea
              disabled={locked}
              value={form.securityConcerns}
              onChange={(v) => setForm({ ...form, securityConcerns: v })}
              placeholder="Physical security, fraud attempts, access issues…"
            />
          </Field>
          <Field label="Anomalies / exceptions" className="sm:col-span-2">
            <TextArea
              disabled={locked}
              value={form.anomalyNotes}
              onChange={(v) => setForm({ ...form, anomalyNotes: v })}
              placeholder="Unusual patterns requiring HO attention…"
              icon={AlertTriangle}
            />
          </Field>
        </div>
      )}

      {section === "perf" && (
        <Field label="Daily branch performance notes">
          <TextArea
            disabled={locked}
            rows={6}
            value={form.performanceNotes}
            onChange={(v) => setForm({ ...form, performanceNotes: v })}
            placeholder="KPIs, service levels, notable wins or misses…"
          />
        </Field>
      )}

      {!locked && (
        <div className="eod-cockpit-actions">
          <button
            type="button"
            disabled={loading}
            onClick={saveDraft}
            className="btn-secondary px-5 py-2.5 text-sm"
          >
            Save draft
          </button>
          {canSubmit && (
            <button
              type="button"
              disabled={loading}
              onClick={submitReport}
              className="btn-primary px-5 py-2.5 text-sm"
            >
              {managerMode ? "Submit end-of-day report" : "Submit operations report"}
            </button>
          )}
        </div>
      )}

      {form.status !== "PENDING" && (
        <p className="text-sm text-[var(--muted-foreground)]">
          Status: <strong>{statusLabel}</strong>
          {form.status === "REVIEWED" && " — locked by supervisor."}
        </p>
      )}
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="eod-field-label">{label}</span>
      {children}
    </label>
  );
}

function BandSelect({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <select
      disabled={disabled}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="eod-field-control"
    >
      <option value="">Select band…</option>
      {CASH_BANDS.map((b) => (
        <option key={b.value} value={b.value}>
          {b.label}
        </option>
      ))}
    </select>
  );
}

function TextArea({
  value,
  onChange,
  disabled,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
  rows?: number;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <textarea
      disabled={disabled}
      rows={rows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="eod-field-control min-h-[88px] resize-y"
      placeholder={placeholder}
    />
  );
}
