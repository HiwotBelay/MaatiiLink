import Link from "next/link";
import type { Role } from "@prisma/client";
import { ShieldCheck } from "lucide-react";
import { MaatiiLinkLogo } from "@/components/brand/MaatiiLinkLogo";
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
    <div className="app-bg min-h-screen">
      <ProductionBanner />
      <header className="sticky top-0 z-40 border-b border-white/70 bg-white/78 shadow-sm shadow-slate-950/5 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-5">
            <MaatiiLinkLogo href="/dashboard" height={36} priority />
            <nav className="flex max-w-full gap-2 overflow-x-auto rounded-full border border-slate-200/80 bg-white/75 p-1 text-sm shadow-sm">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="whitespace-nowrap rounded-full px-3 py-1.5 font-semibold text-slate-600 hover:bg-blue-50 hover:text-[var(--primary)]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="text-right">
              <p className="font-bold text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-500">
                {user.role.replace(/_/g, " ")}
                {branchLabel ? ` · ${branchLabel}` : ""}
              </p>
            </div>
            <div className="hidden rounded-2xl bg-blue-50 p-2 text-[var(--primary)] sm:block">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="reveal-up mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
