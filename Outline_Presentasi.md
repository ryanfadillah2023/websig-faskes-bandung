# OUTLINE PRESENTASI (.PPT) — 10 Slide

**Judul:** Sistem Informasi Geografis (SIG) Pemetaan Fasilitas Kesehatan di Kota Bandung Berbasis Web Menggunakan Data OpenStreetMap

---

### Slide 1 — Cover
- Judul lengkap proyek
- Nama mata kuliah, kelompok, anggota + NIM
- Logo kampus, tanggal

### Slide 2 — Latar Belakang & Masalah
- Sebaran faskes **Kota Bandung** tersebar / sulit diakses publik dalam satu peta
- Warga & Dinkes Bandung butuh peta interaktif tunggal berbasis web
- 1 gambar ilustrasi (peta Bandung / ikon rumah sakit)

### Slide 3 — Tujuan & Manfaat
- 4 tujuan (peta interaktif Bandung, filter+heatmap, jarak & faskes terdekat, prototipe siap dikembangkan)
- Manfaat: warga Bandung, Dinkes Kota Bandung, akademik

### Slide 4 — Analisis Data Spasial
- Jenis data: **Vektor titik & poligon** (Polygon → centroid), raster (basemap)
- Atribut HXL: nama, kategori, lat/lon, alamat, telepon
- Sumber: **OpenStreetMap (HOT/HDX, `indonesia_hxl.geojson`)** difilter ke Bandung (±348 faskes)
- Komposisi Bandung: clinic 147 · hospital 96 · pharmacy 80 · dentist 13 · doctors 12

### Slide 5 — Tech Stack Konseptual
- Diagram arsitektur: `OSM → ETL Python → PostGIS → Flask API (GeoJSON) → Leaflet.js`
- Tabel teknologi + alasan singkat

### Slide 6 — Rancangan UI/UX (Mockup Figma)
- Tampilkan screenshot mockup Figma
- Tunjuk komponen: navbar, panel filter, peta (komponen utama), legenda, footer

### Slide 7 — Prototipe Colab: Alur Per-Fungsi
- Diagram alur 19 fungsi (load → clean/filter Bandung → map → markers/cluster/heatmap → save)
- Fitur tambahan: jarak Haversine + garis, faskes terdekat, GUI ipywidgets
- Tekankan struktur "per-function" sesuai instruksi tugas

### Slide 8 — Demo Peta Interaktif (Bandung)
- Screenshot peta hasil (marker per warna + cluster + heatmap + legenda)
- Demo jarak (Gedung Sate → Alun-Alun = 2,49 km) & faskes terdekat dari Gedung Sate
- (Saat presentasi: buka HTML / Colab langsung)

### Slide 9 — Rencana Pengembangan Lanjut
- Perluas wilayah (Jawa Barat / nasional) + batas administrasi
- Migrasi PostGIS → REST API → frontend Leaflet
- Fitur faskes terdekat (ST_Distance) & routing → deploy ke cloud

### Slide 10 — Penutup & Pembagian Tugas
- Ringkasan kesiapan teknis tim
- Tabel pembagian tugas anggota
- "Terima kasih" + tautan Colab & Figma

---

## Tips Demo Saat Presentasi
1. Buka notebook Colab, jalankan `build_webgis(GEOJSON_PATH)` (default sudah wilayah Bandung).
2. Jelaskan tiap fungsi sambil scroll (sesuai instruksi *per-function*).
3. Tunjukkan peta interaktif (zoom, klik marker → popup, toggle heatmap).
4. Buka file `webgis_faskes.html` hasil ekspor sebagai bukti deploy-ready.
