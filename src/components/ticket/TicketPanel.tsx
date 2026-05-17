"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUS_TRANSITIONS,
} from "@/lib/ticket/constants";

export type TicketRow = {
  id: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  branch?: { branchCode: string; name: string } | null;
  assignee?: { name: string } | null;
  slaHoursRemaining: number;
  slaBreached: boolean;
};

type Assignee = { id: string; name: string; email: string };

type Props = {
  tickets: TicketRow[];
  canCreate: boolean;
  canAssign: boolean;
  assignees: Assignee[];
  showBranch?: boolean;
};

export function TicketPanel({
  tickets,
  canCreate,
  canAssign,
  assignees,
  showBranch = false,
}: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    category: "IT",
    priority: "MEDIUM",
    title: "",
    description: "",
  });

  async function createTicket(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create ticket");
        return;
      }
      setShowForm(false);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function patchTicket(id: string, body: Record<string, unknown>) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(body),
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
      <div className="mb-6 flex justify-end">
        {canCreate && (
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="rounded-lg bg-[#00529b] px-4 py-2 text-sm font-medium text-white"
          >
            + New request
          </button>
        )}
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {showForm && canCreate && (
        <form
          onSubmit={createTicket}
          className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="mb-4 font-semibold">New service request</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              Category
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                {TICKET_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Priority
              <select
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                {TICKET_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="mt-4 block text-sm">
            Title
            <input
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="mt-4 block text-sm">
            Description
            <textarea
              required
              minLength={10}
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="mt-4 rounded-lg bg-[#00529b] px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            Submit
          </button>
        </form>
      )}

      <div className="space-y-3">
        {tickets.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            No tickets yet.
          </p>
        ) : (
          tickets.map((t) => (
            <article
              key={t.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-slate-500">
                    {t.category.replace(/_/g, " ")} · {t.priority}
                    {showBranch && t.branch ? ` · ${t.branch.branchCode}` : ""}
                  </p>
                  <h3 className="font-semibold">{t.title}</h3>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium">
                  {t.status}
                </span>
              </div>
              <p
                className={`mt-2 text-xs ${t.slaBreached ? "font-medium text-red-600" : "text-slate-500"}`}
              >
                SLA: {t.slaHoursRemaining}h remaining
                {t.assignee ? ` · Assigned: ${t.assignee.name}` : ""}
              </p>
              {canAssign && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <select
                    disabled={loading}
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) patchTicket(t.id, { status: e.target.value });
                      e.target.value = "";
                    }}
                    className="rounded border border-slate-300 text-xs"
                  >
                    <option value="">Status…</option>
                    {(TICKET_STATUS_TRANSITIONS[t.status] ?? []).map((s) => (
                      <option key={s} value={s}>
                        → {s}
                      </option>
                    ))}
                  </select>
                  <select
                    disabled={loading}
                    defaultValue={t.assignee ? "" : ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      patchTicket(t.id, {
                        assigneeId: v === "" ? null : v,
                      });
                    }}
                    className="rounded border border-slate-300 text-xs"
                  >
                    <option value="">Assignee…</option>
                    {assignees.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </article>
          ))
        )}
      </div>
    </div>
  );
}