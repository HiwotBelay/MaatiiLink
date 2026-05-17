"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export type DirectiveRow = {
  id: string;
  title: string;
  body: string;
  isCritical: boolean;
  publishedAt: string;
  deadlineAt: string | null;
  acknowledged: boolean;
  acknowledgedAt: string | null;
  isOverdue: boolean | "" | null;
};

type Props = {
  directives: DirectiveRow[];
  canAck: boolean;
  canPublish: boolean;
};

export function DirectivePanel({ directives, canAck, canPublish }: Props) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmRead, setConfirmRead] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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
      setMessage("Directive acknowledged for your branch.");
      setExpandedId(null);
      setConfirmRead(false);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {canPublish && (
        <div className="mb-6">
          <Link
            href="/directives/new"
            className="inline-block rounded-lg bg-[#00529b] px-4 py-2 text-sm font-medium text-white hover:bg-[#003d73]"
          >
            + Publish directive
          </Link>
        </div>
      )}

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      {message && (
        <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {message}
        </p>
      )}

      <div className="space-y-4">
        {directives.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            No directives published yet.
          </p>
        ) : (
          directives.map((d) => (
            <article
              key={d.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <header className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  {d.isCritical && (
                    <span className="mr-2 rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
                      CRITICAL
                    </span>
                  )}
                  <h2 className="font-semibold text-slate-900">{d.title}</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Published {new Date(d.publishedAt).toLocaleDateString()}
                    {d.deadlineAt &&
                      ` · Deadline ${new Date(d.deadlineAt).toLocaleDateString()}`}
                  </p>
                </div>
                <AckStatus acknowledged={d.acknowledged} overdue={Boolean(d.isOverdue)} />
              </header>

              {expandedId === d.id ? (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <div className="prose prose-sm max-w-none whitespace-pre-wrap text-slate-700">
                    {d.body}
                  </div>
                  {canAck && !d.acknowledged && (
                    <div className="mt-4 space-y-3">
                      <label className="flex items-start gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={confirmRead}
                          onChange={(e) => setConfirmRead(e.target.checked)}
                          className="mt-1"
                        />
                        <span>
                          I confirm this branch has read and will comply with this directive.
                        </span>
                      </label>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => acknowledge(d.id)}
                        className="rounded-lg bg-[#00529b] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                      >
                        Confirm acknowledgment
                      </button>
                    </div>
                  )}
                  <button
                    type="button"
                    className="mt-3 text-sm text-slate-500 hover:text-slate-700"
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
                  onClick={() => setExpandedId(d.id)}
                  className="mt-3 text-sm font-medium text-[#00529b] hover:underline"
                >
                  {d.acknowledged ? "Read again" : "Read full"}
                  {!d.acknowledged && canAck ? " · Acknowledge" : ""}
                </button>
              )}
            </article>
          ))
        )}
      </div>
    </div>
  );
}

function AckStatus({
  acknowledged,
  overdue,
}: {
  acknowledged: boolean;
  overdue: boolean;
}) {
  if (acknowledged) {
    return (
      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
        Acknowledged
      </span>
    );
  }
  if (overdue) {
    return (
      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
        Overdue
      </span>
    );
  }
  return (
    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
      Pending
    </span>
  );
}
