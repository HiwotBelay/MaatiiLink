"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  INCIDENT_CATEGORIES,
  INCIDENT_SEVERITIES,
  INCIDENT_STATUSES,
  STATUS_TRANSITIONS,
  STATUS_LABELS,
} from "@/lib/incident/constants";
import type { IncidentStatus } from "@prisma/client";

export type IncidentRow = {
  id: string;
  incidentRef: string;
  category: string;
  severity: string;
  status: string;
  title: string;
  description: string;
  branch?: { name: string; branchCode: string; region?: string | null } | null;
  slaBreached?: boolean;
  slaResolutionDueAt?: string | null;
  complianceEscalated?: boolean;
  createdAt: string;
  attachments?: { id: string; fileName: string; kind: string }[];
};

type Props = {
  incidents: IncidentRow[];
  canCreate: boolean;
  canUpdate: boolean;
  canAttachEvidence: boolean;
  canAssign: boolean;
  showBranch?: boolean;
};

export function IncidentCommandCenter({
  incidents,
  canCreate,
  canUpdate,
  canAttachEvidence,
  canAssign,
  showBranch = false,
}: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
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
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

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
      const incidentId = data.incident?.id as string | undefined;
      if (incidentId && pendingFiles.length > 0) {
        for (const file of pendingFiles) {
          await uploadAttachment(incidentId, file, false);
        }
      }
      setShowForm(false);
      setPendingFiles([]);
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

  async function uploadAttachment(
    incidentId: string,
    file: File,
    manageLoading = true,
  ) {
    if (manageLoading) setLoading(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch(`/api/incidents/${incidentId}/attachments`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload failed");
        return;
      }
      if (manageLoading) router.refresh();
    } catch {
      setError("Network error");
    } finally {
      if (manageLoading) setLoading(false);
    }
  }

  return (
    <div className="incident-command">
      <div className="incident-command-toolbar">
        <div className="filter-toolbar">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="field-control"
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            {INCIDENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s as IncidentStatus]}
              </option>
            ))}
          </select>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="field-control"
            aria-label="Filter by severity"
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
            className="btn-primary px-4 py-2 text-sm"
          >
            + Report incident
          </button>
        )}
      </div>

      {error && <div className="incident-alert incident-alert-error">{error}</div>}

      {showForm && canCreate && (
        <form onSubmit={createIncident} className="incident-panel incident-form">
          <h2 className="incident-section-title">New operational incident</h2>
          <div className="incident-form-grid">
            <label className="block text-sm">
              <span className="incident-field-label">Category</span>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="eod-field-control"
              >
                {INCIDENT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="incident-field-label">Severity</span>
              <select
                value={form.severity}
                onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))}
                className="eod-field-control"
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
            <span className="incident-field-label">Title</span>
            <input
              required
              minLength={3}
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="eod-field-control"
            />
          </label>
          <label className="mt-4 block text-sm">
            <span className="incident-field-label">Details</span>
            <textarea
              required
              minLength={10}
              rows={4}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="eod-field-control min-h-[100px]"
            />
          </label>
          {canAttachEvidence && (
            <label className="mt-4 block text-sm">
              <span className="incident-field-label">Evidence (optional)</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,application/pdf"
                multiple
                className="eod-field-control text-xs"
                onChange={(e) => {
                  const files = e.target.files;
                  if (files?.length) {
                    setPendingFiles(Array.from(files));
                  }
                  e.target.value = "";
                }}
              />
              {pendingFiles.length > 0 && (
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  {pendingFiles.length} file(s) will upload after submit
                </p>
              )}
            </label>
          )}
          <div className="mt-4 flex gap-2">
            <button type="submit" disabled={loading} className="btn-primary px-4 py-2 text-sm">
              Submit incident
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn-secondary px-4 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="incident-list">
        {filtered.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">No incidents match filters.</p>
        ) : (
          filtered.map((i) => (
            <article
              key={i.id}
              className={`incident-card ${i.slaBreached ? "incident-card-breach" : ""} ${i.severity === "CRITICAL" ? "incident-card-critical" : ""}`}
            >
              <header className="incident-card-header">
                <div>
                  <p className="incident-ref">{i.incidentRef}</p>
                  <h3 className="incident-card-title">{i.title}</h3>
                  {showBranch && (
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {i.branch?.branchCode} · {i.branch?.region ?? "—"}
                    </p>
                  )}
                </div>
                <div className="incident-card-badges">
                  <SeverityPill severity={i.severity} />
                  <StatusPill status={i.status} />
                  {i.complianceEscalated && (
                    <span className="incident-badge-compliance">Compliance</span>
                  )}
                  {i.slaBreached && (
                    <span className="incident-badge-sla">SLA breach</span>
                  )}
                </div>
              </header>

              <button
                type="button"
                className="incident-expand-btn"
                onClick={() => setExpandedId(expandedId === i.id ? null : i.id)}
              >
                {expandedId === i.id ? "Hide details" : "View details & evidence"}
              </button>

              {expandedId === i.id && (
                <div className="incident-card-body">
                  <p className="text-sm text-[var(--muted-foreground)] whitespace-pre-wrap">
                    {i.description}
                  </p>
                  {i.slaResolutionDueAt && (
                    <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                      Resolution due: {new Date(i.slaResolutionDueAt).toLocaleString()}
                    </p>
                  )}
                  {i.attachments && i.attachments.length > 0 && (
                    <ul className="incident-attachments-list">
                      {i.attachments.map((a) => (
                        <li key={a.id}>
                          <a
                            href={`/api/incidents/${i.id}/attachments/${a.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="incident-attachment-link"
                          >
                            {a.fileName} ({a.kind})
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                  {(canUpdate || canAttachEvidence) && (
                    <div className="incident-card-actions">
                      {canUpdate && (
                        <StatusActions
                          current={i.status}
                          onSelect={(status) => updateStatus(i.id, status)}
                          disabled={loading}
                        />
                      )}
                      {canAttachEvidence && (
                        <label className="incident-upload-label">
                          <span className="btn-secondary px-3 py-1.5 text-xs cursor-pointer">
                            Attach evidence
                          </span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp,application/pdf"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) void uploadAttachment(i.id, f);
                              e.target.value = "";
                            }}
                          />
                        </label>
                      )}
                    </div>
                  )}
                </div>
              )}
            </article>
          ))
        )}
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
  const allowed = STATUS_TRANSITIONS[current as IncidentStatus] ?? [];
  if (allowed.length === 0) return null;

  return (
    <select
      disabled={disabled}
      defaultValue=""
      onChange={(e) => {
        if (e.target.value) onSelect(e.target.value);
        e.target.value = "";
      }}
      className="eod-field-control text-xs max-w-[200px]"
    >
      <option value="">Update workflow…</option>
      {allowed.map((s) => (
        <option key={s} value={s}>
          → {STATUS_LABELS[s as IncidentStatus]}
        </option>
      ))}
    </select>
  );
}

function SeverityPill({ severity }: { severity: string }) {
  return (
    <span className={`incident-severity incident-severity-${severity.toLowerCase()}`}>
      {severity}
    </span>
  );
}

function StatusPill({ status }: { status: string }) {
  const label = STATUS_LABELS[status as IncidentStatus] ?? status;
  return (
    <span className={`incident-status incident-status-${status.toLowerCase()}`}>
      {label}
    </span>
  );
}
