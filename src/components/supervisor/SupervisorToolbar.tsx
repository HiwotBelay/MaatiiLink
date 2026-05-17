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
    <div className="mb-6 flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-white p-4">
      <label className="text-sm">
        <span className="text-slate-600">District</span>
        <select
          id="filter-district"
          className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-sm"
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
          className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-sm"
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
        className="rounded-lg bg-[#00529b] px-4 py-2 text-sm font-medium text-white"
      >
        Export CSV
      </button>
    </div>
  );
}
