// Klien REST API — memanggil backend Express (PostGIS -> GeoJSON).
const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

const TOKEN_KEY = "websig_token";

// Header Authorization dari token yang tersimpan (untuk endpoint admin)
function authHeader() {
  const t = sessionStorage.getItem(TOKEN_KEY);
  return t ? { Authorization: `Bearer ${t}` } : {};
}

// Ambil captcha baru -> { token, svg }
export async function getCaptcha() {
  const r = await fetch(`${BASE}/api/captcha`);
  if (!r.ok) throw new Error("Gagal memuat captcha");
  return r.json();
}

// Login ke backend -> kembalikan { token }
export async function loginRequest(username, password, captchaToken, captcha) {
  const r = await fetch(`${BASE}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, captchaToken, captcha }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || "Login gagal");
  return j;
}

export async function getKategori() {
  const r = await fetch(`${BASE}/api/kategori`);
  if (!r.ok) throw new Error("Gagal memuat kategori");
  return r.json();
}

export async function getFaskes(kategori) {
  const url = new URL(`${BASE}/api/faskes`);
  if (kategori && kategori !== "Semua") url.searchParams.set("kategori", kategori);
  const r = await fetch(url);
  if (!r.ok) throw new Error("Gagal memuat data faskes");
  return r.json();
}

export async function getTerdekat(lat, lon, limit = 5, kategori) {
  const url = new URL(`${BASE}/api/faskes/terdekat`);
  url.searchParams.set("lat", lat);
  url.searchParams.set("lon", lon);
  url.searchParams.set("limit", limit);
  if (kategori && kategori !== "Semua") url.searchParams.set("kategori", kategori);
  const r = await fetch(url);
  if (!r.ok) throw new Error("Gagal mencari faskes terdekat");
  return r.json();
}

// --- Admin ---
export async function createFaskes(data) {
  const r = await fetch(`${BASE}/api/faskes`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(data),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || "Gagal menambah data");
  return j;
}

export async function deleteFaskes(id) {
  const r = await fetch(`${BASE}/api/faskes/${id}`, {
    method: "DELETE",
    headers: { ...authHeader() },
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || "Gagal menghapus data");
  return j;
}

// Geocoding: ubah teks alamat/lokasi -> koordinat.
// Ditangani backend: Google Geocoding (alamat lengkap) dengan fallback Nominatim.
export async function geocode(query) {
  const r = await fetch(`${BASE}/api/geocode?q=${encodeURIComponent(query)}`);
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || "Lokasi tidak ditemukan.");
  return { lat: j.lat, lon: j.lon, label: j.label };
}

// Rute jalan via OSRM (gratis, tanpa API key). from/to = { lat, lon }
export async function getRoute(from, to) {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${from.lon},${from.lat};${to.lon},${to.lat}` +
    `?overview=full&geometries=geojson`;
  const r = await fetch(url);
  const j = await r.json();
  if (j.code !== "Ok" || !j.routes?.length)
    throw new Error("Rute tidak ditemukan.");
  const route = j.routes[0];
  return {
    coordinates: route.geometry.coordinates.map(([lon, lat]) => [lat, lon]),
    distanceKm: route.distance / 1000,
    durationMin: route.duration / 60,
  };
}

// Import banyak faskes sekaligus (dari CSV/Excel yang sudah di-parse jadi array)
export async function bulkCreateFaskes(rows) {
  const r = await fetch(`${BASE}/api/faskes/bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify({ rows }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || "Gagal import data");
  return j;
}
