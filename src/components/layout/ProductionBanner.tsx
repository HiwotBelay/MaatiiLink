export function ProductionBanner() {
  if (process.env.NODE_ENV !== "production") return null;

  return (
    <div role="status" className="app-production-banner">
      Production environment — changes are audited. Report issues via Pilot
      feedback or your supervisor.
    </div>
  );
}
