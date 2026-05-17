import Link from "next/link";
import type { Role } from "@prisma/client";
import { LogoutButton } from "./LogoutButton";
import { ProductionBanner } from "./ProductionBanner";
import { hasPermission, Permission } from "@/lib/rbac";

type AppShellProps = {
  user: { name: string; email: string; role: Role };
  branchLabel?: string | null;
  children: React.ReactNode;
};

export function AppShell({ user, branchLabel, children }: AppShellProps) {
  const nav = [
    { href: "/dashboard", label: "Dashboard", show: true },
    {
      href: "/eod",
      label: "EOD",
      show: hasPermission(user.role, Permission.EOD_VIEW_BRANCH),
    },
    {
      href: "/incidents",
      label: "Incidents",
      show:
        hasPermission(user.role, Permission.INCIDENT_VIEW_BRANCH) ||
        hasPermission(user.role, Permission.INCIDENT_VIEW_ALL),
    },
    {
      href: "/directives",
      label: "Directives",
      show: hasPermission(user.role, Permission.DIRECTIVE_VIEW),
    },
    {
      href: "/tickets",
      label: "Service desk",
      show:
        hasPermission(user.role, Permission.TICKET_VIEW_BRANCH) ||
        hasPermission(user.role, Permission.TICKET_VIEW_ALL),
    },
    {
      href: "/supervisor",
      label: "Supervisor",
      show: hasPermission(user.role, Permission.DASHBOARD_SUPERVISOR),
    },
    {
      href: "/pilot",
      label: "Pilot",
      show:
        hasPermission(user.role, Permission.PILOT_VIEW) ||
        hasPermission(user.role, Permission.PILOT_FEEDBACK_CREATE),
    },
    {
      href: "/audit",
      label: "Audit",
      show: hasPermission(user.role, Permission.AUDIT_VIEW),
    },
    {
      href: "/admin",
      label: "Admin",
      show: hasPermission(user.role, Permission.ADMIN_USERS),
    },
    {
      href: "/ops",
      label: "Go-live",
      show: hasPermission(user.role, Permission.OPS_VIEW),
    },
  ].filter((n) => n.show);

  return (
    <div className="min-h-screen bg-slate-50">
      <ProductionBanner />
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="font-semibold text-[#00529b]">
              MaatiiLink
            </Link>
            <nav className="flex gap-4 text-sm">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-slate-600 hover:text-[#00529b]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="text-right">
              <p className="font-medium text-slate-800">{user.name}</p>
              <p className="text-xs text-slate-500">
                {user.role.replace(/_/g, " ")}
                {branchLabel ? ` · ${branchLabel}` : ""}
              </p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
