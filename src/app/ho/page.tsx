import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/layout/StatCard";
import { HoWorkQueues } from "@/components/ho/HoWorkQueues";
import { getServerSession } from "@/lib/auth/server";
import { getHoDashboardSummary } from "@/lib/ho/dashboard-summary";
import { hasPermission, Permission, isHeadOfficeHomeRole } from "@/lib/rbac";
import { getAddisDateString } from "@/lib/eod/constants";

export default async function HeadOfficePage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  if (!isHeadOfficeHomeRole(session.role)) {
    redirect("/dashboard");
  }

  const summary = await getHoDashboardSummary();

  return (
    <AppShell user={session} branchLabel="Head Office · Addis Ababa">
      <PageHeader
        title="Head Office operations"
        description={`Cooperative Bank of Oromia — national oversight · ${getAddisDateString()} (EAT)`}
      />

      <p className="mb-6 max-w-3xl text-sm text-[var(--muted-foreground)]">
        Live operational data from branches across Ethiopia: end-of-day reporting,
        incidents, HO procedures, and internal service tickets. Every action below uses
        the same database and APIs as branch and supervisor users.
      </p>

      <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Active branches" value={String(summary.branchCount)} />
        <StatCard
          label="EOD missing / late (today)"
          value={String(summary.missingEod)}
          tone={summary.missingEod > 0 ? "warning" : "default"}
        />
        <StatCard
          label="Critical incidents (open)"
          value={String(summary.criticalIncidents)}
          tone={summary.criticalIncidents > 0 ? "danger" : "default"}
        />
        <StatCard
          label="Overdue procedure acks"
          value={String(summary.overdueDirectiveAcks)}
          tone={summary.overdueDirectiveAcks > 0 ? "warning" : "default"}
        />
        <StatCard label="Open service tickets" value={String(summary.openTickets)} />
        <StatCard
          label="Tickets awaiting assignment"
          value={String(summary.unassignedTickets)}
          tone={summary.unassignedTickets > 0 ? "warning" : "default"}
        />
      </section>

      <HoWorkQueues data={summary} />

      <section>
        <h2 className="mb-4 text-base font-semibold text-[var(--foreground)]">
          Head Office tools
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <HoActionCard
            title="Publish HO procedure"
            desc="Issue a mandatory circular or SOP to all branches with acknowledgment deadline."
            href="/directives/new"
            cta="Publish now"
            show={hasPermission(session.role, Permission.DIRECTIVE_PUBLISH)}
          />
          <HoActionCard
            title="Knowledge & procedures"
            desc="Search published policies, track readership and branch acknowledgments."
            href="/directives"
            cta="Knowledge center"
          />
          <HoActionCard
            title="Service operations"
            desc="Assign tickets, update status, SLA tracking, and internal notes."
            href="/tickets"
            cta="Service ops center"
          />
          <HoActionCard
            title="Incident command"
            desc="National incident list with severity, SLA, attachments, and escalation."
            href="/incidents"
            cta="All incidents"
          />
          <HoActionCard
            title="National EOD oversight"
            desc="Approve and lock branch EOD submissions; analytics and alerts."
            href="/eod/oversight"
            cta="EOD oversight"
          />
          <HoActionCard
            title="Branch compliance table"
            desc="EOD, incidents, and directive acks per branch (same-day view)."
            href="/supervisor"
            cta="Compliance dashboard"
          />
          <HoActionCard
            title="Security console"
            desc="Active sessions and login activity across the platform."
            href="/security"
            cta="Security"
            show={hasPermission(session.role, Permission.SECURITY_VIEW)}
          />
          <HoActionCard
            title="Audit log export"
            desc="Compliance sampling and audit trail export."
            href="/audit"
            cta="Audit"
            show={hasPermission(session.role, Permission.AUDIT_VIEW)}
          />
          {hasPermission(session.role, Permission.ADMIN_USERS) ? (
            <HoActionCard
              title="User & branch admin"
              desc="Provision accounts and branch master data."
              href="/admin"
              cta="Admin console"
            />
          ) : null}
        </div>
      </section>
    </AppShell>
  );
}

function HoActionCard({
  title,
  desc,
  href,
  cta,
  show = true,
}: {
  title: string;
  desc: string;
  href: string;
  cta: string;
  show?: boolean;
}) {
  if (!show) return null;

  return (
    <article className="ho-card">
      <h3 className="ho-card-title">{title}</h3>
      <p className="ho-card-text mt-1">{desc}</p>
      <Link href={href} className="ho-card-link mt-4 inline-block">
        {cta} →
      </Link>
    </article>
  );
}
