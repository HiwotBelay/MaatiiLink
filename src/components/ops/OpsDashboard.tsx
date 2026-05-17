"use client";

import type { OpsStatus } from "@/lib/ops/status";

export function OpsDashboard({ initial }: { initial: OpsStatus }) {
  const env = initial.env;

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Release" value={initial.release} />
        <Stat label="Environment" value={initial.environment} />
        <Stat
          label="Database"
          value={initial.database}
          ok={initial.database === "connected"}
        />
        <Stat
          label="Production ready"
          value={env.productionReady ? "Yes" : "No"}
          ok={env.productionReady}
        />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">Environment checks</h2>
        <ul className="space-y-2 text-sm">
          <CheckRow label="DATABASE_URL" status={env.checks.databaseUrl} />
          <CheckRow label="DIRECT_URL" status={env.checks.directUrl} />
          <CheckRow label="SESSION_SECRET" status={env.checks.sessionSecret} />
          <CheckRow label="APP_URL" status={env.checks.appUrl} />
        </ul>
        {env.messages.length > 0 && (
          <ul className="mt-4 list-inside list-disc text-sm text-amber-800">
            {env.messages.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">National rollout</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Total branches" value={String(initial.counts.branches)} />
          <Stat label="Pilot branches" value={String(initial.counts.pilotBranches)} />
          <Stat label="Users" value={String(initial.counts.users)} />
          <Stat label="Active users" value={String(initial.counts.activeUsers)} />
        </div>
        <p className="mt-4 text-sm text-slate-600">
          National branches = total − pilot. Graduate pilot branches from Admin when KPIs
          are green.
        </p>
      </section>

      <p className="text-xs text-slate-400">
        Last checked {new Date(initial.timestamp).toLocaleString()}
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  ok,
}: {
  label: string;
  value: string;
  ok?: boolean;
}) {
  return (
    <article
      className={`rounded-xl border p-4 ${
        ok === undefined
          ? "border-slate-200 bg-white"
          : ok
            ? "border-emerald-200 bg-emerald-50"
            : "border-amber-200 bg-amber-50"
      }`}
    >
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p className="text-lg font-bold text-slate-900">{value}</p>
    </article>
  );
}

function CheckRow({
  label,
  status,
}: {
  label: string;
  status: "ok" | "warn" | "fail";
}) {
  const color =
    status === "ok"
      ? "text-emerald-700"
      : status === "warn"
        ? "text-amber-700"
        : "text-red-700";
  return (
    <li className="flex justify-between">
      <span>{label}</span>
      <span className={`font-medium uppercase ${color}`}>{status}</span>
    </li>
  );
}
