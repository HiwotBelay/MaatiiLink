import Link from "next/link";
import type { getHoDashboardSummary } from "@/lib/ho/dashboard-summary";

type Summary = Awaited<ReturnType<typeof getHoDashboardSummary>>;

export function HoWorkQueues({ data }: { data: Summary }) {
  return (
    <section className="mb-10 grid gap-6 lg:grid-cols-3">
      <QueuePanel
        title="Unassigned service tickets"
        empty="No open unassigned tickets."
        href="/tickets"
        linkLabel="Open service ops center"
        count={data.unassignedTicketRows.length}
      >
        {data.unassignedTicketRows.map((t) => (
          <li key={t.id}>
            <span className="ho-card-item-title">{t.ticketRef}</span>
            <span className="ho-card-item-meta block">
              {t.branch.branchCode} — {t.branch.name}
            </span>
            <span className="ho-card-item-meta">{t.title}</span>
          </li>
        ))}
      </QueuePanel>

      <QueuePanel
        title="Critical incidents (open)"
        empty="No open critical incidents."
        href="/incidents"
        linkLabel="Incident command center"
        count={data.criticalIncidentRows.length}
      >
        {data.criticalIncidentRows.map((i) => (
          <li key={i.id}>
            <span className="ho-card-item-title">{i.title}</span>
            <span className="ho-card-item-meta block">
              {i.branch.branchCode} — {i.branch.name}
            </span>
          </li>
        ))}
      </QueuePanel>

      <QueuePanel
        title="Branches — EOD missing / late"
        empty="All branches submitted on time today."
        href="/eod/oversight"
        linkLabel="National EOD oversight"
        count={data.lateEodBranches.length}
      >
        {data.lateEodBranches.map((b) => (
          <li key={b.branchId}>
            <span className="ho-card-item-title">{b.name}</span>
            <span className="ho-card-item-meta block">{b.branchCode}</span>
            <span className="ho-badge-missing">{b.eodStatus}</span>
          </li>
        ))}
      </QueuePanel>
    </section>
  );
}

function QueuePanel({
  title,
  empty,
  href,
  linkLabel,
  count,
  children,
}: {
  title: string;
  empty: string;
  href: string;
  linkLabel: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <article className="ho-card">
      <h2 className="ho-card-kicker">{title}</h2>
      <ul className="mt-3 space-y-3 text-sm">
        {count > 0 ? children : <li className="ho-card-text">{empty}</li>}
      </ul>
      <Link href={href} className="ho-card-link mt-4 inline-block">
        {linkLabel} →
      </Link>
    </article>
  );
}
