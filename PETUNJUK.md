# Petunjuk Penggunaan — Tugas 2 Web SIG

Folder ini berisi semua bahan untuk menjawab Tugas 2.

## Daftar File
| File | Kegunaan | Output tugas |
|---|---|---|
| `WebSIG_FasilitasKesehatan.ipynb` | Prototipe kode Web SIG (per-fungsi) | **URL Google Colab** |
| `Proposal_WebSIG_FasilitasKesehatan.md` | Dokumen proposal lengkap | **PDF** |
| `Outline_Presentasi.md` | Kerangka 10 slide | **PPT** |
| `build_notebook.py` | Skrip pembuat notebook (arsip) | — |

## Langkah Pengumpulan

### 1. Google Colab (URL)
1. Buka https://colab.research.google.com → **File > Upload notebook** → pilih `WebSIG_FasilitasKesehatan.ipynb`.
2. **Siapkan data:** ganti nama `indonesia_hxl (1).geojson` menjadi **`indonesia_hxl.geojson`**, lalu di Colab jalankan sel `upload_geojson()` dan pilih berkas itu (atau drag ke panel Files Colab). Notebook membaca nama `indonesia_hxl.geojson`.
3. Jalankan sel dari atas ke bawah (Runtime > Run all).
4. **Share** → ubah akses ke "Anyone with the link" → salin URL.

### 2. Proposal PDF
Pilih salah satu cara mengubah `Proposal_WebSIG_FasilitasKesehatan.md` → PDF:
- **Termudah:** buka isi `.md`, salin ke Google Docs / MS Word, rapikan, lalu *Export/Save as PDF*.
- **Otomatis (jika ada Pandoc):** `pandoc Proposal_WebSIG_FasilitasKesehatan.md -o Proposal.pdf`
- Sisipkan screenshot peta hasil Colab + screenshot Figma sebelum ekspor.

### 3. Presentasi PPT
- Buka `Outline_Presentasi.md`, buat 10 slide di PowerPoint / Google Slides / Canva sesuai kerangka.

### 4. Figma (mockup)
- Buat file Figma sesuai layout di bagian 4 proposal, atau minta saya men-generate-nya via Figma (MCP tersedia).
- Set akses share → salin link.

## Catatan
- Setiap anggota WAJIB turn-in sendiri di Teams (PDF, PPT, Figma, URL Colab).
- Wilayah default = **Bandung**. Untuk seluruh Indonesia: `build_webgis(GEOJSON_PATH, bbox=None)`. Untuk kota lain, ganti `BANDUNG_BBOX` dengan bounding box kota tersebut.
