"use client";

import { useState } from "react";
import type { Role } from "@prisma/client";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  branch?: { branchCode: string; name: string } | null;
};

type BranchRow = {
  id: string;
  branchCode: string;
  name: string;
  district: string | null;
  region: string | null;
  isSmartBranch: boolean;
  isPilotBranch: boolean;
};

type Props = {
  initialUsers: UserRow[];
  initialBranches: BranchRow[];
};

const ROLES: Role[] = [
  "BRANCH_STAFF",
  "BRANCH_MANAGER",
  "SUPERVISOR",
  "HO_ADMIN",
  "AUDITOR",
];

export function AdminConsole({ initialUsers, initialBranches }: Props) {
  const [tab, setTab] = useState<"users" | "branches">("users");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <div className="mb-6 inline-flex gap-2 rounded-full border border-slate-200 bg-white/80 p-1 shadow-sm">
        <TabButton active={tab === "users"} onClick={() => setTab("users")}>
          Users
        </TabButton>
        <TabButton active={tab === "branches"} onClick={() => setTab("branches")}>
          Branches
        </TabButton>
      </div>

      {message && (
        <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {message}
        </p>
      )}
      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
          {error}
        </p>
      )}

      {tab === "users" ? (
        <UserSection
          users={initialUsers}
          branches={initialBranches}
          onSuccess={(msg) => {
            setMessage(msg);
            setError(null);
            window.location.reload();
          }}
          onError={setError}
        />
      ) : (
        <BranchSection
          branches={initialBranches}
          onSuccess={(msg) => {
            setMessage(msg);
            setError(null);
            window.location.reload();
          }}
          onError={setError}
        />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-bold ${
        active
          ? "bg-[var(--primary)] text-white shadow-sm"
          : "text-slate-500 hover:bg-blue-50 hover:text-[var(--primary)]"
      }`}
    >
      {children}
    </button>
  );
}

function UserSection({
  users,
  branches,
  onSuccess,
  onError,
}: {
  users: UserRow[];
  branches: BranchRow[];
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  return (
    <div>
      <form
        className="polished-card mb-8 rounded-[1.5rem] p-5"
        onSubmit={async (e) => {
          e.preventDefault();
          onError("");
          const fd = new FormData(e.currentTarget);
          const res = await fetch("/api/admin/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({
              name: fd.get("name"),
              email: fd.get("email"),
              password: fd.get("password"),
              role: fd.get("role"),
              branchId: fd.get("branchId") || null,
            }),
          });
          const data = await res.json();
          if (!res.ok) {
            onError(data.error ?? "Failed to create user");
            return;
          }
          onSuccess(`User ${data.user.email} created`);
        }}
      >
        <h2 className="mb-3 font-semibold">Provision user (production)</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            name="name"
            required
            placeholder="Full name"
            className="field-control"
          />
          <input
            name="email"
            type="email"
            required
            placeholder="email@coopbank.et"
            className="field-control"
          />
          <input
            name="password"
            type="password"
            required
            minLength={12}
            placeholder="Min 12 characters"
            className="field-control"
          />
          <select name="role" required className="field-control">
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <select name="branchId" className="field-control sm:col-span-2">
            <option value="">— No branch (HO roles) —</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.branchCode} — {b.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="btn-primary mt-3 px-4 py-2 text-sm"
        >
          Create user
        </button>
      </form>

      <div className="polished-card overflow-hidden rounded-[1.5rem]">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Branch</th>
              <th className="px-4 py-3">Active</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3 text-slate-600">{u.email}</td>
                <td className="px-4 py-3">{u.role.replace(/_/g, " ")}</td>
                <td className="px-4 py-3 text-slate-600">
                  {u.branch?.branchCode ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    className="text-xs font-medium text-[#00529b] hover:underline"
                    onClick={async () => {
                      const res = await fetch(`/api/admin/users/${u.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        credentials: "same-origin",
                        body: JSON.stringify({ isActive: !u.isActive }),
                      });
                      if (res.ok) window.location.reload();
                    }}
                  >
                    {u.isActive ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BranchSection({
  branches,
  onSuccess,
  onError,
}: {
  branches: BranchRow[];
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  return (
    <div>
      <form
        className="polished-card mb-8 rounded-[1.5rem] p-5"
        onSubmit={async (e) => {
          e.preventDefault();
          onError("");
          const fd = new FormData(e.currentTarget);
          const res = await fetch("/api/admin/branches", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({
              branchCode: String(fd.get("branchCode")).toUpperCase(),
              name: fd.get("name"),
              district: fd.get("district") || undefined,
              region: fd.get("region") || undefined,
              isSmartBranch: fd.get("isSmartBranch") === "on",
              isPilotBranch: fd.get("isPilotBranch") === "on",
            }),
          });
          const data = await res.json();
          if (!res.ok) {
            onError(data.error ?? "Failed to create branch");
            return;
          }
          onSuccess(`Branch ${data.branch.branchCode} created`);
        }}
      >
        <h2 className="mb-3 font-semibold">Add branch (national rollout)</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            name="branchCode"
            required
            pattern="[A-Z0-9]+"
            placeholder="Branch code e.g. AD001"
            className="field-control uppercase"
          />
          <input
            name="name"
            required
            placeholder="Branch name"
            className="field-control"
          />
          <input name="district" placeholder="District" className="field-control" />
          <input name="region" placeholder="Region" className="field-control" />
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input type="checkbox" name="isSmartBranch" /> Smart branch
        </label>
        <label className="mt-2 flex items-center gap-2 text-sm">
          <input type="checkbox" name="isPilotBranch" /> Pilot branch
        </label>
        <button
          type="submit"
          className="btn-primary mt-3 px-4 py-2 text-sm"
        >
          Create branch
        </button>
      </form>

      <div className="polished-card overflow-hidden rounded-[1.5rem]">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Region</th>
              <th className="px-4 py-3">Pilot</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {branches.map((b) => (
              <tr key={b.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 font-medium">{b.branchCode}</td>
                <td className="px-4 py-3">{b.name}</td>
                <td className="px-4 py-3 text-slate-600">{b.region ?? "—"}</td>
                <td className="px-4 py-3">{b.isPilotBranch ? "Yes" : "No"}</td>
                <td className="px-4 py-3">
                  {b.isPilotBranch && (
                    <button
                      type="button"
                      className="text-xs font-medium text-[#00529b] hover:underline"
                      onClick={async () => {
                        const res = await fetch(
                          `/api/admin/branches/${b.id}/graduate`,
                          { method: "POST", credentials: "same-origin" },
                        );
                        if (res.ok) window.location.reload();
                      }}
                    >
                      Graduate to national
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
