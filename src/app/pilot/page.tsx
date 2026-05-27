import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { PilotDashboard } from "@/components/pilot/PilotDashboard";
import { getServerSession } from "@/lib/auth/server";
import { hasPermission, Permission } from "@/lib/rbac";
import { isBranchStaff } from "@/lib/roles/branch-staff";
import { computePilotKpis } from "@/lib/pilot/kpis";
import { listPilotFeedback } from "@/lib/pilot/feedback";
import { PILOT_KPI_TARGETS } from "@/lib/pilot/constants";
import { prisma } from "@/lib/prisma";

export default async function PilotPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const canView = hasPermission(session.role, Permission.PILOT_VIEW);
  const canSubmit = hasPermission(session.role, Permission.PILOT_FEEDBACK_CREATE);
  const staffOnly = isBranchStaff(session.role) && canSubmit && !canView;

  if (!canView && !canSubmit) {
    redirect("/dashboard");
  }

  const [kpis, feedback, pilotBranches] = await Promise.all([
    canView ? computePilotKpis(14) : null,
    canView ? listPilotFeedback() : [],
    prisma.branch.findMany({
      where: { isPilotBranch: true },
      orderBy: { branchCode: "asc" },
      select: { branchCode: true, name: true, district: true, region: true, isSmartBranch: true },
    }),
  ]);

  return (
    <AppShell user={session}>
      <PageHeader
        title={staffOnly ? "Pilot feedback" : "Pilot program"}
        description={
          staffOnly
            ? "Report rollout issues for your branch. HO and your supervisor review submissions."
            : `Smart branch trial · ${pilotBranches.length} pilot outlet${pilotBranches.length === 1 ? "" : "s"}`
        }
      />

      {canView && pilotBranches.length > 0 && (
        <section className="polished-card mb-8 rounded-[1.5rem] p-5 text-sm">
          <p className="font-medium text-[var(--brand-primary)]">Pilot branches</p>
          <ul className="mt-2 list-inside list-disc text-[var(--muted-foreground)]">
            {pilotBranches.map((b) => (
              <li key={b.branchCode}>
                {b.branchCode} — {b.name} ({b.region})
                {b.isSmartBranch ? " · Smart" : " · Traditional"}
              </li>
            ))}
          </ul>
        </section>
      )}

      {kpis && (
        <PilotDashboard
          kpis={kpis}
          feedback={feedback.map((f) => ({
            id: f.id,
            category: f.category,
            severity: f.severity,
            status: f.status,
            description: f.description,
            branch: f.branch,
            user: f.user,
            createdAt: f.createdAt.toISOString(),
          }))}
          canTriage={hasPermission(session.role, Permission.PILOT_FEEDBACK_TRIAGE)}
          canSubmitFeedback={canSubmit}
        />
      )}

      {!kpis && canSubmit && (
        <PilotDashboard
          kpis={{
            pilotBranchCount: pilotBranches.length,
            periodDays: 14,
            eodOnTimePercent: 0,
            eodTargetMet: true,
            directiveAckWithin72hPercent: 0,
            directiveTargetMet: true,
            incidentMedianResponseHours: null,
            incidentTargetMet: true,
            openSev1Count: 0,
            openSev1Over24h: 0,
            sev1TargetMet: true,
            targets: PILOT_KPI_TARGETS,
          }}
          feedback={[]}
          canTriage={false}
          canSubmitFeedback
          hideKpis
        />
      )}
    </AppShell>
  );
}
