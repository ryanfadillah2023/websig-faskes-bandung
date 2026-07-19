import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MapView from "../components/MapView.jsx";
import AdminSidebar from "../components/AdminSidebar.jsx";
import { useFaskes } from "../hooks/useFaskes.js";
import { createFaskes, deleteFaskes, bulkCreateFaskes } from "../api.js";
import { logout } from "../auth.js";

export default function AdminDashboard() {
  const { kategoriList, allFaskes, loading, error, reloadFaskes } = useFaskes();
  const [draft, setDraft] = useState(null);
  const navigate = useNavigate();

  function handleMapClick(latlng) {
    setDraft(latlng);
  }

  async function submitFaskes(data) {
    await createFaskes(data);
    await reloadFaskes();
    setDraft(null);
  }

  async function removeFaskes(id) {
    if (!confirm("Hapus data faskes ini?")) return;
    try {
      await deleteFaskes(id);
      await reloadFaskes();
    } catch (e) {
      alert(e.message);
    }
  }

  async function bulkImport(rows) {
    const res = await bulkCreateFaskes(rows);
    await reloadFaskes();
    return res;
  }

  function keluar() {
    logout();
    navigate("/", { replace: true });
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 bg-gradient-to-r from-amber-600 to-orange-500 px-5 py-3.5 text-white shadow-md">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-2xl ring-1 ring-white/25 backdrop-blur">
          🛠️
        </div>
        <div>
          <h1 className="text-lg font-bold leading-tight tracking-tight">
            Dashboard Admin — WebSIG Faskes Bandung
          </h1>
          <p className="text-xs text-amber-50/90">
            Tambah &amp; kelola data fasilitas kesehatan
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/"
            className="rounded-lg bg-white/15 px-3.5 py-2 text-sm font-medium ring-1 ring-white/25 backdrop-blur transition hover:bg-white/25"
          >
            🗺️ Peta Publik
          </Link>
          <button
            onClick={keluar}
            className="rounded-lg bg-red-600 px-3.5 py-2 text-sm font-medium shadow-sm transition hover:bg-red-700"
          >
            Keluar
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar
          kategoriList={kategoriList}
          allFaskes={allFaskes}
          draft={draft}
          onSubmitFaskes={submitFaskes}
          onDeleteFaskes={removeFaskes}
          onBulkImport={bulkImport}
        />

        <main className="relative flex-1">
          {loading && (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-500">
              <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-slate-200 border-t-amber-500" />
              Memuat data faskes…
            </div>
          )}
          {error && (
            <div className="flex h-full items-center justify-center p-6 text-center text-red-600">
              Gagal terhubung ke API ({error}).
            </div>
          )}
          {!loading && !error && (
            <MapView
              faskes={allFaskes}
              draft={draft}
              mode="admin"
              cluster={false}
              heatmap={false}
              onMapClick={handleMapClick}
            />
          )}
        </main>
      </div>
    </div>
  );
}
