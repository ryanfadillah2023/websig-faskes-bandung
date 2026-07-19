# Panduan Deploy — WebSIG Faskes Bandung

Arsitektur: **Frontend (Vercel)** + **Backend (Render)** + **Database (Supabase/PostGIS)**.
Semua gratis. Ikuti berurutan.

> Nilai untuk env var (ADMIN_PASSWORD_HASH, JWT_SECRET, GOOGLE_API_KEY) **salin dari file
> `backend/.env` di komputermu** — jangan ditulis di file yang ter-commit ke GitHub.

---

## 0) Push kode ke GitHub (prasyarat)

1. Buka https://github.com/new → buat repo kosong, mis. `websig-faskes-bandung`
   (jangan centang "Add README").
2. Di terminal, dari folder proyek:
   ```bash
   git remote add origin https://github.com/USERNAME/websig-faskes-bandung.git
   git branch -M main
   git push -u origin main
   ```
   (Login GitHub saat diminta — pakai token/GitHub Desktop bila perlu.)

---

## 1) Database — Supabase

1. https://supabase.com → **New project**.
   - Name: `websig-bandung` · Database Password: **buat & SIMPAN** · Region: Singapore.
2. Tunggu provisioning (~2 menit).
3. Menu **SQL Editor** → **New query** → buka file `db/supabase_setup.sql`, salin **seluruh
   isinya**, tempel, klik **Run**.
   - Ini membuat PostGIS + tabel + 304 faskes.
   - Jika `CREATE EXTENSION postgis` error, aktifkan dulu di **Database → Extensions →
     cari "postgis" → Enable**, lalu Run lagi.
4. Ambil connection string: **Project Settings → Database → Connection string → URI**.
   Bentuknya:
   ```
   postgresql://postgres:[PASSWORD]@db.xxxx.supabase.co:5432/postgres
   ```
   Ganti `[PASSWORD]` dengan password langkah 1. **Simpan string ini** (untuk Render).

---

## 2) Backend — Render

1. https://render.com → **New → Web Service** → **Connect** repo GitHub tadi.
2. Pengaturan:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Instance Type:** Free
3. **Environment Variables** (Add) — nilai salin dari `backend/.env`:
   | Key | Value |
   |---|---|
   | `DATABASE_URL` | connection string Supabase (langkah 1.4) |
   | `ADMIN_USER` | `admin` |
   | `ADMIN_PASSWORD_HASH` | salin dari `backend/.env` |
   | `JWT_SECRET` | salin dari `backend/.env` |
   | `GOOGLE_API_KEY` | salin dari `backend/.env` |
   | `CORS_ORIGIN` | isi **setelah** langkah 3 (URL Vercel) |

   (PORT tidak perlu diisi — Render mengaturnya otomatis.)
4. **Create Web Service** → tunggu build. Dapat URL, mis.
   `https://websig-backend.onrender.com`.
5. Tes: buka `https://websig-backend.onrender.com/api/faskes` → harus keluar data GeoJSON.

---

## 3) Frontend — Vercel

1. https://vercel.com → **Add New → Project** → **Import** repo GitHub.
2. Pengaturan:
   - **Root Directory:** `frontend`
   - Framework: **Vite** (terdeteksi otomatis)
3. **Environment Variables**:
   | Key | Value |
   |---|---|
   | `VITE_API_URL` | URL backend Render (mis. `https://websig-backend.onrender.com`) |
4. **Deploy** → dapat URL, mis. `https://websig-faskes.vercel.app`.

---

## 4) Sambungkan CORS (penting)

Kembali ke **Render → backend → Environment** → set
`CORS_ORIGIN` = URL Vercel (mis. `https://websig-faskes.vercel.app`) → **Save**
(backend akan redeploy otomatis).

---

## 5) Uji akhir

Buka URL Vercel:
- Peta memuat 304 faskes ✅
- Filter, cluster, heatmap, cari terdekat, rute ✅
- `/admin/login` → login `admin` / `admin123` → tambah/hapus data ✅

---

## Catatan penting

- **Backend Render tidur** setelah ±15 menit idle → request pertama lambat (~50 detik).
  Untuk demo/video, buka dulu URL-nya 1 menit sebelum mulai agar "bangun".
- **URL untuk laporan/PPT:** cantumkan URL **Vercel** (frontend) sebagai URL aplikasi.
- Geocoding "ketik alamat" pakai Google (butuh **Geocoding API** aktif di Google Cloud);
  bila tidak, otomatis fallback ke OpenStreetMap.
