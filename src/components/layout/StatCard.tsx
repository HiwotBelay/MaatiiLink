type Props = {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "warning" | "danger" | "success";
};

const toneClass: Record<NonNullable<Props["tone"]>, string> = {
  default: "",
  warning: "stat-card-warning",
  danger: "stat-card-danger",
  success: "stat-card-success",
};

export function StatCard({ label, value, hint, tone = "default" }: Props) {
  return (
    <article className={`stat-card ${toneClass[tone]}`}>
      <p className="stat-card-label">{label}</p>
      <p className="stat-card-value">{value}</p>
      {hint ? <p className="stat-card-hint">{hint}</p> : null}
    </article>
  );
}
