"use client";

import type { PilotKpiResult } from "@/lib/pilot/types";

type FeedbackRow = {
  id: string;
  category: string;
  severity: string;
  status: string;
  description: string;
  branch?: { branchCode: string; name: string } | null;
  user?: { email: string } | null;
  createdAt: string;
};

type Props = {
  kpis: PilotKpiResult;
  feedback: FeedbackRow[];
  canTriage: boolean;
  canSubmitFeedback: boolean;
  hideKpis?: boolean;
};

export function PilotDashboard({
  kpis,
  feedback: initialFeedback,
  canTriage,
  canSubmitFeedback,
  hideKpis = false,
}: Props) {
  return (
    <div>
      {!hideKpis && (
        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="EOD on-time"
            value={`${kpis.eodOnTimePercent}%`}
            target={`≥ ${kpis.targets.eodOnTimePercent}%`}
            met={kpis.eodTargetMet}
          />
          <KpiCard
            label="Directive ack (72h)"
            value={`${kpis.directiveAckWithin72hPercent}%`}
            target={`≥ ${kpis.targets.directiveAckWithin72hPercent}%`}
            met={kpis.directiveTargetMet}
          />
          <KpiCard
            label="Incident median response"
            value={
              kpis.incidentMedianResponseHours === null
                ? "—"
                : `${kpis.incidentMedianResponseHours}h`
            }
            target={`< ${kpis.targets.incidentMedianResponseHours}h`}
            met={kpis.incidentTargetMet}
          />
          <KpiCard
            label="Sev-1 open >24h"
            value={String(kpis.openSev1Over24h)}
            target="0"
            met={kpis.sev1TargetMet}
          />
        </section>
      )}

      {!hideKpis && (
        <p className="mb-6 text-sm text-slate-600">
          Tracking {kpis.pilotBranchCount} pilot branches over the last {kpis.periodDays}{" "}
          days. Gate G5 requires all targets green before national rollout.
        </p>
      )}

      {canSubmitFeedback && <FeedbackForm />}

      {!hideKpis && (
        <section className="mt-8">
          <h2 className="mb-4 text-lg font-semibold">Pilot feedback log</h2>
          <FeedbackList feedback={initialFeedback} canTriage={canTriage} />
        </section>
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  target,
  met,
}: {
  label: string;
  value: string;
  target: string;
  met: boolean;
}) {
  return (
    <article
      className={`rounded-3xl border p-4 shadow-sm ${
        met ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"
      }`}
    >
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-600">Target: {target}</p>
    </article>
  );
}

function FeedbackForm() {
  return (
    <form
      className="polished-card rounded-[1.5rem] p-5"
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const res = await fetch("/api/pilot/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            category: fd.get("category"),
            severity: fd.get("severity"),
            description: fd.get("description"),
          }),
        });
        if (res.ok) {
          window.location.reload();
        }
      }}
    >
      <h3 className="mb-3 font-semibold">Submit pilot feedback</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <select name="category" className="field-control" required>
          <option value="BUG">Bug</option>
          <option value="UX">UX</option>
          <option value="TRAINING">Training</option>
          <option value="FEATURE">Feature request</option>
          <option value="OTHER">Other</option>
        </select>
        <select name="severity" className="field-control" required>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="SEV1">Sev-1 (critical)</option>
        </select>
      </div>
      <textarea
        name="description"
        required
        minLength={10}
        rows={3}
        placeholder="Describe the issue or suggestion…"
        className="field-control mt-3"
      />
      <button
        type="submit"
        className="btn-primary mt-3 px-4 py-2 text-sm"
      >
        Submit feedback
      </button>
    </form>
  );
}

function FeedbackList({
  feedback,
  canTriage,
}: {
  feedback: FeedbackRow[];
  canTriage: boolean;
}) {
  if (feedback.length === 0) {
    return <p className="text-sm text-slate-500">No feedback submitted yet.</p>;
  }

  return (
    <ul className="space-y-3">
      {feedback.map((f) => (
        <li key={f.id} className="polished-card hover-lift rounded-[1.25rem] p-4 text-sm">
          <div className="flex flex-wrap justify-between gap-2">
            <span className="font-medium">
              {f.category} · {f.severity}
              {f.branch ? ` · ${f.branch.branchCode}` : ""}
            </span>
            <span className="text-slate-500">{f.status}</span>
          </div>
          <p className="mt-2 text-slate-700">{f.description}</p>
          {canTriage && f.status === "OPEN" && (
            <div className="mt-2 flex gap-2">
              {(["TRIAGED", "FIXED", "WONTFIX"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  className="text-xs font-medium text-[#00529b] hover:underline"
                  onClick={async () => {
                    await fetch(`/api/pilot/feedback/${f.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      credentials: "same-origin",
                      body: JSON.stringify({ status: s }),
                    });
                    window.location.reload();
                  }}
                >
                  Mark {s}
                </button>
              ))}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
