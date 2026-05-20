"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@prisma/client";
import {
  Activity,
  Building2,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Megaphone,
  Rocket,
  Settings,
  Shield,
  Ticket,
  Users,
} from "lucide-react";
import { MaatiiLinkLogo } from "@/components/brand/MaatiiLinkLogo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import {
  defaultRouteForRole,
  hasPermission,
  isHeadOfficeHomeRole,
  Permission,
} from "@/lib/rbac";

const ICONS = {
  dashboard: LayoutDashboard,
  eod: FileText,
  incidents: Activity,
  directives: Megaphone,
  tickets: Ticket,
  supervisor: ClipboardList,
  ho: Building2,
  pilot: Rocket,
  audit: Shield,
  admin: Users,
  ops: Settings,
} as const;

type Props = {
  user: { name: string; role: Role };
  branchLabel?: string | null;
};

export function AppSidebar({ user, branchLabel }: Props) {
  const pathname = usePathname();
  const homeHref = defaultRouteForRole(user.role);
  const isHo = isHeadOfficeHomeRole(user.role);

  const items = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: "dashboard" as const,
      show:
        !hasPermission(user.role, Permission.DASHBOARD_SUPERVISOR) && !isHo,
    },
    {
      href: "/ho",
      label: "Head Office",
      icon: "ho" as const,
      show: isHo,
    },
    {
      href: "/supervisor",
      label: isHo ? "Branch compliance" : "Supervisor",
      icon: "supervisor" as const,
      show: hasPermission(user.role, Permission.DASHBOARD_SUPERVISOR),
    },
    {
      href: "/eod/oversight",
      label: "EOD oversight",
      icon: "eod" as const,
      show:
        isHo && hasPermission(user.role, Permission.EOD_VIEW_ALL),
    },
    {
      href: "/eod",
      label: "EOD",
      icon: "eod" as const,
      show: hasPermission(user.role, Permission.EOD_VIEW_BRANCH),
    },
    {
      href: "/incidents",
      label: "Incidents",
      icon: "incidents" as const,
      show:
        hasPermission(user.role, Permission.INCIDENT_VIEW_BRANCH) ||
        hasPermission(user.role, Permission.INCIDENT_VIEW_ALL),
    },
    {
      href: "/directives",
      label: "Knowledge",
      icon: "directives" as const,
      show: hasPermission(user.role, Permission.DIRECTIVE_VIEW),
    },
    {
      href: "/tickets",
      label: "Service ops",
      icon: "tickets" as const,
      show:
        hasPermission(user.role, Permission.TICKET_VIEW_BRANCH) ||
        hasPermission(user.role, Permission.TICKET_VIEW_ALL),
    },
    {
      href: "/pilot",
      label: "Pilot",
      icon: "pilot" as const,
      show:
        hasPermission(user.role, Permission.PILOT_VIEW) ||
        hasPermission(user.role, Permission.PILOT_FEEDBACK_CREATE),
    },
    {
      href: "/security",
      label: "Security",
      icon: "audit" as const,
      show: hasPermission(user.role, Permission.SECURITY_VIEW),
    },
    {
      href: "/audit",
      label: "Audit",
      icon: "audit" as const,
      show: hasPermission(user.role, Permission.AUDIT_VIEW),
    },
    {
      href: "/admin",
      label: "Admin",
      icon: "admin" as const,
      show: hasPermission(user.role, Permission.ADMIN_USERS),
    },
    {
      href: "/ops",
      label: "Go-live",
      icon: "ops" as const,
      show: hasPermission(user.role, Permission.OPS_VIEW),
    },
  ].filter((n) => n.show);

  return (
    <aside className="app-sidebar">
      <div className="app-sidebar-inner">
        <Link href={homeHref} className="app-sidebar-brand">
          <MaatiiLinkLogo height={34} />
        </Link>

        <nav className="app-sidebar-nav" aria-label="Main">
          {items.map((item) => {
            const Icon = ICONS[item.icon];
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`app-nav-item ${active ? "app-nav-item-active" : ""}`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="app-sidebar-footer">
          <ThemeToggle className="w-full justify-start" />
          <div className="app-sidebar-user">
            <p className="truncate font-semibold text-[var(--foreground)]">
              {user.name}
            </p>
            <p className="truncate text-xs text-[var(--muted-foreground)]">
              {user.role.replace(/_/g, " ")}
              {branchLabel ? ` · ${branchLabel}` : ""}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
