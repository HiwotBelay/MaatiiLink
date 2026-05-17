import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { EodForm } from "@/components/eod/EodForm";
import { EodHistory } from "@/components/eod/EodHistory";
import { getServerSession } from "@/lib/auth/server";
import { defaultRouteForRole } from "@/lib/rbac";
import { hasPermission, Permission } from "@/lib/rbac";
import {
  canSubmitEod,
  getTodayEod,
  listEodReports,
} from "@/lib/eod/service";
import {
  getAddisDateString,
  isPastEodCutoff,
  parseReportDate,
} from "@/lib/eod/constants";
import { prisma } from "@/lib/prisma";

type PageProps = {
  searchParams: Promise<{ date?: string }>;
};

export default async function EodPage({ searchParams }: PageProps) {
  const session = await getServerSession();
  if (!session) redirect("/login");

  if (!hasPermission(session.role, Permission.EOD_VIEW_BRANCH)) {
    redirect(defaultRouteForRole(session.role));
  }

  if (["SUPERVISOR", "HO_ADMIN", "AUDITOR"].includes(session.role)) {
    redirect("/supervisor");
  }

  if (!session.branchId) {
    return (
      <AppShell user={session}>
        <p className="text-slate-600">Your account is not assigned to a branch.</p>
      </AppShell>
    );
  }

  const params = await searchParams;
  const todayStr = getAddisDateString();
  const targetDate = params.date ?? todayStr;

  const report =
    targetDate === todayStr
      ? await getTodayEod(session)
      : await prisma.eodReport.findUnique({
          where: {
            branchId_reportDate: {
              branchId: session.branchId,
              reportDate: parseReportDate(targetDate),
            },
          },
        });

  const history = await listEodReports(session, { days: 30 });

  const formData = {
    id: report?.id,
    reportDate: targetDate,
    status: report?.status ?? "DRAFT",
    openingCashBand: report?.openingCashBand ?? "",
    closingCashBand: report?.closingCashBand ?? "",
    anomalyNotes: report?.anomalyNotes ?? "",
    complaintCount: report?.complaintCount ?? 0,
    staffingNotes: report?.staffingNotes ?? "",
  };

  const readOnly = !hasPermission(session.role, Permission.EOD_DRAFT);
  const canSubmit = canSubmitEod(formData.status as "DRAFT", session.role);

  return (
    <AppShell user={session}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">End of day reporting</h1>
        <p className="text-slate-500">Digital EOD for your branch</p>
      </div>

      <div className="mb-10">
        <EodForm
          initial={formData}
          readOnly={readOnly}
          canSubmit={canSubmit}
          pastCutoff={isPastEodCutoff()}
        />
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold">History (30 days)</h2>
        <EodHistory
          reports={history.map((r) => ({
            id: r.id,
            reportDate: r.reportDate.toISOString().slice(0, 10),
            status: r.status,
            submittedAt: r.submittedAt?.toISOString() ?? null,
          }))}
        />
      </section>
    </AppShell>
  );
}
