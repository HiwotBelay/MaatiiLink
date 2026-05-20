import type { PrismaClient, DirectiveCategory, DirectivePriority } from "@prisma/client";

type DirectiveSeed = {
  title: string;
  summary: string;
  body: string;
  category: DirectiveCategory;
  priority: DirectivePriority;
  keywords: string[];
  isCritical?: boolean;
  isPinned?: boolean;
  isMandatory?: boolean;
  isSop?: boolean;
  daysUntilDeadline?: number;
};

/**
 * Operational knowledge base — structured HO procedures by area.
 * Replace or extend via Head Office → Publish (/directives/new) with official circulars.
 */
const DIRECTIVES: DirectiveSeed[] = [
  {
    title: "HO-2026-001: Large cash withdrawal verification",
    summary: "Dual control and ID rules for withdrawals above ETB 200,000.",
    category: "CASH_OPERATIONS",
    priority: "HIGH",
    keywords: ["cash", "withdrawal", "large", "dual control", "kyc"],
    isPinned: true,
    isMandatory: true,
    isSop: true,
    daysUntilDeadline: 7,
    body: `Applies to all branches — Cooperative Bank of Oromia.

1. Verify customer identity against valid kebele ID, passport, or Fayda (when available).
2. Withdrawals above ETB 200,000 require Branch Manager approval and second officer verification.
3. Record purpose of withdrawal in the transaction log; flag structuring patterns to Compliance.
4. Cash must be counted in customer presence; bundle using branch strap standards.
5. Same-day notification to district supervisor if cumulative daily withdrawals exceed ETB 500,000 per customer.

Escalation: suspected fraud → Incident (CRITICAL) + call district supervisor immediately.`,
  },
  {
    title: "HO-2026-002: End-of-day cash balancing",
    summary: "Vault count, band reporting, and variance escalation before 18:00 EAT.",
    category: "CASH_OPERATIONS",
    priority: "CRITICAL",
    keywords: ["eod", "cash", "vault", "balancing", "variance"],
    isMandatory: true,
    isSop: true,
    daysUntilDeadline: 3,
    body: `1. Complete physical cash count by 17:30 Addis Ababa time.
2. Submit digital EOD in MaatiiLink before cut-off (default 18:00 EAT).
3. Variances above ETB 500 must be documented in anomaly notes and reported to supervisor same day.
4. Do not leave vault unsecured during count; minimum two staff for smart branches.`,
  },
  {
    title: "HO-2026-010: Consumer loan disbursement checklist",
    summary: "Steps from approved credit memo to fund release.",
    category: "LOAN_PROCEDURES",
    priority: "HIGH",
    keywords: ["loan", "disbursement", "credit", "collateral"],
    isMandatory: true,
    isSop: true,
    daysUntilDeadline: 14,
    body: `1. Confirm loan approval in core banking matches MaatiiLink customer file.
2. Verify collateral documentation is complete and scanned per credit policy.
3. Obtain branch manager sign-off before transfer.
4. Disbursement only to named borrower account; no third-party release without HO Legal approval.
5. Log disbursement reference in branch daily log.`,
  },
  {
    title: "HO-2026-011: Overdue retail loan follow-up",
    summary: "Contact sequence and restructuring referral rules.",
    category: "LOAN_PROCEDURES",
    priority: "MEDIUM",
    keywords: ["loan", "npl", "collection", "restructuring"],
    isSop: true,
    body: `1. Day 1–30 overdue: branch call + SMS per approved script.
2. Day 31–60: manager visit with documented outcome.
3. Day 61+: escalate to district credit unit; do not promise terms outside HO policy.
4. Report threats or harassment incidents via MaatiiLink Incidents.`,
  },
  {
    title: "HO-2026-020: AML suspicious transaction reporting",
    summary: "When and how branches file STR-related internal reports.",
    category: "COMPLIANCE",
    priority: "CRITICAL",
    keywords: ["aml", "str", "compliance", "suspicious"],
    isPinned: true,
    isCritical: true,
    isMandatory: true,
    daysUntilDeadline: 5,
    body: `1. Do not tip off the customer.
2. Complete internal suspicious activity form within 24 hours of detection.
3. Notify Compliance Officer via incident (category SECURITY) with transaction references.
4. Preserve CCTV and teller logs for 90 days.
5. HO Compliance will coordinate with NBE reporting timelines — branches do not file externally alone.`,
  },
  {
    title: "HO-2026-021: KYC refresh for high-risk accounts",
    summary: "Annual and trigger-based KYC updates.",
    category: "COMPLIANCE",
    priority: "HIGH",
    keywords: ["kyc", "cdd", "pep", "compliance"],
    isMandatory: true,
    body: `Trigger events: change of address, unusual volume, PEP match, lost ID.
Complete refreshed KYC pack before processing high-value transactions.
PEP accounts require HO Compliance pre-approval.`,
  },
  {
    title: "HO-2026-030: Daily liquidity position reporting",
    summary: "Branch surplus/deficit reporting to treasury by 10:00 EAT.",
    category: "TREASURY",
    priority: "MEDIUM",
    keywords: ["treasury", "liquidity", "cash position"],
    isSop: true,
    body: `1. Report opening cash position in EOD module (cash bands).
2. Request cash-in-transit before 14:00 for next-day shortages forecast > ETB 2M.
3. Excess cash above branch limit: schedule armored collection via service desk ticket (CASH_LOGISTICS).`,
  },
  {
    title: "HO-2026-040: Branch physical security after hours",
    summary: "Alarm, vault, and key control.",
    category: "SECURITY",
    priority: "HIGH",
    keywords: ["security", "vault", "alarm", "keys"],
    isMandatory: true,
    isSop: true,
    daysUntilDeadline: 10,
    body: `1. Two-person rule for vault access outside customer hours.
2. Test alarm before closing; log faults as URGENT service ticket.
3. Report break-in or attempted access as CRITICAL incident immediately.`,
  },
  {
    title: "HO-2026-041: Fraud attempt escalation",
    summary: "Containment steps for suspected fraud at teller line.",
    category: "SECURITY",
    priority: "CRITICAL",
    keywords: ["fraud", "escalation", "security", "scam"],
    isPinned: true,
    isCritical: true,
    isMandatory: true,
    body: `1. Stall transaction politely; notify manager without alerting suspect if unsafe.
2. Preserve documents and device evidence.
3. Open MaatiiLink incident — severity CRITICAL — within 15 minutes.
4. Supervisor notifies HO Security distribution list.`,
  },
  {
    title: "HO-2026-050: Account opening — resident individuals",
    summary: "Minimum KYC pack and product eligibility.",
    category: "CUSTOMER_OPERATIONS",
    priority: "MEDIUM",
    keywords: ["account opening", "kyc", "customer", "onboarding"],
    isSop: true,
    body: `Required: application form, valid ID, photograph, TIN (if applicable), proof of address.
Smart branches may use digital capture; traditional branches scan within 48 hours.
Reject incomplete packs — do not pre-activate mobile banking until HO rules satisfied.`,
  },
  {
    title: "HO-2026-051: Customer complaint handling",
    summary: "Log, resolve, and escalate complaints within SLA.",
    category: "CUSTOMER_OPERATIONS",
    priority: "MEDIUM",
    keywords: ["complaint", "customer", "service", "sla"],
    body: `1. Log complaint in branch register same day.
2. Resolve within 3 business days or escalate to district manager.
3. Repeat complaints on same issue → service desk ticket to HO Customer Operations.`,
  },
  {
    title: "HO-2026-060: ATM cash-out and downtime",
    summary: "Response when ATM is empty or offline > 30 minutes.",
    category: "ATM_OPERATIONS",
    priority: "HIGH",
    keywords: ["atm", "outage", "cash-out", "downtime"],
    isMandatory: true,
    isSop: true,
    daysUntilDeadline: 7,
    body: `1. Place out-of-service signage; redirect customers politely.
2. Log downtime minutes in branch EOD (system downtime field).
3. Open service ticket — category IT or CASH_LOGISTICS per root cause.
4. Replenishment: follow armored car schedule; do not open ATM without certified technician.`,
  },
  {
    title: "HO-2026-070: Power outage and business continuity",
    summary: "Generator, manual operations, and HO notification.",
    category: "EMERGENCY_PROCEDURES",
    priority: "CRITICAL",
    keywords: ["power", "outage", "bcp", "emergency", "generator"],
    isPinned: true,
    isCritical: true,
    isMandatory: true,
    daysUntilDeadline: 5,
    body: `1. Outage > 30 min: activate branch BCP checklist (posted in branch).
2. Limit high-value transactions if core banking unavailable.
3. Notify district supervisor and open incident if outage > 2 hours.
4. Record customer impact in EOD anomaly notes.`,
  },
  {
    title: "HO-2026-071: Civil unrest near branch premises",
    summary: "Staff safety and temporary closure authority.",
    category: "EMERGENCY_PROCEDURES",
    priority: "CRITICAL",
    keywords: ["unrest", "closure", "safety", "emergency"],
    isCritical: true,
    isMandatory: true,
    body: `1. Staff safety first — close branch if local authority or supervisor instructs.
2. Secure vault; armored collection only when cleared by HO Security.
3. Report status via supervisor dashboard; HO will communicate to regional CEOs.`,
  },
];

function deadlineFromNow(days: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(23, 59, 59, 0);
  return d;
}

export async function seedDirectives(
  prisma: PrismaClient,
  publisherId: string,
): Promise<number> {
  let created = 0;

  for (const item of DIRECTIVES) {
    const existing = await prisma.directive.findFirst({
      where: { title: item.title },
    });
    if (existing) continue;

    await prisma.directive.create({
      data: {
        title: item.title,
        summary: item.summary,
        body: item.body,
        category: item.category,
        priority: item.priority,
        keywords: item.keywords,
        isCritical: item.isCritical ?? item.priority === "CRITICAL",
        isPinned: item.isPinned ?? false,
        isMandatory: item.isMandatory ?? false,
        isSop: item.isSop ?? false,
        deadlineAt: item.daysUntilDeadline
          ? deadlineFromNow(item.daysUntilDeadline)
          : null,
        publishedById: publisherId,
      },
    });
    created += 1;
  }

  return created;
}
