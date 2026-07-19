// =====================================================================
// REST API WebSIG Faskes Bandung  —  membaca PostGIS, mengeluarkan GeoJSON
// Endpoint:
//   GET /                          -> health check
//   GET /api/kategori              -> daftar kategori + warna
//   GET /api/faskes                -> semua faskes (GeoJSON FeatureCollection)
//   GET /api/faskes?kategori=...   -> filter per kategori
//   GET /api/faskes/terdekat?lat=&lon=&limit=&kategori=  -> N faskes terdekat + jarak_km
// =====================================================================
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");
const svgCaptcha = require("svg-captcha");
const crypto = require("crypto");
require("dotenv").config();
const pool = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

// Konfigurasi auth dari .env
const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || "";
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-ganti-di-produksi";
const CORS_ORIGIN = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim());

// CORS dibatasi ke origin frontend saja (bukan "*")
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

// Middleware: wajib token JWT valid di header Authorization: Bearer <token>
function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Butuh autentikasi." });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Token tidak valid atau kedaluwarsa." });
  }
}

// Batasi percobaan login (anti brute-force): maks 10 per 15 menit per IP.
// Di serverless req.ip kosong -> ambil IP dari header (Netlify/proxy).
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  keyGenerator: (req) =>
    req.headers["x-nf-client-connection-ip"] ||
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    req.ip ||
    "global",
  message: { error: "Terlalu banyak percobaan login. Coba lagi nanti." },
});

// CAPTCHA stateless: jawaban ditandatangani dalam JWT singkat (cocok untuk serverless)
// GET /api/captcha -> { token, svg }
app.get("/api/captcha", (req, res) => {
  const c = svgCaptcha.create({
    size: 5,
    noise: 3,
    color: true,
    ignoreChars: "0o1ilI",
  });
  const token = jwt.sign({ cap: c.text.toLowerCase() }, JWT_SECRET, {
    expiresIn: "5m",
  });
  res.json({ token, svg: c.data });
});

// POST /api/login -> verifikasi captcha (via token) lalu kredensial. Token JWT berlaku 8 jam.
app.post("/api/login", loginLimiter, async (req, res) => {
  try {
    const { username, password, captchaToken, captcha } = req.body || {};

    // 1) Verifikasi captcha dari token (stateless, kedaluwarsa 5 menit)
    let capOk = false;
    try {
      const decoded = jwt.verify(captchaToken, JWT_SECRET);
      capOk = !!decoded.cap && String(captcha || "").toLowerCase() === decoded.cap;
    } catch {
      capOk = false;
    }
    if (!capOk) {
      return res.status(400).json({ error: "Captcha salah atau kedaluwarsa." });
    }

    // 2) Baru cek kredensial
    const okUser = username === ADMIN_USER;
    const okPass =
      okUser &&
      ADMIN_PASSWORD_HASH &&
      (await bcrypt.compare(String(password || ""), ADMIN_PASSWORD_HASH));
    if (!okUser || !okPass) {
      return res.status(401).json({ error: "Username atau password salah." });
    }
    const token = jwt.sign({ sub: username, role: "admin" }, JWT_SECRET, {
      expiresIn: "8h",
    });
    res.json({ token });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Ubah baris hasil query -> GeoJSON FeatureCollection (dibaca langsung oleh Leaflet)
function toFeatureCollection(rows) {
  return {
    type: "FeatureCollection",
    features: rows.map((r) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [Number(r.lon), Number(r.lat)] },
      properties: {
        id: r.id_faskes,
        nama: r.nama,
        kategori: r.kategori,
        warna: r.warna,
        alamat: r.alamat,
        telepon: r.telepon,
        rating: r.rating,
        ...(r.jarak_km !== undefined ? { jarak_km: Number(r.jarak_km) } : {}),
      },
    })),
  };
}

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok", service: "WebSIG Faskes Bandung API" });
});

// Bersihkan alamat ID untuk fallback Nominatim
function cleanAddr(s) {
  return String(s)
    .replace(/\bJl\.?/gi, "Jalan")
    .replace(/\bKec\.?/gi, "Kecamatan")
    .replace(/\bKel\.?/gi, "Kelurahan")
    .replace(/RT[.\s]*\d+\s*[/\\]\s*RW[.\s]*\d+/gi, "")
    .replace(/\bNo\.?\s*\d+([-/]\d+)?/gi, "")
    .replace(/\b\d{5}\b/g, "")
    .replace(/\s*,\s*(,\s*)+/g, ", ")
    .replace(/\s{2,}/g, " ")
    .replace(/^[\s,]+|[\s,]+$/g, "")
    .trim();
}

// GET /api/geocode?q=<alamat lengkap> -> koordinat (Google dulu, fallback Nominatim)
app.get("/api/geocode", async (req, res) => {
  const q = (req.query.q || "").toString().trim();
  if (!q) return res.status(400).json({ error: "Query kosong." });

  // 1) Google Geocoding (mendukung alamat lengkap & presisi)
  if (process.env.GOOGLE_API_KEY) {
    try {
      const gurl =
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q)}` +
        `&key=${process.env.GOOGLE_API_KEY}&region=id&language=id`;
      const gj = await (await fetch(gurl)).json();
      if (gj.status === "OK" && gj.results?.length) {
        const r0 = gj.results[0];
        return res.json({
          lat: r0.geometry.location.lat,
          lon: r0.geometry.location.lng,
          label: r0.formatted_address,
          source: "google",
        });
      }
    } catch (e) {
      /* lanjut ke fallback */
    }
  }

  // 2) Fallback Nominatim (alamat dibersihkan)
  try {
    const cleaned = cleanAddr(q) || q;
    const nurl =
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=id` +
      `&q=${encodeURIComponent(cleaned)}`;
    const nj = await (
      await fetch(nurl, {
        headers: { "User-Agent": "WebSIG-Bandung/1.0", "Accept-Language": "id" },
      })
    ).json();
    if (nj.length) {
      return res.json({
        lat: parseFloat(nj[0].lat),
        lon: parseFloat(nj[0].lon),
        label: nj[0].display_name,
        source: "osm",
      });
    }
  } catch (e) {
    /* jatuh ke 404 */
  }

  res.status(404).json({ error: "Lokasi tidak ditemukan. Coba kata kunci lain." });
});

// Daftar kategori + warna marker
app.get("/api/kategori", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id_kategori, nama_kategori, warna_marker FROM kategori ORDER BY id_kategori"
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Semua faskes (opsional filter ?kategori=Rumah Sakit)
app.get("/api/faskes", async (req, res) => {
  try {
    const { kategori } = req.query;
    const params = [];
    let where = "";
    if (kategori && kategori !== "Semua") {
      params.push(kategori);
      where = "WHERE k.nama_kategori = $1";
    }
    const sql = `
      SELECT f.id_faskes, f.nama, k.nama_kategori AS kategori, k.warna_marker AS warna,
             f.alamat, f.telepon, f.rating,
             ST_X(f.geom) AS lon, ST_Y(f.geom) AS lat
      FROM fasilitas_kesehatan f
      JOIN kategori k ON f.id_kategori = k.id_kategori
      ${where}
      ORDER BY f.nama`;
    const { rows } = await pool.query(sql, params);
    res.json(toFeatureCollection(rows));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Faskes terdekat dari sebuah titik (fitur inti SIG)
app.get("/api/faskes/terdekat", async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);
    const limit = Math.min(parseInt(req.query.limit) || 5, 50);
    const { kategori } = req.query;

    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      return res
        .status(400)
        .json({ error: "Parameter lat & lon wajib berupa angka." });
    }

    const params = [lon, lat]; // $1 = lon, $2 = lat (ST_MakePoint butuh urutan lon,lat)
    let where = "";
    if (kategori && kategori !== "Semua") {
      params.push(kategori);
      where = `WHERE k.nama_kategori = $${params.length}`;
    }
    params.push(limit);
    const limitIdx = params.length;

    const sql = `
      SELECT f.id_faskes, f.nama, k.nama_kategori AS kategori, k.warna_marker AS warna,
             f.alamat, f.telepon, f.rating,
             ST_X(f.geom) AS lon, ST_Y(f.geom) AS lat,
             ROUND((ST_Distance(
               f.geom::geography,
               ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
             ) / 1000)::numeric, 2) AS jarak_km
      FROM fasilitas_kesehatan f
      JOIN kategori k ON f.id_kategori = k.id_kategori
      ${where}
      ORDER BY f.geom <-> ST_SetSRID(ST_MakePoint($1, $2), 4326)
      LIMIT $${limitIdx}`;
    const { rows } = await pool.query(sql, params);
    res.json(toFeatureCollection(rows));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---------------------------------------------------------------------
// ADMIN — tambah & hapus data faskes
// ---------------------------------------------------------------------

// POST /api/faskes  -> tambah faskes baru (WAJIB login admin)
// body: { nama, kategori, alamat, telepon, rating, lat, lon }
app.post("/api/faskes", requireAuth, async (req, res) => {
  try {
    const { nama, kategori, alamat, telepon, rating, lat, lon } = req.body;

    if (!nama || !kategori || lat === undefined || lon === undefined) {
      return res
        .status(400)
        .json({ error: "nama, kategori, lat, dan lon wajib diisi." });
    }

    // Cari id_kategori dari nama kategori
    const kat = await pool.query(
      "SELECT id_kategori FROM kategori WHERE nama_kategori = $1",
      [kategori]
    );
    if (kat.rows.length === 0) {
      return res.status(400).json({ error: `Kategori '${kategori}' tidak dikenal.` });
    }

    const sql = `
      INSERT INTO fasilitas_kesehatan
        (place_id, nama, id_kategori, alamat, telepon, rating, geom)
      VALUES ($1, $2, $3, $4, $5, $6, ST_SetSRID(ST_MakePoint($7, $8), 4326))
      RETURNING id_faskes`;
    const params = [
      "manual-" + Date.now(),           // place_id unik untuk data input manual
      nama,
      kat.rows[0].id_kategori,
      alamat || null,
      telepon || null,
      rating === "" || rating === undefined ? null : rating,
      Number(lon),
      Number(lat),
    ];
    const { rows } = await pool.query(sql, params);
    res.status(201).json({ ok: true, id_faskes: rows[0].id_faskes });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/faskes/bulk  -> import banyak faskes sekaligus (WAJIB login admin)
// body: { rows: [ {nama, kategori, alamat, telepon, rating, lat, lon}, ... ] }
app.post("/api/faskes/bulk", requireAuth, async (req, res) => {
  const rows = Array.isArray(req.body?.rows) ? req.body.rows : null;
  if (!rows || rows.length === 0)
    return res.status(400).json({ error: "Tidak ada baris data." });
  if (rows.length > 2000)
    return res.status(400).json({ error: "Maksimal 2000 baris per unggahan." });

  const client = await pool.connect();
  try {
    const kat = await client.query(
      "SELECT id_kategori, nama_kategori FROM kategori"
    );
    const katMap = {};
    kat.rows.forEach((k) => (katMap[k.nama_kategori.toLowerCase()] = k.id_kategori));

    let inserted = 0;
    const errors = [];
    await client.query("BEGIN");
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i] || {};
      const nama = String(r.nama || "").trim();
      const idKat = katMap[String(r.kategori || "").trim().toLowerCase()];
      const lat = parseFloat(r.lat);
      const lon = parseFloat(r.lon);
      if (!nama || !idKat || Number.isNaN(lat) || Number.isNaN(lon)) {
        errors.push({ baris: i + 1, alasan: "nama/kategori/lat/lon tidak valid" });
        continue;
      }
      const rating =
        r.rating === "" || r.rating == null || Number.isNaN(parseFloat(r.rating))
          ? null
          : parseFloat(r.rating);
      await client.query(
        `INSERT INTO fasilitas_kesehatan
           (place_id, nama, id_kategori, alamat, telepon, rating, geom)
         VALUES ($1,$2,$3,$4,$5,$6, ST_SetSRID(ST_MakePoint($7,$8),4326))`,
        [
          "bulk-" + Date.now() + "-" + i,
          nama,
          idKat,
          String(r.alamat || "").trim() || null,
          String(r.telepon || "").trim() || null,
          rating,
          lon,
          lat,
        ]
      );
      inserted++;
    }
    await client.query("COMMIT");
    res.json({ ok: true, inserted, skipped: errors.length, errors: errors.slice(0, 20) });
  } catch (e) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

// DELETE /api/faskes/:id  -> hapus faskes (WAJIB login admin)
app.delete("/api/faskes/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: "id tidak valid." });
    const { rowCount } = await pool.query(
      "DELETE FROM fasilitas_kesehatan WHERE id_faskes = $1",
      [id]
    );
    if (rowCount === 0) return res.status(404).json({ error: "Data tidak ditemukan." });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Jalankan server hanya bila file dieksekusi langsung (mode lokal).
// Di serverless (Netlify Functions), app diekspor & dipanggil sebagai handler.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`WebSIG API jalan di http://localhost:${PORT}`);
  });
}

module.exports = app;
