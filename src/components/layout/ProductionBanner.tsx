export function ProductionBanner() {
  if (process.env.NODE_ENV !== "production") return null;

  return (
    <div
      role="status"
      className="border-b border-amber-300 bg-amber-50 px-4 py-2 text-center text-xs font-medium text-amber-950"
    >
      Production environment — changes are audited. Report issues via Pilot feedback or
      your supervisor.
    </div>
  );
}
