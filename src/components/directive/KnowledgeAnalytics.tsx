"use client";

import { useEffect, useState } from "react";
import { CATEGORY_LABELS } from "@/lib/directive/constants";
import type { DirectiveCategory } from "@prisma/client";

type Analytics = {
  unreadMandatory: number;
  unreadAll: number;
  acknowledgmentRatePercent: number;
  overdueAcknowledgments: number;
  mandatoryCount: number;
  totalPublished: number;
  byCategory: { category: string; count: number }[];
};

export function KnowledgeAnalytics() {
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    void fetch("/api/directives/analytics")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) setData(j.analytics);
      });
  }, []);

  if (!data) return null;

  return (
    <section className="knowledge-analytics">
      <h2 className="knowledge-section-title">Compliance & readership</h2>
      <div className="knowledge-analytics-kpis">
        <div className="knowledge-kpi">
          <span className="knowledge-kpi-value">{data.unreadMandatory}</span>
          <span className="knowledge-kpi-label">Unread mandatory</span>
        </div>
        <div className="knowledge-kpi">
          <span className="knowledge-kpi-value">{data.acknowledgmentRatePercent}%</span>
          <span className="knowledge-kpi-label">Acknowledgment rate</span>
        </div>
        <div className="knowledge-kpi knowledge-kpi-warn">
          <span className="knowledge-kpi-value">{data.overdueAcknowledgments}</span>
          <span className="knowledge-kpi-label">Overdue acks</span>
        </div>
        <div className="knowledge-kpi">
          <span className="knowledge-kpi-value">{data.totalPublished}</span>
          <span className="knowledge-kpi-label">Published procedures</span>
        </div>
      </div>
      {data.byCategory.length > 0 && (
        <div className="knowledge-panel knowledge-category-breakdown">
          <h3 className="knowledge-panel-subtitle">By category</h3>
          <ul className="knowledge-category-list">
            {data.byCategory.map((c) => (
              <li key={c.category}>
                <span>
                  {CATEGORY_LABELS[c.category as DirectiveCategory] ?? c.category}
                </span>
                <span>{c.count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
