import { useMemo, useState } from "react";
import * as XLSX from "xlsx";

// Samakan nama kolom apa pun -> field standar (fleksibel terhadap header)
function normalizeRow(raw) {
  const o = {};
  for (const k in raw) o[String(k).trim().toLowerCase()] = raw[k];
  return {
    nama: o.nama ?? o.name ?? "",
    kategori: o.kategori ?? o.category ?? "",
    alamat: o.alamat ?? o.address ?? "",
    telepon: o.telepon ?? o.telp ?? o.phone ?? "",
    rating: o.rating ?? "",
    lat: o.lat ?? o.latitude ?? o.y ?? "",
    lon: o.lon ?? o.lng ?? o.longitude ?? o.x ?? "",
  };
}

export default function AdminSidebar({
  kategoriList,
  allFaskes,
  draft,
  onSubmitFaskes,
  onDeleteFaskes,
  onBulkImport,
}) {
  // form tambah
  const [nama, setNama] = useState("");
  const [kategori, setKategori] = useState("Rumah Sakit");
  const [alamat, setAlamat] = useState("");
  const [telepon, setTelepon] = useState("");
  const [rating, setRating] = useState("");
  const [saving, setSaving] = useState(false);

  // import CSV/Excel
  const [parsed, setParsed] = useState([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setImportResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws, { defval: "" });
        setParsed(json.map(normalizeRow));
      } catch {
        alert("Gagal membaca file. Pastikan format CSV atau Excel yang benar.");
        setParsed([]);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  async function doImport() {
    if (parsed.length === 0) return alert("Belum ada data untuk diimport.");
    setImporting(true);
    setImportResult(null);
    try {
      const res = await onBulkImport(parsed);
      setImportResult(res);
      setParsed([]);
      setFileName("");
    } catch (err) {
      alert(err.message);
    } finally {
      setImporting(false);
    }
  }

  function downloadTemplate() {
    const csv =
      "nama,kategori,alamat,telepon,rating,lat,lon\n" +
      "Contoh Klinik Sehat,Klinik,Jl. Contoh No.1 Bandung,022123456,4.5,-6.9175,107.6191\n";
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "template_faskes.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  // kelola/hapus
  const [kelolaQuery, setKelolaQuery] = useState("");

  const hasilKelola = useMemo(() => {
    const q = kelolaQuery.trim().toLowerCase();
    if (!q) return [];
    return allFaskes
      .filter((f) => f.properties.nama.toLowerCase().includes(q))
      .slice(0, 30);
  }, [allFaskes, kelolaQuery]);

  async function submit(e) {
    e.preventDefault();
    if (!nama.trim()) return alert("Nama faskes wajib diisi.");
    if (!draft) return alert("Klik peta dulu untuk menentukan lokasi faskes.");
    setSaving(true);
    try {
      await onSubmitFaskes({
        nama: nama.trim(),
        kategori,
        alamat: alamat.trim(),
        telepon: telepon.trim(),
        rating: rating === "" ? null : Number(rating),
        lat: draft.lat,
        lon: draft.lon,
      });
      setNama("");
      setAlamat("");
      setTelepon("");
      setRating("");
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <aside className="nice-scroll flex w-80 shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-slate-50">
      <div className="flex-1 space-y-3 p-3">
        {/* Tambah faskes */}
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
          <h2 className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Tambah Data Faskes
          </h2>

          <div
            className={`mb-2 rounded-md p-2 text-xs ${
              draft ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
            }`}
          >
            {draft
              ? `📍 Lokasi dipilih: ${draft.lat.toFixed(4)}, ${draft.lon.toFixed(4)}`
              : "⚠️ Klik peta untuk menentukan lokasi faskes."}
          </div>

          <form onSubmit={submit} className="space-y-2 text-sm">
            <input
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Nama faskes *"
              className="w-full rounded-lg border border-slate-300 px-2.5 py-2 transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
            <select
              value={kategori}
              onChange={(e) => setKategori(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-2.5 py-2 transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              {kategoriList.map((k) => (
                <option key={k.id_kategori} value={k.nama_kategori}>
                  {k.nama_kategori}
                </option>
              ))}
            </select>
            <input
              value={alamat}
              onChange={(e) => setAlamat(e.target.value)}
              placeholder="Alamat"
              className="w-full rounded-lg border border-slate-300 px-2.5 py-2 transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
            <input
              value={telepon}
              onChange={(e) => setTelepon(e.target.value)}
              placeholder="Telepon"
              className="w-full rounded-lg border border-slate-300 px-2.5 py-2 transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
            <input
              type="number"
              step="0.1"
              min="0"
              max="5"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              placeholder="Rating (0-5)"
              className="w-full rounded-lg border border-slate-300 px-2.5 py-2 transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-green-600 px-3 py-2.5 font-medium text-white shadow-sm transition hover:bg-green-700 active:scale-[0.98] disabled:opacity-50"
            >
              {saving ? "Menyimpan…" : "➕ Tambah Faskes"}
            </button>
          </form>
        </div>

        {/* Import CSV / Excel */}
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
          <h2 className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Import CSV / Excel
          </h2>
          <p className="mb-2 text-xs text-gray-500">
            Kolom: <code>nama, kategori, alamat, telepon, rating, lat, lon</code>.
            Kategori harus:{" "}
            {kategoriList.map((k) => k.nama_kategori).join(", ")}.
          </p>

          <button
            onClick={downloadTemplate}
            className="mb-2 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            ⬇️ Unduh Template CSV
          </button>

          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFile}
            className="w-full text-xs file:mr-2 file:rounded file:border-0 file:bg-teal-600 file:px-3 file:py-1.5 file:text-white hover:file:bg-teal-700"
          />

          {parsed.length > 0 && (
            <div className="mt-2 rounded-md bg-blue-50 p-2 text-xs text-blue-700">
              📄 {fileName}: <b>{parsed.length}</b> baris terbaca. Klik import untuk
              menyimpan.
            </div>
          )}

          {parsed.length > 0 && (
            <button
              onClick={doImport}
              disabled={importing}
              className="mt-2 w-full rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50"
            >
              {importing ? "Mengimport…" : `📥 Import ${parsed.length} Baris`}
            </button>
          )}

          {importResult && (
            <div className="mt-2 rounded-md bg-green-50 p-2 text-xs text-green-700">
              ✅ Berhasil import <b>{importResult.inserted}</b> data
              {importResult.skipped > 0 && (
                <span className="text-amber-700">
                  {" "}
                  · {importResult.skipped} dilewati (data tidak valid)
                </span>
              )}
              .
            </div>
          )}
        </div>

        {/* Kelola / hapus data */}
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
          <h2 className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Kelola / Hapus Data
          </h2>
          <input
            value={kelolaQuery}
            onChange={(e) => setKelolaQuery(e.target.value)}
            placeholder="🔍 Cari faskes untuk dihapus…"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
          />
          {kelolaQuery && (
            <ul className="mt-2 space-y-1">
              {hasilKelola.length === 0 && (
                <li className="px-2 py-1 text-xs text-gray-400">
                  Tidak ada hasil.
                </li>
              )}
              {hasilKelola.map((f) => {
                const p = f.properties;
                return (
                  <li
                    key={p.id}
                    className="flex items-center justify-between rounded-md border border-gray-100 px-2 py-1.5 text-sm"
                  >
                    <span>
                      {p.nama}
                      <span className="block text-xs text-gray-400">
                        {p.kategori}
                      </span>
                    </span>
                    <button
                      onClick={() => onDeleteFaskes(p.id)}
                      className="whitespace-nowrap text-xs text-red-600 hover:underline"
                    >
                      hapus
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </aside>
  );
}
