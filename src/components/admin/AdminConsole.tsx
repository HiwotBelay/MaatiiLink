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
      <div className="mb-6 flex gap-2 border-b border-slate-200">
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
      className={`border-b-2 px-4 py-2 text-sm font-medium ${
        active
          ? "border-[#00529b] text-[#00529b]"
          : "border-transparent text-slate-500 hover:text-slate-700"
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
        className="mb-8 rounded-xl border border-slate-200 bg-white p-4"
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
            className="rounded border px-3 py-2 text-sm"
          />
          <input
            name="email"
            type="email"
            required
            placeholder="email@coopbank.et"
            className="rounded border px-3 py-2 text-sm"
          />
          <input
            name="password"
            type="password"
            required
            minLength={12}
            placeholder="Min 12 characters"
            className="rounded border px-3 py-2 text-sm"
          />
          <select name="role" required className="rounded border px-3 py-2 text-sm">
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <select name="branchId" className="rounded border px-3 py-2 text-sm sm:col-span-2">
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
          className="mt-3 rounded-lg bg-[#00529b] px-4 py-2 text-sm text-white"
        >
          Create user
        </button>
      </form>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
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
        className="mb-8 rounded-xl border border-slate-200 bg-white p-4"
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
            className="rounded border px-3 py-2 text-sm uppercase"
          />
          <input
            name="name"
            required
            placeholder="Branch name"
            className="rounded border px-3 py-2 text-sm"
          />
          <input name="district" placeholder="District" className="rounded border px-3 py-2 text-sm" />
          <input name="region" placeholder="Region" className="rounded border px-3 py-2 text-sm" />
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input type="checkbox" name="isSmartBranch" /> Smart branch
        </label>
        <label className="mt-2 flex items-center gap-2 text-sm">
          <input type="checkbox" name="isPilotBranch" /> Pilot branch
        </label>
        <button
          type="submit"
          className="mt-3 rounded-lg bg-[#00529b] px-4 py-2 text-sm text-white"
        >
          Create branch
        </button>
      </form>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
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
