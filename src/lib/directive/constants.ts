import type { DirectiveCategory, DirectivePriority } from "@prisma/client";

export const DIRECTIVE_CATEGORIES: readonly DirectiveCategory[] = [
  "CASH_OPERATIONS",
  "LOAN_PROCEDURES",
  "COMPLIANCE",
  "TREASURY",
  "SECURITY",
  "CUSTOMER_OPERATIONS",
  "ATM_OPERATIONS",
  "EMERGENCY_PROCEDURES",
] as const;

export const CATEGORY_LABELS: Record<DirectiveCategory, string> = {
  CASH_OPERATIONS: "Cash Operations",
  LOAN_PROCEDURES: "Loan Procedures",
  COMPLIANCE: "Compliance",
  TREASURY: "Treasury",
  SECURITY: "Security",
  CUSTOMER_OPERATIONS: "Customer Operations",
  ATM_OPERATIONS: "ATM Operations",
  EMERGENCY_PROCEDURES: "Emergency Procedures",
};

export const DIRECTIVE_PRIORITIES: readonly DirectivePriority[] = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
] as const;

export const PRIORITY_LABELS: Record<DirectivePriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

export const RECENT_DAYS = 14;

/** Quick operational lookup — applies search filters in the knowledge hub UI */
export const QUICK_LOOKUPS = [
  {
    id: "large-cash",
    title: "Large cash withdrawal",
    description: "Verification, limits, and dual control",
    query: "large cash withdrawal",
    category: "CASH_OPERATIONS" as DirectiveCategory,
  },
  {
    id: "loan-approval",
    title: "Loan approval steps",
    description: "Credit check through disbursement",
    query: "loan approval",
    category: "LOAN_PROCEDURES" as DirectiveCategory,
  },
  {
    id: "fraud-escalation",
    title: "Fraud escalation",
    description: "Report, contain, and escalate",
    query: "fraud escalation",
    category: "SECURITY" as DirectiveCategory,
  },
  {
    id: "atm-outage",
    title: "ATM outage response",
    description: "Downtime, cash cycle, customer comms",
    query: "ATM outage",
    category: "ATM_OPERATIONS" as DirectiveCategory,
  },
] as const;
