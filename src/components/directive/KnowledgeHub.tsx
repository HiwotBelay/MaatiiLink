"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import {
  CATEGORY_LABELS,
  DIRECTIVE_CATEGORIES,
  QUICK_LOOKUPS,
} from "@/lib/directive/constants";
import type { SerializedDirective } from "@/lib/directive/serialize";
import type { DirectiveCategory } from "@prisma/client";

type Props = {
  initialDirectives: SerializedDirective[];
  pinned: SerializedDirective[];
  latest: SerializedDirective[];
  canAck: boolean;
  canPublish: boolean;
};

type Filters = {
  q: string;
  category: string;
  critical: boolean;
  recent: boolean;
  mandatory: boolean;
  sop: boolean;
  unread: boolean;
  pinned: boolean;
};

export function KnowledgeHub({
  initialDirectives,
  pinned: initialPinned,
  latest,
  canAck,
  canPublish,
}: Props) {
  const router = useRouter();
  const [directives, setDirectives] = useState(initialDirectives);
  const [filters, setFilters] = useState<Filters>({
    q: "",
    category: "",
    critical: false,
    recent: false,
    mandatory: false,
    sop: false,
    unread: false,
    pinned: false,
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmRead, setConfirmRead] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const pinned = useMemo(() => {
    const fromList = directives.filter((d) => d.isPinned);
    if (fromList.length > 0) return fromList;
    return initialPinned;
  }, [directives, initialPinned]);

  const runSearch = useCallback(async (next: Filters) => {
    setSearching(true);
    setError(null);
    const params = new URLSearchParams();
    if (next.q) params.set("q", next.q);
    if (next.category) params.set("category", next.category);
    if (next.critical) params.set("critical", "true");
    if (next.recent) params.set("recent", "true");
    if (next.mandatory) params.set("mandatory", "true");
    if (next.sop) params.set("sop", "true");
    if (next.unread) params.set("unread", "true");
    if (next.pinned) params.set("pinned", "true");
    try {
      const res = await fetch(`/api/directives?${params}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Search failed");
        return;
      }
      setDirectives(data.directives ?? []);
    } catch {
      setError("Network error");
    } finally {
      setSearching(false);
    }
  }, []);

  function applyFilters(patch: Partial<Filters>) {
    const next = { ...filters, ...patch };
    setFilters(next);
    void runSearch(next);
  }

  function quickLookup(
    query: string,
    category?: DirectiveCategory,
  ) {
    const next = {
      ...filters,
      q: query,
      category: category ?? "",
    };
    setFilters(next);
    void runSearch(next);
  }

  async function openDirective(id: string) {
    setExpandedId(id);
    await fetch(`/api/directives/${id}/read`, { method: "POST" });
    setDirectives((list) =>
      list.map((d) =>
        d.id === id ? { ...d, readByUser: true, readAt: new Date().toISOString() } : d,
      ),
    );
  }

  async function acknowledge(directiveId: string) {
    if (!confirmRead) {
      setError("Please confirm your branch has read and will comply.");
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/directives/${directiveId}/acknowledge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmRead: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Acknowledgment failed");
        return;
      }
      setMessage("Policy acknowledged for your branch.");
      setExpandedId(null);
      setConfirmRead(false);
      router.refresh();
      void runSearch(filters);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="knowledge-hub">
      <div className="knowledge-hub-layout">
        <aside className="knowledge-sidebar">
          <h2 className="knowledge-sidebar-title">Categories</h2>
          <nav className="knowledge-category-nav">
            <button
              type="button"
              className={!filters.category ? "active" : ""}
              onClick={() => applyFilters({ category: "" })}
            >
              All procedures
            </button>
            {DIRECTIVE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={filters.category === cat ? "active" : ""}
                onClick={() => applyFilters({ category: cat })}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </nav>

          <h3 className="knowledge-sidebar-subtitle">Smart filters</h3>
          <div className="knowledge-chip-group">
            <FilterChip
              label="Critical"
              active={filters.critical}
              onClick={() => applyFilters({ critical: !filters.critical })}
            />
            <FilterChip
              label="Recent"
              active={filters.recent}
              onClick={() => applyFilters({ recent: !filters.recent })}
            />
            <FilterChip
              label="Mandatory"
              active={filters.mandatory}
              onClick={() => applyFilters({ mandatory: !filters.mandatory })}
            />
            <FilterChip
              label="SOPs"
              active={filters.sop}
              onClick={() => applyFilters({ sop: !filters.sop })}
            />
            <FilterChip
              label="Unread"
              active={filters.unread}
              onClick={() => applyFilters({ unread: !filters.unread })}
            />
            <FilterChip
              label="Pinned"
              active={filters.pinned}
              onClick={() => applyFilters({ pinned: !filters.pinned })}
            />
          </div>
        </aside>

        <main className="knowledge-main">
          <div className="knowledge-search-bar">
            <input
              type="search"
              placeholder="Search procedures, policies, keywords…"
              value={filters.q}
              onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === "Enter") void runSearch(filters);
              }}
              className="knowledge-search-input"
            />
            <button
              type="button"
              className="btn-primary knowledge-search-btn"
              disabled={searching}
              onClick={() => void runSearch(filters)}
            >
              {searching ? "Searching…" : "Search"}
            </button>
            {canPublish && (
              <Link href="/directives/new" className="knowledge-publish-link">
                + Publish
              </Link>
            )}
          </div>

          <section className="knowledge-quick-lookup">
            <h2 className="knowledge-section-title">Quick operational lookup</h2>
            <div className="knowledge-quick-grid">
              {QUICK_LOOKUPS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="knowledge-quick-card"
                  onClick={() => quickLookup(item.query, item.category)}
                >
                  <span className="knowledge-quick-title">{item.title}</span>
                  <span className="knowledge-quick-desc">{item.description}</span>
                </button>
              ))}
            </div>
          </section>

          {pinned.length > 0 && !filters.pinned && (
            <section className="knowledge-pinned">
              <h2 className="knowledge-section-title">Pinned critical directives</h2>
              <div className="knowledge-card-grid">
                {pinned.slice(0, 4).map((d) => (
                  <DirectiveCard
                    key={d.id}
                    directive={d}
                    compact
                    onOpen={() => void openDirective(d.id)}
                  />
                ))}
              </div>
            </section>
          )}

          <section className="knowledge-updates">
            <h2 className="knowledge-section-title">Latest updates</h2>
            <ul className="knowledge-feed">
              {latest.slice(0, 6).map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    className="knowledge-feed-item"
                    onClick={() => void openDirective(d.id)}
                  >
                    <span className="knowledge-feed-title">{d.title}</span>
                    <span className="knowledge-feed-meta">
                      {CATEGORY_LABELS[d.category as DirectiveCategory]} ·{" "}
                      {new Date(d.publishedAt).toLocaleDateString()}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {error && <p className="knowledge-alert knowledge-alert-error">{error}</p>}
          {message && (
            <p className="knowledge-alert knowledge-alert-success">{message}</p>
          )}

          <section className="knowledge-results">
            <h2 className="knowledge-section-title">
              {searching ? "Searching…" : `Procedures & policies (${directives.length})`}
            </h2>
            <div className="knowledge-results-list">
              {directives.length === 0 ? (
                <p className="knowledge-empty">No matching procedures. Try another search or filter.</p>
              ) : (
                directives.map((d) => (
                  <article
                    key={d.id}
                    className={`knowledge-doc-card ${
                      d.priority === "CRITICAL" || d.isCritical
                        ? "knowledge-doc-critical"
                        : ""
                    } ${d.isPinned ? "knowledge-doc-pinned" : ""}`}
                  >
                    <header className="knowledge-doc-header">
                      <div>
                        <div className="knowledge-doc-badges">
                          {d.isPinned && (
                            <span className="knowledge-badge knowledge-badge-pin">Pinned</span>
                          )}
                          {d.isSop && (
                            <span className="knowledge-badge knowledge-badge-sop">SOP</span>
                          )}
                          {d.isMandatory && (
                            <span className="knowledge-badge knowledge-badge-mandatory">
                              Mandatory
                            </span>
                          )}
                          <span
                            className={`knowledge-badge knowledge-priority-${d.priority.toLowerCase()}`}
                          >
                            {d.priority}
                          </span>
                          <span className="knowledge-badge knowledge-badge-cat">
                            {CATEGORY_LABELS[d.category as DirectiveCategory]}
                          </span>
                        </div>
                        <h3 className="knowledge-doc-title">{d.title}</h3>
                        {d.summary && (
                          <p className="knowledge-doc-summary">{d.summary}</p>
                        )}
                        <p className="knowledge-doc-meta">
                          Published {new Date(d.publishedAt).toLocaleDateString()}
                          {d.deadlineAt &&
                            ` · Ack deadline ${new Date(d.deadlineAt).toLocaleDateString()}`}
                          {d.publishedBy?.name && ` · ${d.publishedBy.name}`}
                        </p>
                      </div>
                      <AckStatus
                        acknowledged={d.acknowledged}
                        readByUser={d.readByUser}
                        overdue={Boolean(d.isOverdue)}
                        mandatory={d.isMandatory}
                      />
                    </header>

                    {expandedId === d.id ? (
                      <div className="knowledge-doc-body">
                        <div className="knowledge-prose whitespace-pre-wrap">{d.body}</div>
                        {d.keywords.length > 0 && (
                          <div className="knowledge-keywords">
                            {d.keywords.map((k) => (
                              <span key={k} className="knowledge-keyword">
                                {k}
                              </span>
                            ))}
                          </div>
                        )}
                        {canAck && d.isMandatory && !d.acknowledged && (
                          <div className="knowledge-ack-block">
                            <label className="knowledge-ack-label">
                              <input
                                type="checkbox"
                                checked={confirmRead}
                                onChange={(e) => setConfirmRead(e.target.checked)}
                              />
                              I confirm this branch has read and will comply with this policy.
                            </label>
                            <button
                              type="button"
                              disabled={loading}
                              className="btn-primary"
                              onClick={() => void acknowledge(d.id)}
                            >
                              Acknowledge policy
                            </button>
                          </div>
                        )}
                        <button
                          type="button"
                          className="knowledge-close-btn"
                          onClick={() => {
                            setExpandedId(null);
                            setConfirmRead(false);
                          }}
                        >
                          Close
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="knowledge-read-btn"
                        onClick={() => void openDirective(d.id)}
                      >
                        {d.readByUser ? "Read again" : "Open procedure"}
                        {d.isMandatory && !d.acknowledged && canAck
                          ? " · Acknowledge required"
                          : ""}
                      </button>
                    )}
                  </article>
                ))
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function FilterChip({
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
      className={`knowledge-chip ${active ? "active" : ""}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function DirectiveCard({
  directive: d,
  compact,
  onOpen,
}: {
  directive: SerializedDirective;
  compact?: boolean;
  onOpen: () => void;
}) {
  return (
    <button type="button" className="knowledge-pin-card" onClick={onOpen}>
      <span className="knowledge-pin-card-title">{d.title}</span>
      {!compact && d.summary && (
        <span className="knowledge-pin-card-desc">{d.summary}</span>
      )}
    </button>
  );
}

function AckStatus({
  acknowledged,
  readByUser,
  overdue,
  mandatory,
}: {
  acknowledged: boolean;
  readByUser: boolean;
  overdue: boolean;
  mandatory: boolean;
}) {
  if (acknowledged) {
    return (
      <span className="knowledge-status knowledge-status-ok">Acknowledged</span>
    );
  }
  if (overdue) {
    return (
      <span className="knowledge-status knowledge-status-overdue">Overdue</span>
    );
  }
  if (mandatory && !readByUser) {
    return (
      <span className="knowledge-status knowledge-status-unread">Unread</span>
    );
  }
  if (mandatory) {
    return (
      <span className="knowledge-status knowledge-status-pending">Pending ack</span>
    );
  }
  return readByUser ? (
    <span className="knowledge-status knowledge-status-read">Read</span>
  ) : (
    <span className="knowledge-status knowledge-status-optional">Optional</span>
  );
}
