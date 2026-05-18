"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DirectivePublishForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    body: "",
    isCritical: false,
    deadlineAt: "",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/directives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          body: form.body,
          isCritical: form.isCritical,
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
    <form
      onSubmit={submit}
      className="polished-card max-w-2xl rounded-[1.5rem] p-6"
    >
      <h2 className="mb-4 text-lg font-semibold">Publish HO directive</h2>
      {error && (
        <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>
      )}
      <label className="block text-sm">
        <span className="text-slate-600">Title</span>
        <input
          required
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          className="field-control mt-1"
        />
      </label>
      <label className="mt-4 block text-sm">
        <span className="text-slate-600">Body</span>
        <textarea
          required
          minLength={20}
          rows={10}
          value={form.body}
          onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
          className="field-control mt-1"
        />
      </label>
      <label className="mt-4 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.isCritical}
          onChange={(e) => setForm((f) => ({ ...f, isCritical: e.target.checked }))}
        />
        <span>Critical directive (triggers supervisor email when SMTP configured)</span>
      </label>
      <label className="mt-4 block text-sm">
        <span className="text-slate-600">Acknowledgment deadline (optional)</span>
        <input
          type="date"
          value={form.deadlineAt}
          onChange={(e) => setForm((f) => ({ ...f, deadlineAt: e.target.value }))}
          className="field-control mt-1 w-auto"
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="btn-primary mt-6 px-4 py-2 text-sm disabled:opacity-50"
      >
        Publish
      </button>
    </form>
  );
}
