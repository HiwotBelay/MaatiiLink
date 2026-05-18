"use client";

type Props = {
  districts: string[];
  regions: string[];
};

export function SupervisorToolbar({ districts, regions }: Props) {
  function exportCsv() {
    const district = (document.getElementById("filter-district") as HTMLSelectElement)
      ?.value;
    const region = (document.getElementById("filter-region") as HTMLSelectElement)?.value;
    const params = new URLSearchParams();
    if (district) params.set("district", district);
    if (region) params.set("region", region);
    const q = params.toString();
    window.location.href = `/api/supervisor/export${q ? `?${q}` : ""}`;
  }

  return (
    <div className="polished-card mb-6 flex flex-wrap items-end gap-4 rounded-[1.5rem] p-4">
      <label className="text-sm">
        <span className="text-slate-600">District</span>
        <select
          id="filter-district"
          className="field-control mt-1 block w-auto min-w-40"
          defaultValue=""
        >
          <option value="">All</option>
          {districts.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm">
        <span className="text-slate-600">Region</span>
        <select
          id="filter-region"
          className="field-control mt-1 block w-auto min-w-40"
          defaultValue=""
        >
          <option value="">All</option>
          {regions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        onClick={exportCsv}
        className="btn-primary px-4 py-2 text-sm"
      >
        Export CSV
      </button>
    </div>
  );
}
