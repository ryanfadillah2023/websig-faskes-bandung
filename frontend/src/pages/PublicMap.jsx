import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import MapView from "../components/MapView.jsx";
import PublicSidebar from "../components/PublicSidebar.jsx";
import { useFaskes } from "../hooks/useFaskes.js";
import { getTerdekat, getRoute, geocode } from "../api.js";
import { isAuthed } from "../auth.js";

function gmapsUrl(origin, dest) {
  const o = origin ? `&origin=${origin.lat},${origin.lon}` : "";
  return `https://www.google.com/maps/dir/?api=1${o}&destination=${dest.lat},${dest.lon}&travelmode=driving`;
}

export default function PublicMap() {
  const { kategoriList, allFaskes, counts, loading, error } = useFaskes();

  const [selected, setSelected] = useState("Semua");
  const [search, setSearch] = useState("");
  const [showCluster, setShowCluster] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [origin, setOrigin] = useState(null);
  const [nearest, setNearest] = useState(null);
  const [limit, setLimit] = useState(5);
  const [route, setRoute] = useState(null);
  const [routing, setRouting] = useState(false);
  const [focus, setFocus] = useState(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allFaskes.filter((f) => {
      const okKat = selected === "Semua" || f.properties.kategori === selected;
      const okQ = !q || f.properties.nama.toLowerCase().includes(q);
      return okKat && okQ;
    });
  }, [allFaskes, selected, search]);

  async function cariTerdekat(point) {
    try {
      const fc = await getTerdekat(point.lat, point.lon, limit, selected);
      setNearest(fc.features);
    } catch (e) {
      alert(e.message);
    }
  }

  function handleMapClick(latlng) {
    setOrigin(latlng);
    cariTerdekat(latlng);
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      alert("Browser tidak mendukung geolokasi. Klik peta untuk memilih titik.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const o = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        setOrigin(o);
        setFocus({ ...o });
        cariTerdekat(o);
      },
      () => alert("Gagal mengambil lokasi. Klik peta untuk memilih titik manual.")
    );
  }

  async function geocodeLocation(query) {
    if (!query.trim()) return;
    try {
      const pt = await geocode(query);
      const o = { lat: pt.lat, lon: pt.lon };
      setOrigin(o);
      setFocus({ ...o });
      cariTerdekat(o);
    } catch (e) {
      alert(e.message);
    }
  }

  function clearOrigin() {
    setOrigin(null);
    setNearest(null);
    setRoute(null);
  }

  async function requestRoute(dest) {
    if (!origin) {
      alert(
        "Tentukan lokasi Anda dulu: klik '📍 Gunakan Lokasi Saya' atau klik peta."
      );
      return;
    }
    setRouting(true);
    try {
      const r = await getRoute(origin, dest);
      setRoute({ ...r, destName: dest.nama, dest });
    } catch (e) {
      alert(e.message);
    } finally {
      setRouting(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 px-5 py-3.5 text-white shadow-md">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-2xl ring-1 ring-white/25 backdrop-blur">
          🏥
        </div>
        <div>
          <h1 className="text-lg font-bold leading-tight tracking-tight">
            WebSIG Fasilitas Kesehatan Kota Bandung
          </h1>
          <p className="text-xs text-teal-50/90">
            Peta interaktif sebaran faskes berbasis PostGIS &amp; Leaflet
          </p>
        </div>
        {/* Tombol Admin hanya tampil bila sudah login — publik tidak melihatnya */}
        {isAuthed() && (
          <Link
            to="/admin"
            className="ml-auto rounded-lg bg-white/15 px-3.5 py-2 text-sm font-medium ring-1 ring-white/25 backdrop-blur transition hover:bg-white/25"
          >
            🛠️ Dashboard Admin
          </Link>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        <PublicSidebar
          search={search}
          onSearch={setSearch}
          kategoriList={kategoriList}
          counts={counts}
          total={allFaskes.length}
          selected={selected}
          onSelect={setSelected}
          cluster={showCluster}
          onCluster={setShowCluster}
          heatmap={showHeatmap}
          onHeatmap={setShowHeatmap}
          origin={origin}
          nearest={nearest}
          limit={limit}
          onLimit={setLimit}
          onUseLocation={useMyLocation}
          onGeocode={geocodeLocation}
          onClearOrigin={clearOrigin}
        />

        <main className="relative flex-1">
          {loading && (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-500">
              <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-slate-200 border-t-teal-600" />
              Memuat data faskes…
            </div>
          )}
          {error && (
            <div className="flex h-full items-center justify-center p-6 text-center text-red-600">
              Gagal terhubung ke API ({error}).
              <br />
              Pastikan backend berjalan di http://localhost:4000.
            </div>
          )}
          {!loading && !error && (
            <MapView
              faskes={filtered}
              origin={origin}
              nearest={nearest}
              mode="explore"
              cluster={showCluster}
              heatmap={showHeatmap}
              onMapClick={handleMapClick}
              route={route}
              onRouteRequest={requestRoute}
              focus={focus}
            />
          )}

          {routing && (
            <div className="absolute left-1/2 top-3 z-[1000] -translate-x-1/2 rounded-lg bg-white px-4 py-2 text-sm shadow-lg">
              Menghitung rute…
            </div>
          )}

          {route && (
            <div className="absolute left-1/2 top-3 z-[1000] flex -translate-x-1/2 items-center gap-3 rounded-lg bg-white px-4 py-2 text-sm shadow-lg">
              <span>
                🚗 <b>{route.destName}</b>
                <span className="ml-2 text-gray-600">
                  {route.distanceKm.toFixed(1)} km · ± {Math.round(route.durationMin)} menit
                </span>
              </span>
              <a
                href={gmapsUrl(origin, route.dest)}
                target="_blank"
                rel="noreferrer"
                className="rounded-md bg-teal-600 px-2 py-1 text-xs font-medium text-white hover:bg-teal-700"
              >
                🗺️ Google Maps
              </a>
              <button
                onClick={() => setRoute(null)}
                className="text-gray-400 hover:text-red-600"
                title="Tutup rute"
              >
                ✕
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
