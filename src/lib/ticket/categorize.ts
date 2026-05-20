import type { TicketCategory } from "@prisma/client";

const RULES: { category: TicketCategory; patterns: RegExp[] }[] = [
  {
    category: "NETWORK_OPERATIONS",
    patterns: [
      /\bnetwork\b/i,
      /\bwan\b/i,
      /\blan\b/i,
      /\bconnectivity\b/i,
      /\brouter\b/i,
      /\bswitch\b/i,
    ],
  },
  {
    category: "SECURITY_OPERATIONS",
    patterns: [
      /\bsecurity\b/i,
      /\bbreach\b/i,
      /\baccess control\b/i,
      /\balarm\b/i,
      /\bcctv\b/i,
      /\bintrusion\b/i,
    ],
  },
  {
    category: "CASH_LOGISTICS",
    patterns: [
      /\bcash\b/i,
      /\bvault\b/i,
      /\barmored\b/i,
      /\bdenomination\b/i,
      /\bcit\b/i,
      /\batm cash\b/i,
    ],
  },
  {
    category: "FACILITIES",
    patterns: [
      /\bfacilit/i,
      /\bhvac\b/i,
      /\bplumb/i,
      /\belectric/i,
      /\bbuilding\b/i,
      /\bgenerator\b/i,
    ],
  },
  {
    category: "IT",
    patterns: [
      /\bit\b/i,
      /\bsoftware\b/i,
      /\bhardware\b/i,
      /\blaptop\b/i,
      /\bprinter\b/i,
      /\bemail\b/i,
      /\bpassword\b/i,
    ],
  },
];

export function suggestCategory(
  title: string,
  description: string,
): TicketCategory {
  const text = `${title} ${description}`;
  for (const rule of RULES) {
    if (rule.patterns.some((p) => p.test(text))) return rule.category;
  }
  return "IT";
}

export function suggestTags(title: string, description: string): string[] {
  const text = `${title} ${description}`.toLowerCase();
  const tags = new Set<string>();
  const keywords = [
    "atm",
    "network",
    "cash",
    "security",
    "urgent",
    "outage",
    "printer",
    "email",
  ];
  for (const k of keywords) {
    if (text.includes(k)) tags.add(k);
  }
  return [...tags].slice(0, 8);
}
