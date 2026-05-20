"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  CATEGORY_LABELS,
  DIRECTIVE_CATEGORIES,
  DIRECTIVE_PRIORITIES,
  PRIORITY_LABELS,
} from "@/lib/directive/constants";

export function KnowledgePublishForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    summary: "",
    body: "",
    category: "COMPLIANCE",
    priority: "MEDIUM",
    keywords: "",
    isCritical: false,
    isPinned: false,
    isMandatory: true,
    isSop: false,
    deadlineAt: "",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const keywords = form.keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);
      const res = await fetch("/api/directives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          summary: form.summary || null,
          body: form.body,
          category: form.category,
          priority: form.priority,
          keywords,
          isCritical: form.isCritical || form.priority === "CRITICAL",
          isPinned: form.isPinned,
          isMandatory: form.isMandatory,
          isSop: form.isSop,
          deadlineAt: form.deadlineAt || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Publish failed");
        return;
      }
      router.push("/directives");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="knowledge-publish-form">
      <h2 className="knowledge-section-title">Publish procedure or policy</h2>
      {error && <p className="knowledge-alert knowledge-alert-error">{error}</p>}

      <div className="knowledge-form-grid">
        <label className="knowledge-field">
          <span className="knowledge-field-label">Title</span>
          <input
            required
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="field-control"
          />
        </label>
        <label className="knowledge-field">
          <span className="knowledge-field-label">Category</span>
          <select
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            className="field-control"
          >
            {DIRECTIVE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </label>
        <label className="knowledge-field">
          <span className="knowledge-field-label">Priority</span>
          <select
            value={form.priority}
            onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
            className="field-control"
          >
            {DIRECTIVE_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </option>
            ))}
          </select>
        </label>
        <label className="knowledge-field knowledge-field-wide">
          <span className="knowledge-field-label">Summary (card preview)</span>
          <input
            value={form.summary}
            onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
            className="field-control"
            maxLength={500}
          />
        </label>
        <label className="knowledge-field knowledge-field-wide">
          <span className="knowledge-field-label">Keywords (comma-separated)</span>
          <input
            value={form.keywords}
            onChange={(e) => setForm((f) => ({ ...f, keywords: e.target.value }))}
            className="field-control"
            placeholder="cash, withdrawal, dual control"
          />
        </label>
        <label className="knowledge-field knowledge-field-wide">
          <span className="knowledge-field-label">Procedure / policy body</span>
          <textarea
            required
            minLength={20}
            rows={14}
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            className="field-control font-mono text-sm"
          />
        </label>
        <label className="knowledge-field">
          <span className="knowledge-field-label">Acknowledgment deadline</span>
          <input
            type="date"
            value={form.deadlineAt}
            onChange={(e) => setForm((f) => ({ ...f, deadlineAt: e.target.value }))}
            className="field-control"
          />
        </label>
      </div>

      <div className="knowledge-form-flags">
        <label>
          <input
            type="checkbox"
            checked={form.isMandatory}
            onChange={(e) => setForm((f) => ({ ...f, isMandatory: e.target.checked }))}
          />
          Mandatory read & branch acknowledgment
        </label>
        <label>
          <input
            type="checkbox"
            checked={form.isSop}
            onChange={(e) => setForm((f) => ({ ...f, isSop: e.target.checked }))}
          />
          Standard operating procedure (SOP)
        </label>
        <label>
          <input
            type="checkbox"
            checked={form.isPinned}
            onChange={(e) => setForm((f) => ({ ...f, isPinned: e.target.checked }))}
          />
          Pin to critical directives
        </label>
        <label>
          <input
            type="checkbox"
            checked={form.isCritical}
            onChange={(e) => setForm((f) => ({ ...f, isCritical: e.target.checked }))}
          />
          Critical (email supervisors when SMTP configured)
        </label>
      </div>

      <button type="submit" disabled={loading} className="btn-primary mt-6">
        {loading ? "Publishing…" : "Publish to knowledge center"}
      </button>
    </form>
  );
}
