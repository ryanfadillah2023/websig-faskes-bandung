# PROPOSAL KONSEP PENGEMBANGAN APLIKASI WEB SIG

## Sistem Informasi Geografis (SIG) Pemetaan Fasilitas Kesehatan di Kota Bandung Berbasis Web Menggunakan Data OpenStreetMap

**Mata Kuliah:** Sistem Informasi Geografis
**Tugas:** Tugas 2 — Proposal Konsep & Prototipe Web SIG
**Kelompok:** _________________ (2–4 orang)
**Anggota:**
1. _________________ (NIM: __________)
2. _________________ (NIM: __________)
3. _________________ (NIM: __________)
4. _________________ (NIM: __________)

**Tanggal:** Juni 2026

---

## 1. Pendahuluan

### 1.1 Latar Belakang
Informasi sebaran fasilitas kesehatan (Rumah Sakit, Klinik, Apotek, Dokter, Dokter Gigi) di **Kota Bandung** masih tersebar di berbagai sumber dan belum tersedia dalam satu peta interaktif yang mudah diakses publik. Padahal, warga Bandung sering membutuhkan informasi fasilitas kesehatan terdekat dengan cepat, dan Dinas Kesehatan Kota Bandung membutuhkan gambaran kepadatan layanan kesehatan per kecamatan untuk perencanaan.

Sistem Informasi Geografis (SIG) berbasis web menjawab kebutuhan ini dengan menyajikan data fasilitas kesehatan dalam bentuk peta interaktif yang dapat diakses melalui peramban (browser) tanpa instalasi perangkat lunak khusus. Kota Bandung dipilih sebagai wilayah studi karena cakupan datanya padat (±348 fasilitas) dan ringan untuk prototipe.

### 1.2 Tujuan
1. Memetakan fasilitas kesehatan di **Kota Bandung & sekitarnya** secara interaktif berbasis web.
2. Menyediakan filter kategori (RS, Klinik, Apotek, Dokter, Dokter Gigi) dan visualisasi kepadatan (heatmap).
3. Menyediakan perhitungan jarak antar titik dan pencarian fasilitas terdekat.
4. Membangun prototipe yang dapat dikembangkan menjadi aplikasi penuh (full-stack WebGIS).

### 1.3 Manfaat
- **Warga Bandung:** menemukan fasilitas kesehatan terdekat beserta informasinya (alamat, telepon).
- **Dinas Kesehatan Kota Bandung:** melihat sebaran & kepadatan layanan untuk perencanaan.
- **Akademik:** contoh penerapan data terbuka (OpenStreetMap) pada WebGIS.

---

## 2. Analisis Kebutuhan Data Spasial

### 2.1 Jenis Data Spasial
| Jenis | Penggunaan dalam proyek |
|---|---|
| **Vektor – Titik (Point)** | Fasilitas berbentuk titik (lat, lon) — dipakai langsung. |
| **Vektor – Poligon (Polygon)** | Fasilitas berbentuk poligon bangunan — dikonversi ke **titik centroid** untuk penanda peta. |
| **Raster** | Basemap (peta dasar) berupa tile OpenStreetMap/CartoDB yang dirender Leaflet. |

> Berkas sumber se-Indonesia berisi 6.304 Point + 9.836 Polygon. Untuk proyek ini data **difilter ke wilayah Bandung** (bounding box lat −7,10…−6,75 ; lon 107,45…107,85) sehingga tersisa ±348 fasilitas.

### 2.2 Atribut Data (tag HXL)
Nama (`#loc +name`), kategori (`#loc+amenity`: `hospital`, `clinic`, `doctors`, `pharmacy`, `dentist`), `#meta+healthcare`, koordinat (lat, lon), alamat (`addr_street`, `addr_city`), telepon (`#contact +phone`).

### 2.3 Sumber Data
Sumber utama adalah **OpenStreetMap** yang telah diolah oleh **HOT (Humanitarian OpenStreetMap Team) / HDX** menjadi berkas **`indonesia_hxl.geojson`** — sebuah GeoJSON ber-tag **HXL** berisi 16.140 fasilitas kesehatan se-Indonesia, yang lalu **difilter ke wilayah Kota Bandung (±348 fasilitas)**.

| Sumber | Keterangan | Status |
|---|---|---|
| **OpenStreetMap → berkas `indonesia_hxl.geojson` (HOT/HDX)** | Sumber utama. 16.140 fasilitas, tag HXL terstandar. Gratis & terbuka. | **Dipakai** |
| **OpenStreetMap Overpass API** | Query langsung per wilayah (alternatif pengambilan data). | Alternatif |
| **Ina-Geoportal (BIG)** | Batas administrasi resmi Indonesia (poligon). | Alternatif |
| **Kaggle** | Dataset fasilitas kesehatan siap pakai (CSV). | Alternatif |

**Komposisi data wilayah Bandung (`#loc+amenity`):** clinic 147 · hospital 96 · pharmacy 80 · dentist 13 · doctors 12 — total **±348 fasilitas** setelah difilter & dibersihkan.

**Alasan memilih OpenStreetMap (HXL/HDX):** gratis dan terbuka, cakupan luas termasuk Kota Bandung, atribut sudah terstandar (HXL), dan tersedia sebagai satu berkas GeoJSON siap olah tanpa kunci API.

---

## 3. Tech Stack Konseptual

| Lapisan | Teknologi | Alasan Pemilihan |
|---|---|---|
| **Peta / Frontend** | Leaflet.js (prototipe memakai **Folium** = Leaflet untuk Python) | Ringan, interaktif, standar industri WebGIS open-source. |
| **Backend / API** | **Python + Flask** (alternatif FastAPI) | Integrasi mulus dengan pipeline pengolahan data Python. |
| **Basis Data Spasial** | **PostgreSQL + PostGIS** | Mendukung tipe geometri & query spasial (jarak, dalam-poligon). |
| **Format Pertukaran Data** | **GeoJSON** | Standar data spasial untuk web. |
| **Pemrosesan Data (ETL)** | pandas, geopandas, requests | Mengambil & merapikan data OSM. |
| **Deployment** | Docker + Cloud (Railway/Render/VPS) | Reprodusibel dan mudah dirilis. |

**Arsitektur pengembangan lanjut:**
`OpenStreetMap → ETL Python → PostgreSQL/PostGIS → Flask REST API (GeoJSON) → Leaflet.js (browser)`

Prototipe pada tugas ini mencakup alur **OSM → ETL Python → Peta Leaflet** yang dijalankan langsung di Google Colab.

---

## 4. Rancangan UI/UX (Mockup)

Mockup dibuat dalam Figma (lihat tautan pada lampiran). Tata letak utama:

```
+--------------------------------------------------------------+
|  [LOGO]  WebSIG Faskes Kota Bandung     [ Cari... ]   [Login]|  <- Header / Navbar
+-------------+------------------------------------------------+
|  PANEL      |                                                |
|  FILTER     |                                                |
|             |                                                |
|  [x] RS     |          PETA INTERAKTIF (BANDUNG)             |
|  [x] Klinik |        (marker + cluster + heatmap)            |
|  [x] Dokter |                                                |
|  [x] Apotek |                            [+]  zoom           |
|  [x] Drg.   |                            [-]                 |
|  [Heatmap]  |                            [Legenda]           |
|  [Cluster]  |                                                |
+-------------+------------------------------------------------+
|  Footer: Sumber data OpenStreetMap © | Kelompok ...          |
+--------------------------------------------------------------+
```

**Komponen utama:**
- **Header/Navbar:** logo, judul aplikasi, kotak pencarian, tombol login.
- **Panel Filter (kiri):** checkbox kategori fasilitas, toggle Heatmap/Cluster.
- **Peta (tengah, dominan):** komponen utama; tombol zoom, kontrol layer, legenda warna.
- **Popup marker:** menampilkan nama, kategori, alamat, telepon.
- **Footer:** atribusi sumber data & identitas kelompok.

---

## 5. Prototipe Kode (Google Colab)

Prototipe disusun **per-fungsi** (sesuai instruksi) pada notebook Google Colab:
**URL Colab:** _______________________________________________

Daftar fungsi:
1. `install_dependencies()` — pasang library.
2. `upload_geojson()` — unggah berkas `indonesia_hxl.geojson` ke Colab.
3. `load_geojson(path)` — baca berkas GeoJSON.
4. `feature_to_point(feature)` — titik wakil (Point langsung, Polygon → centroid).
5. `classify(props)` — tentukan kategori dari tag HXL.
6. `geojson_to_dataframe(gj)` — konversi GeoJSON ke tabel.
7. `clean_data(df)` — bersihkan & validasi data.
8. `create_base_map(center, zoom)` — buat peta dasar.
9. `add_markers(m, df)` — marker per kategori + popup.
10. `add_marker_cluster(m, df)` — clustering marker.
11. `add_heatmap(m, df)` — layer kepadatan.
12. `add_legend(m)` — legenda warna.
13. `add_layer_control(m)` — kontrol on/off layer.
14. `build_webgis(path)` — fungsi utama (filter wilayah Bandung + merangkai semua).
15. `save_map(m, path)` — ekspor peta ke HTML.

**Fitur tambahan (sesuai demo perkuliahan):**
16. `hitung_jarak_km(...)` — hitung jarak 2 koordinat (rumus Haversine).
17. `peta_jarak(t1, t2)` — tarik garis lurus + label jarak (cth Gedung Sate → Alun-Alun Bandung).
18. `faskes_terdekat(df, lat, lon, n)` — cari fasilitas kesehatan terdekat dari satu titik.
19. `buat_gui(df)` — aplikasi mini interaktif (ipywidgets): dropdown kategori + pencarian + tombol.

Setiap fungsi diberi *docstring* dan sel penjelasan, sehingga dapat dipresentasikan satu per satu.

---

## 6. Rencana Pengembangan Lanjut
1. Migrasi data ke PostgreSQL/PostGIS.
2. Bangun REST API (Flask/FastAPI) yang menyajikan GeoJSON.
3. Frontend Leaflet.js dengan filter dinamis.
4. Fitur **cari faskes terdekat** (ST_Distance) & **routing** ke lokasi.
5. Deploy ke cloud + domain publik.

---

## 7. Pembagian Tugas Kelompok (contoh)
| Anggota | Tugas |
|---|---|
| Anggota 1 | Analisis data spasial & sumber data |
| Anggota 2 | Tech stack & arsitektur |
| Anggota 3 | Mockup UI/UX (Figma) |
| Anggota 4 | Prototipe kode Colab & presentasi |

---

## 8. Penutup
Proposal ini menyajikan konsep Web SIG pemetaan fasilitas kesehatan di **Kota Bandung** memanfaatkan data terbuka OpenStreetMap, lengkap dengan prototipe interaktif di Google Colab (peta, perhitungan jarak, pencarian terdekat, dan GUI) yang siap dikembangkan menjadi aplikasi web penuh.

**Lampiran:**
- A. Tautan Figma (mockup): ____________________
- B. Tautan Google Colab: ______________________
- C. Tangkapan layar peta interaktif (HTML hasil prototipe).
