import { useState } from "react";

function Section({ title, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
      <h2 className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function PublicSidebar({
  search,
  onSearch,
  kategoriList,
  counts,
  total,
  selected,
  onSelect,
  cluster,
  onCluster,
  heatmap,
  onHeatmap,
  origin,
  nearest,
  limit,
  onLimit,
  onUseLocation,
  onGeocode,
  onClearOrigin,
}) {
  const filterItems = [
    { nama_kategori: "Semua", warna_marker: "#64748b" },
    ...kategoriList,
  ];
  const maxCount = Math.max(1, ...Object.values(counts));
  const [lokasiText, setLokasiText] = useState("");

  function submitLokasi(e) {
    e.preventDefault();
    onGeocode(lokasiText);
  }

  return (
    <aside className="nice-scroll flex w-80 shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-slate-50">
      <div className="flex-1 space-y-3 p-3">
        {/* Search */}
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            🔍
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Cari nama faskes…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm shadow-sm transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/25"
          />
        </div>

        {/* Filter kategori */}
        <Section title="Filter Kategori">
          <div className="space-y-1">
            {filterItems.map((k) => {
              const nama = k.nama_kategori;
              const jumlah = nama === "Semua" ? total : counts[nama] || 0;
              const active = selected === nama;
              return (
                <button
                  key={nama}
                  onClick={() => onSelect(nama)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                    active
                      ? "bg-teal-50 font-semibold text-teal-700 ring-1 ring-teal-200"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full ring-2 ring-white"
                      style={{
                        backgroundColor: k.warna_marker,
                        boxShadow: `0 0 0 1px ${k.warna_marker}33`,
                      }}
                    />
                    {nama}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      active
                        ? "bg-teal-600 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {jumlah}
                  </span>
                </button>
              );
            })}
          </div>
        </Section>

        {/* Tampilan peta */}
        <Section title="Tampilan Peta">
          <label className="flex cursor-pointer items-center justify-between rounded-lg px-1 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
            <span>🔵 Marker Cluster</span>
            <input
              type="checkbox"
              checked={cluster}
              onChange={(e) => onCluster(e.target.checked)}
              className="h-4 w-4 accent-teal-600"
            />
          </label>
          <label className="flex cursor-pointer items-center justify-between rounded-lg px-1 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
            <span>🔥 Heatmap Kepadatan</span>
            <input
              type="checkbox"
              checked={heatmap}
              onChange={(e) => onHeatmap(e.target.checked)}
              className="h-4 w-4 accent-teal-600"
            />
          </label>
        </Section>

        {/* Statistik */}
        <Section title={`Statistik · ${total} faskes`}>
          <div className="space-y-2.5">
            {kategoriList.map((k) => {
              const jumlah = counts[k.nama_kategori] || 0;
              return (
                <div key={k.nama_kategori} className="text-xs">
                  <div className="mb-1 flex justify-between">
                    <span className="text-slate-600">{k.nama_kategori}</span>
                    <span className="font-semibold text-slate-700">{jumlah}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${(jumlah / maxCount) * 100}%`,
                        backgroundColor: k.warna_marker,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        {/* Faskes terdekat */}
        <Section title="Faskes Terdekat">
          <form onSubmit={submitLokasi} className="mb-2 flex gap-1.5">
            <input
              value={lokasiText}
              onChange={(e) => setLokasiText(e.target.value)}
              placeholder="⌨️ Ketik alamat/lokasi…"
              className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/25"
            />
            <button
              type="submit"
              className="rounded-lg bg-teal-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-teal-700 active:scale-95"
            >
              Cari
            </button>
          </form>

          <button
            onClick={onUseLocation}
            className="w-full rounded-lg bg-teal-600 px-3 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-teal-700 active:scale-[0.98]"
          >
            📍 Gunakan Lokasi Saya (GPS)
          </button>
          <p className="mt-1.5 text-xs text-slate-400">
            atau <b className="text-slate-500">klik peta</b> untuk memilih titik asal.
          </p>

          <label className="mt-2.5 flex items-center justify-between gap-2 text-sm text-slate-600">
            <span>Jumlah hasil</span>
            <input
              type="number"
              min={1}
              max={20}
              value={limit}
              onChange={(e) => onLimit(Number(e.target.value))}
              className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-right"
            />
          </label>

          {origin && (
            <div className="mt-2.5 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 ring-1 ring-slate-100">
              <span>
                Titik asal: {origin.lat.toFixed(4)}, {origin.lon.toFixed(4)}
              </span>
              <button
                onClick={onClearOrigin}
                className="font-medium text-red-500 hover:underline"
              >
                hapus
              </button>
            </div>
          )}

          {nearest && nearest.length > 0 && (
            <ol className="mt-3 space-y-1.5">
              {nearest.map((f, i) => {
                const p = f.properties;
                return (
                  <li
                    key={p.id}
                    className="flex items-start justify-between gap-2 rounded-lg border border-slate-100 bg-white px-3 py-2 text-sm shadow-sm"
                  >
                    <span>
                      <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-teal-50 text-xs font-bold text-teal-700">
                        {i + 1}
                      </span>
                      {p.nama}
                      <span className="mt-0.5 block pl-7 text-xs text-slate-400">
                        {p.kategori}
                      </span>
                    </span>
                    <span className="whitespace-nowrap rounded-md bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-700">
                      {p.jarak_km} km
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </Section>
      </div>

      <p className="border-t border-slate-200 bg-white/60 p-3.5 text-[11px] leading-relaxed text-slate-400">
        Sumber data: Google Places API · Peta: OpenStreetMap
      </p>
    </aside>
  );
}
