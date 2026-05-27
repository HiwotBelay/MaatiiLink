"use client";

import { Shield, Monitor, Clock, MapPin } from "lucide-react";
import type { Role } from "@prisma/client";
import { roleDisplayName } from "@/lib/role-labels";

type Activity = {
  id: string;
  success: boolean;
  failureReason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
};

type SessionRow = {
  id: string;
  ipAddress: string | null;
  deviceLabel: string | null;
  lastActivityAt: Date;
  createdAt: Date;
};

type SecurityConsoleProps = {
  activities: Activity[];
  sessions: SessionRow[];
  role: Role;
};

export function SecurityConsole({ activities, sessions, role }: SecurityConsoleProps) {
  return (
    <div className="security-grid">
      <section className="security-panel">
        <header className="security-panel-header">
          <Shield className="h-5 w-5 text-[var(--accent)]" />
          <div>
            <h2>Active sessions</h2>
            <p>Signed-in devices for your account (idle timeout 30 min)</p>
          </div>
        </header>
        <ul className="security-list">
          {sessions.length === 0 ? (
            <li className="security-list-empty">No active sessions</li>
          ) : (
            sessions.map((s) => (
              <li key={s.id} className="security-list-item">
                <Monitor className="h-4 w-4 shrink-0 opacity-60" />
                <div>
                  <p className="font-medium">{s.deviceLabel ?? "Unknown device"}</p>
                  <p className="text-xs opacity-70">
                    {s.ipAddress ?? "IP hidden"} · Last active{" "}
                    {s.lastActivityAt.toLocaleString()}
                  </p>
                </div>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="security-panel">
        <header className="security-panel-header">
          <Clock className="h-5 w-5 text-[var(--accent)]" />
          <div>
            <h2>Sign-in history</h2>
            <p>Recent authentication events on your account</p>
          </div>
        </header>
        <ul className="security-list">
          {activities.map((a) => (
            <li key={a.id} className="security-list-item">
              <MapPin className="h-4 w-4 shrink-0 opacity-60" />
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {a.success ? (
                    <span className="text-emerald-400">Successful sign-in</span>
                  ) : (
                    <span className="text-amber-400">
                      Failed · {a.failureReason ?? "Unknown"}
                    </span>
                  )}
                </p>
                <p className="truncate text-xs opacity-70">
                  {a.ipAddress ?? "—"} · {new Date(a.createdAt).toLocaleString()}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="security-panel security-panel-wide">
        <header className="security-panel-header">
          <Shield className="h-5 w-5 text-[var(--accent)]" />
          <div>
            <h2>Enterprise controls</h2>
            <p>RBAC · immutable audit trail · branch isolation · account lockout</p>
          </div>
        </header>
        <div className="security-badges">
          {[
            "8 roles",
            "30 min idle timeout",
            "5-attempt lockout",
            "API + UI guards",
            "Immutable audit log",
          ].map((label) => (
            <span key={label} className="security-badge">
              {label}
            </span>
          ))}
        </div>
        <p className="mt-4 text-sm opacity-75">
          Your role: <strong>{roleDisplayName(role)}</strong>. Contact HO IT to request
          access changes.
        </p>
      </section>
    </div>
  );
}
