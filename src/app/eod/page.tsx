import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { RoleGuideBanner } from "@/components/layout/RoleGuideBanner";
import { EodOpsForm, type EodOpsFormData } from "@/components/eod/EodOpsForm";
import { isBranchManager, isBranchStaff } from "@/lib/roles/branch-staff";
import { EodCockpitHeader } from "@/components/eod/EodCockpitHeader";
import { EodAlertsPanel } from "@/components/eod/EodAlertsPanel";
import { EodHistory } from "@/components/eod/EodHistory";
import { getServerSession } from "@/lib/auth/server";
import { defaultRouteForRole, hasPermission, Permission } from "@/lib/rbac";
import {
  canSubmitEod,
  ensureTodayEod,
  getTodayEod,
  listEodReports,
} from "@/lib/eod/service";
import { getAddisDateString, parseReportDate } from "@/lib/eod/constants";
import { prisma } from "@/lib/prisma";
import { resolveReportingWindow, computeDueAt } from "@/lib/eod/window";

type PageProps = {
  searchParams: Promise<{ date?: string }>;
};

type EodReportRow = NonNullable<Awaited<ReturnType<typeof getTodayEod>>>;

function toFormData(report: EodReportRow | null, targetDate: string): EodOpsFormData {
  return {
    id: report?.id,
    reportDate: targetDate,
    status: report?.status ?? "PENDING",
    dueAt: report?.dueAt?.toISOString() ?? null,
    complianceScore: report?.complianceScore ?? null,
    openingCashBand: report?.openingCashBand ?? "",
    closingCashBand: report?.closingCashBand ?? "",
    cashInflowBand: report?.cashInflowBand ?? report?.openingCashBand ?? "",
    cashOutflowBand: report?.cashOutflowBand ?? report?.closingCashBand ?? "",
    liquidityStatus: report?.liquidityStatus ?? "",
    complaintCount: report?.complaintCount ?? 0,
    staffingIssues: report?.staffingIssues ?? "",
    atmDowntimeMinutes: report?.atmDowntimeMinutes ?? 0,
    systemDowntimeMinutes: report?.systemDowntimeMinutes ?? 0,
    operationalBlockers: report?.operationalBlockers ?? "",
    securityConcerns: report?.securityConcerns ?? "",
    highValueTransactionNotes: report?.highValueTransactionNotes ?? "",
    performanceNotes: report?.performanceNotes ?? "",
    anomalyNotes: report?.anomalyNotes ?? "",
  };
}

export default async function EodPage({ searchParams }: PageProps) {
  const session = await getServerSession();
  if (!session) redirect("/login");

  if (
    hasPermission(session.role, Permission.EOD_VIEW_ALL) &&
    !hasPermission(session.role, Permission.EOD_VIEW_BRANCH)
  ) {
    redirect("/eod/oversight");
  }

  if (!hasPermission(session.role, Permission.EOD_VIEW_BRANCH)) {
    redirect(defaultRouteForRole(session.role));
  }

  if (!session.branchId) {
    return (
      <AppShell user={session}>
        <p className="text-[var(--muted-foreground)]">
          Your account is not assigned to a branch.
        </p>
      </AppShell>
    );
  }

  const params = await searchParams;
  const todayStr = getAddisDateString();
  const targetDate = params.date ?? todayStr;

  const branch = await prisma.branch.findUnique({
    where: { id: session.branchId },
    select: { name: true, branchCode: true },
  });

  let report =
    targetDate === todayStr
      ? await getTodayEod(session)
      : await prisma.eodReport.findUnique({
          where: {
            branchId_reportDate: {
              branchId: session.branchId,
              reportDate: parseReportDate(targetDate),
            },
          },
          include: {
            branch: { select: { name: true, branchCode: true, region: true } },
            submittedBy: { select: { name: true } },
            reviewedBy: { select: { name: true } },
          },
        });

  if (targetDate === todayStr && !report && hasPermission(session.role, Permission.EOD_DRAFT)) {
    const win = await resolveReportingWindow(session.branchId);
    const dueAt = computeDueAt(todayStr, win);
    report = await ensureTodayEod(session);
    if (report && !report.dueAt) {
      report = await prisma.eodReport.update({
        where: { id: report.id },
        data: { dueAt },
        include: {
          branch: { select: { name: true, branchCode: true, region: true } },
          submittedBy: { select: { name: true } },
          reviewedBy: { select: { name: true } },
        },
      });
    }
  }

  const history = await listEodReports(session, { days: 30 });
  const formData = toFormData(report, targetDate);
  const readOnly = !hasPermission(session.role, Permission.EOD_DRAFT);
  const canSubmit = canSubmitEod(formData.status as "PENDING", session.role);

  const branchLabel = branch
    ? `${branch.branchCode} — ${branch.name}`
    : undefined;

  return (
    <AppShell user={session} branchLabel={branchLabel}>
      <PageHeader
        title={
          isBranchStaff(session.role)
            ? "End of day (view only)"
            : isBranchManager(session.role)
              ? "End of day reporting"
              : "Operations cockpit"
        }
        description={
          isBranchStaff(session.role)
            ? "Branch manager prepares and submits EOD · you can review status and history"
            : isBranchManager(session.role)
              ? "Complete all sections, save draft during the day, and submit before the Addis Ababa cut-off"
              : "Smart branch daily reporting · configurable windows · supervisor review"
        }
      />

      {isBranchStaff(session.role) && <RoleGuideBanner role={session.role} variant="staff" />}
      {isBranchManager(session.role) && <RoleGuideBanner role={session.role} variant="manager" />}

      <div className="eod-cockpit-layout">
        <div className="eod-cockpit-main">
          <div className="eod-cockpit-card">
            <EodCockpitHeader
              reportDate={targetDate}
              status={formData.status}
              dueAt={formData.dueAt}
              complianceScore={formData.complianceScore}
              branchLabel={branchLabel}
            />
            <EodOpsForm
              initial={formData}
              readOnly={readOnly}
              canSubmit={canSubmit}
              managerMode={isBranchManager(session.role)}
            />
          </div>

          <section className="mt-8">
            <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">
              Report history
            </h2>
            <EodHistory
              reports={history.map((r) => ({
                id: r.id,
                reportDate: r.reportDate.toISOString().slice(0, 10),
                status: r.status,
                submittedAt: r.submittedAt?.toISOString() ?? null,
                complianceScore: r.complianceScore,
              }))}
            />
          </section>
        </div>

        <aside className="eod-cockpit-rail">
          <EodAlertsPanel branchId={session.branchId} />
        </aside>
      </div>
    </AppShell>
  );
}
