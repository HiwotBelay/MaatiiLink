import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { StatCard } from "@/components/layout/StatCard";
import { RoleGuideBanner } from "@/components/layout/RoleGuideBanner";
import { PageHeader } from "@/components/layout/PageHeader";
import type { Role } from "@prisma/client";
import {
  getBranchCapabilities,
  isBranchManager,
  isBranchStaff,
} from "@/lib/roles/branch-staff";
import { getAddisDateString } from "@/lib/eod/constants";

type BranchInfo = {
  name: string;
  branchCode: string;
  district: string | null;
  isSmartBranch: boolean;
};

type Props = {
  user: { name: string; role: Role };
  branch: BranchInfo;
  eodStatus: { label: string; tone: "default" | "warning" | "danger" | "success" };
  openIncidents: number;
  overdueDirectives: number;
  openTickets: number;
};

export function BranchDashboard({
  user,
  branch,
  eodStatus,
  openIncidents,
  overdueDirectives,
  openTickets,
}: Props) {
  const caps = getBranchCapabilities(user.role);
  const staff = isBranchStaff(user.role);
  const manager = isBranchManager(user.role);
  const firstName = user.name.split(" ")[0];

  const modules = [
    {
      title: staff ? "EOD today (view)" : "EOD today",
      value: eodStatus.label,
      tone: eodStatus.tone,
      href: "/eod",
      hint: staff
        ? "Manager submits"
        : caps.canSubmitEod
          ? "Submit before cut-off"
          : undefined,
    },
    {
      title: manager ? "Open incidents" : "Open incidents",
      value: String(openIncidents),
      tone: openIncidents > 0 ? ("warning" as const) : ("success" as const),
      href: "/incidents",
      hint: manager
        ? "Update status"
        : caps.canCreateIncident
          ? "Report new"
          : undefined,
    },
    {
      title: staff ? "Policies (manager ack)" : "Policies to acknowledge",
      value: String(overdueDirectives),
      tone: overdueDirectives > 0 ? ("danger" as const) : ("success" as const),
      href: manager ? "/directives?pendingAck=1" : "/directives",
      hint: staff
        ? "Read in Knowledge"
        : overdueDirectives > 0
          ? "Ack required"
          : caps.canAckDirectives
            ? "All current"
            : undefined,
    },
    {
      title: "Service requests",
      value: String(openTickets),
      tone: openTickets > 0 ? ("warning" as const) : ("default" as const),
      href: "/tickets",
      hint: caps.canCreateTicket ? "Create ticket" : undefined,
    },
  ];

  return (
    <>
      <PageHeader
        title={
          staff
            ? `Welcome, ${firstName}`
            : manager
              ? `Manager dashboard — ${firstName}`
              : "Dashboard"
        }
        description={`${getAddisDateString()} · ${branch.name} (${branch.branchCode})`}
      />

      <RoleGuideBanner role={user.role} />

      <section className="dashboard-stat-grid">
        {modules.map((m) => (
          <Link key={m.href} href={m.href} className="dashboard-stat-link">
            <StatCard label={m.title} value={m.value} tone={m.tone} hint={m.hint} />
            <span className="dashboard-stat-arrow">
              Open <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        ))}
      </section>

      <section className="branch-quick-actions">
        <h2 className="branch-quick-title">
          {manager ? "Manager priorities" : "Quick actions"}
        </h2>
        <div className="branch-quick-grid">
          {staff && (
            <>
              <QuickAction href="/directives" label="Find a procedure" desc="Search HO knowledge" />
              <QuickAction
                href="/incidents"
                label="Report incident"
                desc="Fraud, downtime, cash, security"
              />
              <QuickAction
                href="/tickets"
                label="Request support"
                desc="IT, facilities, cash logistics"
              />
            </>
          )}
          {manager && (
            <>
              <QuickAction
                href="/eod"
                label="Complete & submit EOD"
                desc="Daily branch close — before cut-off"
                primary
              />
              <QuickAction
                href="/directives?pendingAck=1"
                label="Acknowledge HO policies"
                desc={
                  overdueDirectives > 0
                    ? `${overdueDirectives} pending for your branch`
                    : "Mandatory procedures for your branch"
                }
                urgent={overdueDirectives > 0}
              />
              <QuickAction
                href="/incidents"
                label="Manage incidents"
                desc="Update status and evidence at your branch"
              />
              <QuickAction
                href="/tickets"
                label="Service requests"
                desc="Open or track branch tickets"
              />
            </>
          )}
          {!staff && !manager && caps.canEditEod && (
            <QuickAction href="/eod" label="Complete EOD" desc="Submit before cut-off" />
          )}
        </div>
      </section>

      <p className="mt-6 text-sm text-[var(--muted-foreground)]">
        {branch.isSmartBranch ? "Smart Branch" : "Branch"} · {branch.district ?? "—"} · Ethiopia
        (EAT)
      </p>
    </>
  );
}

function QuickAction({
  href,
  label,
  desc,
  primary,
  urgent,
}: {
  href: string;
  label: string;
  desc: string;
  primary?: boolean;
  urgent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`branch-quick-card${primary ? " branch-quick-card-primary" : ""}${urgent ? " branch-quick-card-urgent" : ""}`}
    >
      <span className="branch-quick-label">{label}</span>
      <span className="branch-quick-desc">{desc}</span>
    </Link>
  );
}
