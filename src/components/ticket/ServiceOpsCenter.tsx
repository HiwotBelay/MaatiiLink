"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import {
  DEPARTMENT_LABELS,
  TICKET_DEPARTMENTS,
  TICKET_PRIORITIES,
  TICKET_STATUS_TRANSITIONS,
  STATUS_LABELS,
} from "@/lib/ticket/constants";
import { suggestCategory, suggestTags } from "@/lib/ticket/categorize";
import type { SerializedTicket } from "@/lib/ticket/serialize";
import type { TicketCategory, TicketStatus } from "@prisma/client";

type Assignee = { id: string; name: string; email: string; role: string };

type Props = {
  initialTickets: SerializedTicket[];
  canCreate: boolean;
  canAssign: boolean;
  assignees: Assignee[];
  showBranch?: boolean;
  showDashboard?: boolean;
};

type Filters = {
  q: string;
  category: string;
  priority: string;
  status: string;
  unassigned: boolean;
  overdue: boolean;
  slaBreached: boolean;
};

export function ServiceOpsCenter({
  initialTickets,
  canCreate,
  canAssign,
  assignees,
  showBranch = false,
}: Props) {
  const router = useRouter();
  const [tickets, setTickets] = useState(initialTickets);
  const [filters, setFilters] = useState<Filters>({
    q: "",
    category: "",
    priority: "",
    status: "",
    unassigned: false,
    overdue: false,
    slaBreached: false,
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SerializedTicket | null>(null);
  const [noteText, setNoteText] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"all" | "queue">("all");

  const [form, setForm] = useState({
    category: "IT" as string,
    priority: "MEDIUM",
    title: "",
    description: "",
  });

  const runSearch = useCallback(
    async (next: Filters, queueOnly = false) => {
      setSearching(true);
      setError(null);
      const params = new URLSearchParams();
      if (next.q) params.set("q", next.q);
      if (next.category) params.set("category", next.category);
      if (next.priority) params.set("priority", next.priority);
      if (next.status) params.set("status", next.status);
      if (next.unassigned || queueOnly) params.set("unassigned", "true");
      if (next.overdue) params.set("overdue", "true");
      if (next.slaBreached) params.set("slaBreached", "true");

      const url = queueOnly
        ? `/api/tickets/queue?${params}`
        : `/api/tickets?${params}`;

      try {
        const res = await fetch(url);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Search failed");
          return;
        }
        setTickets(data.tickets ?? data.queue ?? []);
      } catch {
        setError("Network error");
      } finally {
        setSearching(false);
      }
    },
    [],
  );

  function applyFilters(patch: Partial<Filters>) {
    const next = { ...filters, ...patch };
    setFilters(next);
    void runSearch(next, view === "queue");
  }

  function onTitleBlur() {
    if (!form.title && !form.description) return;
    const cat = suggestCategory(form.title, form.description);
    const tags = suggestTags(form.title, form.description);
    setForm((f) => ({ ...f, category: cat }));
    if (tags.length) {
      /* tags applied server-side on create */
    }
  }

  async function createTicket(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create ticket");
        return;
      }
      setShowForm(false);
      setForm({ category: "IT", priority: "MEDIUM", title: "", description: "" });
      router.refresh();
      void runSearch(filters);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function openTicket(id: string) {
    setExpandedId(id);
    if (canAssign) {
      const res = await fetch(`/api/tickets/${id}`);
      const data = await res.json();
      if (res.ok) setDetail(data.ticket);
    } else {
      setDetail(tickets.find((t) => t.id === id) ?? null);
    }
  }

  async function patchTicket(id: string, body: Record<string, unknown>) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Update failed");
        return;
      }
      if (expandedId === id) setDetail(data.ticket);
      router.refresh();
      void runSearch(filters, view === "queue");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function addNote(ticketId: string) {
    if (!noteText.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: noteText, isInternal: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Note failed");
        return;
      }
      setNoteText("");
      await openTicket(ticketId);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  const display = expandedId && detail?.id === expandedId ? detail : null;

  return (
    <div className="svc-ops-center">
      <div className="svc-ops-toolbar">
        <div className="svc-view-tabs">
          <button
            type="button"
            className={view === "all" ? "active" : ""}
            onClick={() => {
              setView("all");
              void runSearch(filters, false);
            }}
          >
            All tickets
          </button>
          {canAssign && (
            <button
              type="button"
              className={view === "queue" ? "active" : ""}
              onClick={() => {
                setView("queue");
                void runSearch(filters, true);
              }}
            >
              Assignment queue
            </button>
          )}
        </div>
        <div className="svc-search-row">
          <input
            type="search"
            className="svc-search-input field-control"
            placeholder="Search ref, title, tags…"
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === "Enter") void runSearch(filters, view === "queue");
            }}
          />
          <button
            type="button"
            className="btn-primary"
            disabled={searching}
            onClick={() => void runSearch(filters, view === "queue")}
          >
            {searching ? "…" : "Filter"}
          </button>
          {canCreate && (
            <button
              type="button"
              className="svc-btn-secondary"
              onClick={() => setShowForm(!showForm)}
            >
              + New request
            </button>
          )}
        </div>
      </div>

      <div className="svc-ops-layout">
        <aside className="svc-sidebar">
          <h3 className="svc-sidebar-title">Departments</h3>
          <nav className="svc-dept-nav">
            <button
              type="button"
              className={!filters.category ? "active" : ""}
              onClick={() => applyFilters({ category: "" })}
            >
              All departments
            </button>
            {TICKET_DEPARTMENTS.map((d) => (
              <button
                key={d}
                type="button"
                className={filters.category === d ? "active" : ""}
                onClick={() => applyFilters({ category: d })}
              >
                {DEPARTMENT_LABELS[d]}
              </button>
            ))}
          </nav>
          <h3 className="svc-sidebar-title">Smart filters</h3>
          <div className="svc-chip-group">
            <Chip
              label="Unassigned"
              active={filters.unassigned}
              onClick={() => applyFilters({ unassigned: !filters.unassigned })}
            />
            <Chip
              label="Overdue"
              active={filters.overdue}
              onClick={() => applyFilters({ overdue: !filters.overdue })}
            />
            <Chip
              label="SLA breach"
              active={filters.slaBreached}
              onClick={() => applyFilters({ slaBreached: !filters.slaBreached })}
            />
          </div>
          <label className="svc-filter-select">
            Priority
            <select
              value={filters.priority}
              onChange={(e) => applyFilters({ priority: e.target.value })}
              className="field-control"
            >
              <option value="">Any</option>
              {TICKET_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="svc-filter-select">
            Status
            <select
              value={filters.status}
              onChange={(e) => applyFilters({ status: e.target.value })}
              className="field-control"
            >
              <option value="">Any</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        </aside>

        <main className="svc-main">
          {error && <p className="svc-alert svc-alert-error">{error}</p>}

          {showForm && canCreate && (
            <form onSubmit={createTicket} className="svc-create-form">
              <h3 className="svc-section-title">New service request</h3>
              <p className="svc-hint">
                Smart routing suggests department from title and description.
              </p>
              <div className="svc-form-grid">
                <label>
                  Department
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, category: e.target.value }))
                    }
                    className="field-control"
                  >
                    {TICKET_DEPARTMENTS.map((c) => (
                      <option key={c} value={c}>
                        {DEPARTMENT_LABELS[c]}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Priority
                  <select
                    value={form.priority}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, priority: e.target.value }))
                    }
                    className="field-control"
                  >
                    {TICKET_PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="svc-field-full">
                Title
                <input
                  required
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  onBlur={onTitleBlur}
                  className="field-control"
                />
              </label>
              <label className="svc-field-full">
                Description
                <textarea
                  required
                  minLength={10}
                  rows={4}
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  onBlur={onTitleBlur}
                  className="field-control"
                />
              </label>
              <button type="submit" disabled={loading} className="btn-primary">
                Submit request
              </button>
            </form>
          )}

          <div className="svc-ticket-list">
            {tickets.length === 0 ? (
              <p className="svc-empty">No tickets match your filters.</p>
            ) : (
              tickets.map((t) => (
                <article
                  key={t.id}
                  className={`svc-ticket-card ${
                    t.slaBreached ? "svc-ticket-breach" : ""
                  } ${t.status === ("ESCALATED" as TicketStatus) ? "svc-ticket-escalated" : ""}`}
                >
                  <header className="svc-ticket-header">
                    <div>
                      <span className="svc-ticket-ref">{t.ticketRef}</span>
                      <h3 className="svc-ticket-title">{t.title}</h3>
                      <p className="svc-ticket-meta">
                        {t.departmentLabel} · {t.priority}
                        {showBranch && t.branch
                          ? ` · ${t.branch.branchCode}`
                          : ""}
                      </p>
                    </div>
                    <div className="svc-ticket-badges">
                      <span className={`svc-status svc-status-${t.status.toLowerCase()}`}>
                        {t.statusLabel}
                      </span>
                      {t.slaBreached && (
                        <span className="svc-badge-breach">SLA breach</span>
                      )}
                      {t.responseSlaBreached && (
                        <span className="svc-badge-breach">Response overdue</span>
                      )}
                    </div>
                  </header>
                  <p
                    className={`svc-sla-line ${
                      t.slaBreached ? "svc-sla-danger" : ""
                    }`}
                  >
                    SLA: {t.slaHoursRemaining}h remaining
                    {t.assignee ? ` · ${t.assignee.name}` : " · Unassigned"}
                    {t.escalatedTo ? ` · Escalated to ${t.escalatedTo.name}` : ""}
                  </p>

                  {expandedId === t.id && display ? (
                    <div className="svc-ticket-body">
                      <p className="svc-description">{display.description}</p>
                      {display.tags.length > 0 && (
                        <div className="svc-tags">
                          {display.tags.map((tag: string) => (
                            <span key={tag} className="svc-tag">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {canAssign && display.notes && display.notes.length > 0 && (
                        <div className="svc-notes">
                          <h4>Internal notes</h4>
                          <ul>
                            {display.notes.map((n) => (
                              <li key={n.id}>
                                <strong>{n.authorName}</strong> ·{" "}
                                {new Date(n.createdAt).toLocaleString()}
                                <p>{n.body}</p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {canAssign && (
                        <div className="svc-note-form">
                          <textarea
                            rows={2}
                            placeholder="Add internal note…"
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            className="field-control"
                          />
                          <button
                            type="button"
                            className="svc-btn-secondary"
                            disabled={loading}
                            onClick={() => void addNote(t.id)}
                          >
                            Add note
                          </button>
                        </div>
                      )}
                      {canAssign && (
                        <div className="svc-ticket-actions">
                          <select
                            disabled={loading}
                            defaultValue=""
                            onChange={(e) => {
                              if (e.target.value)
                                void patchTicket(t.id, { status: e.target.value });
                              e.target.value = "";
                            }}
                            className="field-control svc-action-select"
                          >
                            <option value="">Status…</option>
                            {(
                              TICKET_STATUS_TRANSITIONS[
                                t.status as TicketStatus
                              ] ?? []
                            ).map((s) => (
                              <option key={s} value={s}>
                                → {STATUS_LABELS[s]}
                              </option>
                            ))}
                          </select>
                          <select
                            disabled={loading}
                            defaultValue=""
                            onChange={(e) => {
                              void patchTicket(t.id, {
                                assigneeId: e.target.value || null,
                              });
                            }}
                            className="field-control svc-action-select"
                          >
                            <option value="">Assign…</option>
                            {assignees.map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.name}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            className="svc-btn-escalate"
                            disabled={
                              loading || t.status === ("ESCALATED" as TicketStatus)
                            }
                            onClick={() => void patchTicket(t.id, { escalate: true })}
                          >
                            Escalate
                          </button>
                        </div>
                      )}
                      <button
                        type="button"
                        className="svc-close-btn"
                        onClick={() => {
                          setExpandedId(null);
                          setDetail(null);
                        }}
                      >
                        Close
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="svc-expand-btn"
                      onClick={() => void openTicket(t.id)}
                    >
                      View details
                      {canAssign && t.noteCount > 0
                        ? ` · ${t.noteCount} notes`
                        : ""}
                    </button>
                  )}
                </article>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`svc-chip ${active ? "active" : ""}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
