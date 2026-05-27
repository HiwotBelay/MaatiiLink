export default function DashboardLoading() {
  return (
    <div className="app-content" aria-busy="true" aria-label="Loading dashboard">
      <div className="dashboard-loading">
        <div className="dashboard-loading-bar" />
        <p className="text-sm text-[var(--muted-foreground)]">Loading dashboard…</p>
      </div>
    </div>
  );
}
