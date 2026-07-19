# -*- coding: utf-8 -*-
"""Builder: WebSIG_FasilitasKesehatan.ipynb (Google Colab) - sumber data indonesia_hxl.geojson"""
import json

def md(*lines):
    src = [l if l.endswith("\n") else l + "\n" for l in lines]
    src[-1] = src[-1].rstrip("\n")
    return {"cell_type": "markdown", "metadata": {}, "source": src}

def code(src):
    lines = src.split("\n")
    source = [l + "\n" for l in lines[:-1]] + [lines[-1]]
    return {"cell_type": "code", "metadata": {}, "execution_count": None, "outputs": [], "source": source}

cells = []

cells.append(md(
"# Sistem Informasi Geografis (SIG) Pemetaan Fasilitas Kesehatan di Kota Bandung Berbasis Web Menggunakan Data OpenStreetMap",
"",
"**Tugas 2 — Proposal Konsep & Prototipe Web SIG**",
"",
"Prototipe Web SIG yang memetakan **fasilitas kesehatan di Kota Bandung & sekitarnya (Bandung Raya)** — Rumah Sakit, Klinik, Apotek, Dokter, Dokter Gigi. "
"Sumber data: **OpenStreetMap** yang sudah diolah HOT/HDX menjadi berkas **`indonesia_hxl.geojson`** (16.140 fasilitas se-Indonesia, ber-tag HXL); "
"data difilter ke wilayah Bandung (±348 fasilitas). "
"Divisualisasikan interaktif dengan **Folium (Leaflet.js)**.",
"",
"Disusun **per-fungsi** sesuai instruksi tugas agar tiap fungsi bisa dijelaskan satu per satu saat presentasi.",
"",
"---",
"## Daftar Fungsi (Per-Function)",
"1. `install_dependencies()` — pasang library",
"2. `upload_geojson()` — unggah berkas `indonesia_hxl.geojson` ke Colab",
"3. `load_geojson(path)` — baca berkas GeoJSON",
"4. `feature_to_point(feature)` — ambil titik wakil (Point apa adanya, Polygon → centroid)",
"5. `classify(props)` — tentukan kategori fasilitas dari tag HXL",
"6. `geojson_to_dataframe(gj)` — ubah GeoJSON menjadi tabel (pandas)",
"7. `clean_data(df)` — bersihkan & validasi data",
"8. `create_base_map(center, zoom)` — peta dasar",
"9. `add_markers(m, df)` — marker per fasilitas (warna per kategori)",
"10. `add_marker_cluster(m, df)` — pengelompokan marker (clustering)",
"11. `add_heatmap(m, df)` — layer kepadatan (heatmap)",
"12. `add_legend(m)` — legenda warna kategori",
"13. `add_layer_control(m)` — kontrol on/off layer",
"14. `build_webgis(path)` — fungsi utama (merangkai semua)",
"15. `save_map(m, path)` — simpan peta ke HTML",
"",
"**Fitur tambahan (sesuai demo perkuliahan):**",
"16. `hitung_jarak_km(lat1,lon1,lat2,lon2)` — hitung jarak 2 koordinat (haversine)",
"17. `peta_jarak(t1,t2)` — tarik garis lurus antar 2 titik + label jarak (cth Gedung Sate–Alun-Alun Bandung)",
"18. `faskes_terdekat(df,lat,lon,n)` — cari fasilitas kesehatan terdekat dari satu titik",
"19. `buat_gui(df)` — aplikasi mini interaktif (ipywidgets): dropdown kategori + pencarian + tombol",
"20. `enrich_with_google_places(df)` — (opsional) lengkapi telepon/alamat/jam buka/rating dari Google Places API",
"21. `fetch_faskes_google()` — ambil seluruh data faskes Bandung **langsung dari Google Places** (grid; tanpa OSM)",
"22. `fetch_faskes_foursquare()` — ambil data faskes Bandung dari **Foursquare Places** (gratis tanpa kartu; ada telepon)"
))

cells.append(md(
"## 0. Ringkasan Konsep (untuk Proposal)",
"",
"**Latar belakang.** Sebaran fasilitas kesehatan di **Kota Bandung** belum tersaji dalam satu peta interaktif publik. Web SIG ini membantu warga Bandung menemukan fasilitas kesehatan terdekat dan membantu Dinas Kesehatan Kota Bandung melihat kepadatan layanan per kecamatan.",
"",
"**Tujuan prototipe.** Menampilkan titik fasilitas kesehatan di Bandung (data vektor) dari OpenStreetMap pada peta web interaktif, lengkap dengan kategori berwarna, clustering, heatmap kepadatan, perhitungan jarak, dan pencarian fasilitas terdekat."
))

cells.append(md(
"## 1. Analisis Kebutuhan Data Spasial",
"",
"| Aspek | Keterangan |",
"|---|---|",
"| **Jenis data** | **Vektor** — fasilitas berbentuk **titik (Point)** dan **poligon (Polygon)** bangunan. Poligon dikonversi ke titik centroid untuk penanda. Basemap = **raster** tile. |",
"| **Atribut (tag HXL)** | `#loc+amenity` (jenis), `#loc +name` (nama), `#meta+healthcare`, `#contact +phone`, `addr_street`, `addr_city` |",
"| **Sumber utama** | **OpenStreetMap** → diolah HOT/HDX → berkas `indonesia_hxl.geojson` (16.140 fasilitas se-Indonesia) |",
"| **Wilayah studi** | **Kota Bandung & sekitarnya (Bandung Raya)** — difilter via bounding box lat −7,10…−6,75 ; lon 107,45…107,85 |",
"| **Basemap (raster)** | OpenStreetMap / CartoDB tiles (disediakan Leaflet/Folium) |",
"",
"Komposisi data wilayah Bandung (±348 fasilitas): clinic 147 · hospital 96 · pharmacy 80 · dentist 13 · doctors 12. Geometri sumber: campuran Point & Polygon (Polygon → centroid)."
))

cells.append(md(
"## 2. Tech Stack Konseptual",
"",
"| Lapisan | Teknologi | Alasan |",
"|---|---|---|",
"| **Frontend / Peta** | Leaflet.js (prototipe: **Folium**) | ringan, interaktif, standar WebGIS |",
"| **Backend / API** | **Python + Flask** (atau FastAPI) | integrasi mulus dengan pipeline data ini |",
"| **Database spasial** | **PostgreSQL + PostGIS** | tipe geometri & query spasial (ST_Distance, ST_Within) |",
"| **Format data** | **GeoJSON** | standar pertukaran data spasial web |",
"| **Pemrosesan data** | pandas, json | ETL data GeoJSON |",
"| **Deploy** | Docker + cloud (Railway/Render/VPS) | reprodusibel |",
"",
"Alur lanjutan: **GeoJSON OSM → ETL Python → PostGIS → Flask REST API (GeoJSON) → Leaflet frontend**. Prototipe ini mencakup *GeoJSON → ETL Python → peta Leaflet* di Colab."
))

cells.append(md("---", "# PROTOTIPE KODE (Per-Function)"))

# 1
cells.append(md("### Fungsi 1 — `install_dependencies()`", "Memasang `folium` dan dependensinya. Jalankan sekali di awal sesi Colab."))
cells.append(code(
'''def install_dependencies():
    """Pasang library yang dibutuhkan prototipe (folium, pandas, ipywidgets)."""
    import subprocess, sys
    for p in ["folium", "pandas", "ipywidgets"]:
        subprocess.run([sys.executable, "-m", "pip", "install", "-q", p])
    print("Dependencies siap: folium, pandas, ipywidgets")

install_dependencies()'''))

cells.append(md("### Import & konfigurasi global"))
cells.append(code(
'''import json
import pandas as pd
import folium
from folium.plugins import MarkerCluster, HeatMap

# Nama berkas data (unggah ke Colab dengan nama ini)
GEOJSON_PATH = "indonesia_hxl.geojson"

# Wilayah studi: KOTA BANDUNG & sekitarnya (Bandung Raya)
BANDUNG_CENTER = (-6.9025, 107.6186)        # Gedung Sate
BANDUNG_BBOX   = {"lat": (-7.10, -6.75), "lon": (107.45, 107.85)}

# Warna marker per kategori fasilitas kesehatan
WARNA_KATEGORI = {
    "hospital": "red",
    "clinic":   "blue",
    "doctors":  "cadetblue",
    "pharmacy": "green",
    "dentist":  "orange",
    "lainnya":  "gray",
}
IKON_KATEGORI = {
    "hospital": "plus-square",
    "clinic":   "stethoscope",
    "doctors":  "user-md",
    "pharmacy": "medkit",
    "dentist":  "tooth",
    "lainnya":  "info-sign",
}

# Nama field HXL pada berkas (perhatikan spasi pada beberapa kunci!)
F_AMENITY    = "#loc+amenity"
F_NAME       = "#loc +name"
F_HEALTHCARE = "#meta+healthcare"
F_PHONE      = "#contact +phone"'''))

# 2
cells.append(md("### Fungsi 2 — `upload_geojson()`",
"Mengunggah berkas `indonesia_hxl.geojson` ke sesi Colab. Saat dialog muncul, pilih berkas dari komputer. (Jika berkas sudah di Drive, lewati fungsi ini.)"))
cells.append(code(
'''def upload_geojson():
    """Unggah berkas GeoJSON ke Colab; kembalikan nama berkas terunggah."""
    try:
        from google.colab import files
        uploaded = files.upload()           # dialog pilih berkas
        nama = list(uploaded.keys())[0]
        print("Terunggah:", nama)
        return nama
    except Exception as e:
        print("Bukan di Colab / lewati upload:", e)
        return GEOJSON_PATH

# Jalankan lalu samakan path (boleh dilewati bila berkas sudah ada):
# GEOJSON_PATH = upload_geojson()'''))

# 3
cells.append(md("### Fungsi 3 — `load_geojson(path)`", "Membaca berkas GeoJSON menjadi objek Python (FeatureCollection)."))
cells.append(code(
'''def load_geojson(path=GEOJSON_PATH):
    """Baca berkas GeoJSON; kembalikan dict FeatureCollection."""
    with open(path, encoding="utf-8") as f:
        gj = json.load(f)
    print(f"Berkas dimuat: {len(gj.get('features', []))} fitur.")
    return gj'''))

# 4
cells.append(md("### Fungsi 4 — `feature_to_point(feature)`",
"Mengambil **titik wakil** tiap fitur. Geometri `Point` dipakai langsung; geometri `Polygon` dihitung **centroid**-nya (rata-rata koordinat cincin luar). Koordinat GeoJSON berurutan `[lon, lat]`."))
cells.append(code(
'''def feature_to_point(feature):
    """Kembalikan (lat, lon) titik wakil; None bila geometri tak didukung."""
    geom = feature.get("geometry") or {}
    t = geom.get("type")
    c = geom.get("coordinates")
    if not c:
        return None
    if t == "Point":
        lon, lat = c[0], c[1]
    elif t == "Polygon":
        ring = c[0]                       # cincin luar
        lon = sum(p[0] for p in ring) / len(ring)
        lat = sum(p[1] for p in ring) / len(ring)
    elif t == "MultiPolygon":
        ring = c[0][0]
        lon = sum(p[0] for p in ring) / len(ring)
        lat = sum(p[1] for p in ring) / len(ring)
    else:
        return None
    return lat, lon'''))

# 5
cells.append(md("### Fungsi 5 — `classify(props)`",
"Menentukan kategori fasilitas dari tag `#loc+amenity`. Kategori di luar daftar utama dikelompokkan menjadi `lainnya`."))
cells.append(code(
'''KATEGORI_UTAMA = {"hospital", "clinic", "doctors", "pharmacy", "dentist"}

def classify(props):
    """Kembalikan kategori fasilitas (string) dari properti HXL."""
    amenity = (props.get(F_AMENITY) or "").strip().lower()
    if amenity in KATEGORI_UTAMA:
        return amenity
    if (props.get(F_HEALTHCARE) or "").strip():
        return "clinic"          # punya tag healthcare tapi amenity kosong
    return "lainnya"'''))

# 6
cells.append(md("### Fungsi 6 — `geojson_to_dataframe(gj)`",
"Mengubah seluruh fitur GeoJSON menjadi tabel `pandas` berisi name, kategori, lat, lon, alamat, telepon."))
cells.append(code(
'''def geojson_to_dataframe(gj):
    """Konversi FeatureCollection menjadi pandas DataFrame."""
    baris = []
    for ft in gj.get("features", []):
        titik = feature_to_point(ft)
        if titik is None:
            continue
        lat, lon = titik
        p = ft.get("properties", {})
        alamat = " ".join(filter(None, [
            str(p.get("addr_street", "")).strip(),
            str(p.get("addr_city", "")).strip(),
        ])).strip()
        baris.append({
            "name": (p.get(F_NAME) or "Tanpa Nama").strip() or "Tanpa Nama",
            "kategori": classify(p),
            "lat": lat, "lon": lon,
            "alamat": alamat or "-",
            "telepon": (p.get(F_PHONE) or "-").strip() or "-",
        })
    df = pd.DataFrame(baris)
    print(f"Terkonversi: {len(df)} fasilitas.")
    return df'''))

# 7
cells.append(md("### Fungsi 7 — `clean_data(df)`",
"Membersihkan data: buang duplikat, filter koordinat di dalam wilayah Indonesia, dan (opsional) saring hanya kategori utama."))
cells.append(code(
'''def clean_data(df, hanya_utama=True, bbox=BANDUNG_BBOX):
    """Bersihkan DataFrame: drop duplikat, lalu filter ke bounding box wilayah studi (Bandung)."""
    if df.empty:
        return df
    df = df.drop_duplicates(subset=["name", "lat", "lon"]).copy()
    if bbox:   # filter wilayah studi (default: Bandung Raya)
        df = df[df.lat.between(*bbox["lat"]) & df.lon.between(*bbox["lon"])]
    if hanya_utama:
        df = df[df.kategori != "lainnya"]
    df = df.reset_index(drop=True)
    print(f"Data bersih (wilayah studi): {len(df)} fasilitas.")
    print(df["kategori"].value_counts().to_string())
    return df'''))

# 8
cells.append(md("### Fungsi 8 — `create_base_map(center, zoom)`",
"Membuat peta dasar. Default berpusat di **Kota Bandung** (Gedung Sate, zoom 12 agar skala kota terlihat jelas)."))
cells.append(code(
'''def create_base_map(center=BANDUNG_CENTER, zoom=12):
    """Buat objek peta Folium dengan basemap OSM + opsi CartoDB (default berpusat di Bandung)."""
    m = folium.Map(location=center, zoom_start=zoom, tiles="OpenStreetMap", control_scale=True)
    folium.TileLayer("CartoDB positron", name="CartoDB Light").add_to(m)
    return m'''))

# 9
cells.append(md("### Fungsi 9 — `add_markers(m, df)`",
"Menambahkan marker tiap fasilitas dengan **warna sesuai kategori** dan **popup** (nama, kategori, alamat, telepon)."))
cells.append(code(
'''def add_markers(m, df, ke_layer=None):
    """Tambahkan marker tiap fasilitas. ke_layer: tujuan (mis. MarkerCluster)."""
    target = ke_layer if ke_layer is not None else m
    for _, r in df.iterrows():
        warna = WARNA_KATEGORI.get(r["kategori"], "gray")
        ikon  = IKON_KATEGORI.get(r["kategori"], "info-sign")
        popup_html = (f"<b>{r['name']}</b><br>"
                      f"Kategori: {r['kategori']}<br>"
                      f"Alamat: {r['alamat']}<br>"
                      f"Telp: {r['telepon']}")
        # Kolom opsional hasil enrichment Google Places (bila ada & terisi)
        for label, kol in [("Rating", "rating"), ("Jam", "jam_buka"), ("Web", "website")]:
            v = r.get(kol)
            if v not in (None, "", "-") and str(v).lower() != "nan":
                popup_html += f"<br>{label}: {v}"
        folium.Marker(
            location=[r["lat"], r["lon"]],
            popup=folium.Popup(popup_html, max_width=260),
            tooltip=r["name"],
            icon=folium.Icon(color=warna, icon=ikon, prefix="fa"),
        ).add_to(target)
    return m'''))

# 10
cells.append(md("### Fungsi 10 — `add_marker_cluster(m, df)`",
"Mengelompokkan marker berdekatan (clustering) — penting karena ada ribuan titik."))
cells.append(code(
'''def add_marker_cluster(m, df):
    """Tambahkan layer MarkerCluster berisi semua fasilitas."""
    cluster = MarkerCluster(name="Fasilitas (Cluster)")
    add_markers(m, df, ke_layer=cluster)
    cluster.add_to(m)
    return m'''))

# 11
cells.append(md("### Fungsi 11 — `add_heatmap(m, df)`", "Menambahkan layer **heatmap** untuk melihat kepadatan sebaran fasilitas."))
cells.append(code(
'''def add_heatmap(m, df):
    """Tambahkan layer heatmap kepadatan fasilitas."""
    titik = df[["lat", "lon"]].values.tolist()
    HeatMap(titik, name="Kepadatan (Heatmap)", radius=12, blur=10).add_to(m)
    return m'''))

# 12
cells.append(md("### Fungsi 12 — `add_legend(m)`", "Menambahkan legenda warna kategori sebagai elemen HTML di atas peta."))
cells.append(code(
'''def add_legend(m):
    """Sisipkan legenda warna kategori ke dalam peta (HTML)."""
    item = "".join(
        f'<div><span style="background:{w};width:12px;height:12px;'
        f'display:inline-block;margin-right:6px;border-radius:2px;"></span>{k}</div>'
        for k, w in WARNA_KATEGORI.items()
    )
    legend = f"""
    <div style="position:fixed;bottom:30px;left:30px;z-index:9999;
                background:white;padding:10px 14px;border:1px solid #999;
                border-radius:6px;font-size:13px;box-shadow:0 1px 4px rgba(0,0,0,.3);">
      <b>Legenda Kategori</b>{item}
    </div>"""
    m.get_root().html.add_child(folium.Element(legend))
    return m'''))

# 13
cells.append(md("### Fungsi 13 — `add_layer_control(m)`", "Menambahkan kontrol layer (on/off) untuk basemap, cluster, dan heatmap."))
cells.append(code(
'''def add_layer_control(m):
    """Tambahkan LayerControl agar layer bisa dinyalakan/dimatikan."""
    folium.LayerControl(collapsed=False).add_to(m)
    return m'''))

# 14
cells.append(md("### Fungsi 14 — `build_webgis(path)` (fungsi utama)",
"Merangkai seluruh fungsi: baca GeoJSON → tabel → bersihkan → buat peta → marker+cluster → heatmap → legenda → kontrol layer.",
"",
"Parameter `bbox` menentukan wilayah studi (default **Bandung Raya**); ganti ke `None` untuk seluruh Indonesia, atau ke bounding box kota lain."))
cells.append(code(
'''def build_webgis(path=GEOJSON_PATH, hanya_utama=True, bbox=BANDUNG_BBOX,
                 center=BANDUNG_CENTER, zoom=12):
    """Pipeline utama Web SIG fasilitas kesehatan Kota Bandung. Kembalikan (peta, df)."""
    gj = load_geojson(path)
    df = clean_data(geojson_to_dataframe(gj), hanya_utama=hanya_utama, bbox=bbox)
    if df.empty:
        raise ValueError("Data kosong setelah dibersihkan.")

    m = create_base_map(center=center, zoom=zoom)
    add_marker_cluster(m, df)   # ±348 titik, tak perlu disampel
    add_heatmap(m, df)
    add_legend(m)
    add_layer_control(m)
    print(f"Peta dibuat. Total fasilitas dipetakan: {len(df)}")
    return m, df'''))

cells.append(md("### Jalankan prototipe",
"**Sumber data utama tugas ini = Google Places API** (lengkap dengan telepon). Peta dibuat di bagian **▶ JALANKAN** di paling bawah notebook (setelah Fungsi 21 terdefinisi).",
"",
"Sel di bawah ini **sengaja tidak menjalankan apa-apa** agar notebook tidak error saat dijalankan berurutan. "
"Alternatif OSM (`build_webgis(GEOJSON_PATH)`) tetap tersedia bila kamu mengunggah `indonesia_hxl.geojson`."))
cells.append(code(
'''# Data diambil dari Google Places di bagian "▶ JALANKAN (Sumber: Google Places)" paling bawah.
# Alternatif OSM (perlu unggah file): peta, df = build_webgis(GEOJSON_PATH, hanya_utama=True)
print("Scroll ke bagian '▶ JALANKAN' di bawah untuk membuat peta dari Google Places.")'''))

cells.append(md("### Tampilkan peta interaktif",
"Sel `peta` di bawah hanya menampilkan peta **setelah** bagian ▶ JALANKAN dijalankan."))
cells.append(code("peta if 'peta' in globals() else print(\"Jalankan bagian '▶ JALANKAN' di bawah dulu.\")"))

# 15
cells.append(md("### Fungsi 15 — `save_map(m, path)`", "Menyimpan peta sebagai file **HTML** mandiri (siap di-deploy ke web hosting / GitHub Pages)."))
cells.append(code(
'''def save_map(m, path="webgis_faskes.html"):
    """Simpan peta ke file HTML; di Colab file muncul di panel Files."""
    m.save(path)
    print("Peta tersimpan:", path)
    return path

if 'peta' in globals():
    save_map(peta)
else:
    print("Buat peta dulu di bagian '▶ JALANKAN' di bawah.")'''))

cells.append(md("### (Opsional) Unduh hasil dari Colab"))
cells.append(code(
'''try:
    from google.colab import files
    files.download("webgis_faskes.html")
except Exception as e:
    print("Lewati (bukan di Colab):", e)'''))

# ============== FITUR TAMBAHAN (sesuai demo perkuliahan) ==============
cells.append(md(
"---",
"# FITUR TAMBAHAN",
"",
"Bagian ini menambah tiga kemampuan inti SIG yang ditunjukkan saat perkuliahan: "
"**(A) perhitungan jarak geografis + menarik garis di peta**, "
"**(B) pencarian fasilitas terdekat**, dan "
"**(C) GUI interaktif (ipywidgets)** berupa aplikasi mini *Faskes Finder* dengan dropdown & tombol — "
"membuktikan SIG bukan sekadar gambar, melainkan sistem matematis yang mengolah latitude/longitude di atas data tabular."
))

# 16
cells.append(md("### Fungsi 16 — `hitung_jarak_km(...)` (Perhitungan Jarak Geografis)",
"Menghitung jarak **garis lurus** antara dua koordinat di permukaan bumi dengan rumus **Haversine** "
"(memperhitungkan kelengkungan bumi, radius 6.371 km). Inilah dasar matematis SIG."))
cells.append(code(
'''import math

def hitung_jarak_km(lat1, lon1, lat2, lon2):
    """Jarak garis lurus (km) antara dua koordinat — rumus Haversine."""
    R = 6371.0  # radius bumi (km)
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlmb = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(p1)*math.cos(p2)*math.sin(dlmb/2)**2
    return 2 * R * math.asin(math.sqrt(a))

# Contoh di Kota Bandung: Gedung Sate -> Alun-Alun Bandung
gedung_sate = (-6.9025, 107.6186)
alun_alun   = (-6.9217, 107.6070)
print(f"Jarak Gedung Sate - Alun-Alun Bandung: {hitung_jarak_km(*gedung_sate, *alun_alun):.2f} km")'''))

# 17
cells.append(md("### Fungsi 17 — `peta_jarak(t1, t2)` (Tarik Garis di Peta)",
"Menampilkan peta dengan dua marker dan **garis lurus (PolyLine)** penghubung, beserta **label jarak** di tengah garis — seperti demonstrasi perhitungan jarak di kelas (di sini: Gedung Sate → Alun-Alun Bandung)."))
cells.append(code(
'''def peta_jarak(t1, t2, label1="Titik A", label2="Titik B"):
    """Peta dengan 2 marker + garis lurus + label jarak (km)."""
    jarak = hitung_jarak_km(t1[0], t1[1], t2[0], t2[1])
    tengah = ((t1[0]+t2[0])/2, (t1[1]+t2[1])/2)
    m = create_base_map(center=tengah, zoom=8)
    folium.Marker(t1, tooltip=label1, icon=folium.Icon(color="red")).add_to(m)
    folium.Marker(t2, tooltip=label2, icon=folium.Icon(color="blue")).add_to(m)
    folium.PolyLine([t1, t2], color="purple", weight=3, dash_array="8").add_to(m)
    folium.map.Marker(
        tengah,
        icon=folium.DivIcon(html=f'<div style="background:white;border:1px solid #555;'
                                 f'border-radius:4px;padding:2px 6px;font-size:12px;">'
                                 f'{jarak:.1f} km</div>')
    ).add_to(m)
    return m

peta_jarak(gedung_sate, alun_alun, "Gedung Sate", "Alun-Alun Bandung")'''))

# 18
cells.append(md("### Fungsi 18 — `faskes_terdekat(df, lat, lon, n)` (Fasilitas Terdekat)",
"Mengurutkan fasilitas berdasarkan jarak dari satu titik (mis. lokasi pengguna) dan mengembalikan `n` terdekat — dasar fitur 'cari faskes terdekat'."))
cells.append(code(
'''def faskes_terdekat(df, lat, lon, n=5):
    """Kembalikan n fasilitas terdekat dari titik (lat, lon), dengan kolom jarak_km."""
    d = df.copy()
    d["jarak_km"] = d.apply(lambda r: hitung_jarak_km(lat, lon, r["lat"], r["lon"]), axis=1)
    return d.nsmallest(n, "jarak_km")[["name", "kategori", "alamat", "jarak_km"]]

# Contoh: 5 fasilitas terdekat dari Gedung Sate, Bandung (jalankan ▶ JALANKAN dulu agar df tersedia)
faskes_terdekat(df, -6.9025, 107.6186, n=5) if 'df' in globals() else print("Buat df dulu di bagian '▶ JALANKAN'.")'''))

# 19
cells.append(md("### Fungsi 19 — `buat_gui(df)` (GUI Interaktif — ipywidgets)",
"Aplikasi mini **Faskes Finder** langsung di dalam notebook: **dropdown kategori** + **kotak pencarian nama** + **tombol** yang menampilkan peta terfilter. "
"Konsepnya sama dengan demo *Promo Finder* / *Lokasi Rawan Bencana* di kelas — menumpuk data tabular terpilih di atas peta spasial."))
cells.append(code(
'''def buat_gui(df):
    """Tampilkan aplikasi mini interaktif (dropdown + cari + tombol) untuk memetakan faskes."""
    import ipywidgets as widgets
    from IPython.display import display, clear_output

    opsi_kategori = ["(semua)"] + sorted(df["kategori"].unique().tolist())
    dd_kat = widgets.Dropdown(options=opsi_kategori, value="(semua)", description="Kategori:")
    txt    = widgets.Text(description="Cari nama:", placeholder="mis. RSUD, Apotek")
    tombol = widgets.Button(description="Tampilkan Peta", button_style="primary", icon="search")
    out    = widgets.Output()

    def on_click(_):
        with out:
            clear_output(wait=True)
            sub = df.copy()
            if dd_kat.value != "(semua)":
                sub = sub[sub["kategori"] == dd_kat.value]
            if txt.value.strip():
                sub = sub[sub["name"].str.contains(txt.value.strip(), case=False, na=False)]
            print(f"{len(sub)} fasilitas ditemukan.")
            if sub.empty:
                return
            m = create_base_map(center=(sub.lat.mean(), sub.lon.mean()), zoom=12)
            add_marker_cluster(m, sub)
            add_legend(m); add_layer_control(m)
            display(m)

    tombol.on_click(on_click)
    display(widgets.HBox([dd_kat, txt, tombol]), out)

if 'df' in globals():
    buat_gui(df)
else:
    print("Buat df dulu di bagian '▶ JALANKAN' di bawah.")'''))

# ============== FITUR OPSIONAL: ENRICHMENT GOOGLE PLACES ==============
cells.append(md(
"---",
"# FITUR OPSIONAL — Lengkapi Data via Google Places API",
"",
"Data OpenStreetMap (`indonesia_hxl.geojson`) **lengkap koordinat & kategorinya**, tetapi atribut kontak jarang terisi "
"(telepon ±0%, alamat ±17% dari 348 faskes Bandung). Bagian ini **opsional** dan butuh **API key Google Places** "
"(gratis dengan kuota; aktifkan billing). Fungsi di bawah mengambil **telepon, alamat lengkap, jam buka, rating, dan website** "
"langsung dari Google Maps untuk tiap fasilitas, lalu menimpanya ke `df`.",
"",
"> ⚠️ **Catatan integritas data:** ini data **asli dari Google**, bukan buatan sendiri. Jangan klaim sebagai dataset milik pribadi, "
"dan jangan menempel API key di tempat publik (GitHub, dsb). ToS Google membatasi penyimpanan permanen data Places.",
"",
"> Jika dosen meminta tetap memakai OSM apa adanya, **lewati seluruh bagian ini** — prototipe sudah berfungsi penuh tanpa fitur ini."
))

# 20
cells.append(md("### Fungsi 20 — `enrich_with_google_places(df)` (opsional)",
"Untuk tiap fasilitas: cari `place_id` dari **nama + koordinat** (Find Place), lalu ambil detail kontak (Place Details). "
"Parameter `max_calls` membatasi jumlah panggilan agar kuota aman saat uji coba — mulai kecil (mis. 50), naikkan bertahap."))
cells.append(code(
'''import requests, time, json

# >>> API KEY GOOGLE PLACES (Places API New) <<<
GOOGLE_API_KEY = "AIzaSyAbdg6N8tlRkjLAV7ppGxziw6lVJZdPBOc"   # key demo (Places API New aktif)

def _places_find_id(nama, lat, lon, key):
    """Cari place_id paling cocok dari nama + lokasi (Text Search - Places API New)."""
    url = "https://places.googleapis.com/v1/places:searchText"
    headers = {"Content-Type": "application/json", "X-Goog-Api-Key": key,
               "X-Goog-FieldMask": "places.id"}
    body = {"textQuery": nama,
            "locationBias": {"circle": {"center": {"latitude": lat, "longitude": lon},
                                        "radius": 2000.0}}}
    r = requests.post(url, headers=headers, data=json.dumps(body), timeout=15)
    places = r.json().get("places", []) if r.status_code == 200 else []
    return places[0]["id"] if places else None

def _places_details(place_id, key):
    """Ambil telepon/alamat/jam/rating/website dari place_id (Place Details - Places API New)."""
    url = f"https://places.googleapis.com/v1/places/{place_id}"
    headers = {"X-Goog-Api-Key": key,
               "X-Goog-FieldMask": ("nationalPhoneNumber,formattedAddress,"
                                    "regularOpeningHours,rating,websiteUri")}
    res = requests.get(url, headers=headers, timeout=15).json()
    oh = res.get("regularOpeningHours") or {}
    return {
        "telepon":  res.get("nationalPhoneNumber", ""),
        "alamat":   res.get("formattedAddress", ""),
        "jam_buka": "; ".join(oh.get("weekdayDescriptions", [])) if oh else "",
        "rating":   res.get("rating", ""),
        "website":  res.get("websiteUri", ""),
    }

def enrich_with_google_places(df, key=None, max_calls=50, jeda=0.2, verbose=True):
    """Lengkapi df dengan telepon/alamat/jam buka/rating/website dari Google Places API.

    key      : API key Google Places (default ambil dari GOOGLE_API_KEY).
    max_calls: batas jumlah fasilitas yang di-query (lindungi kuota saat uji coba).
    Kembalikan df baru; kolom 'telepon'/'alamat' ditimpa bila Google punya datanya.
    """
    key = key or GOOGLE_API_KEY
    if not key:
        raise ValueError("GOOGLE_API_KEY masih kosong — tempel API key kamu dulu.")
    out = df.copy()
    for c in ["jam_buka", "rating", "website"]:
        if c not in out.columns:
            out[c] = ""
    n = min(max_calls, len(out))
    dapat_telp = 0
    for i in range(n):
        r = out.iloc[i]
        try:
            pid = _places_find_id(r["name"], r["lat"], r["lon"], key)
            if pid:
                for k, v in _places_details(pid, key).items():
                    if v not in (None, ""):
                        out.at[out.index[i], k] = v
                if out.at[out.index[i], "telepon"] not in ("", "-"):
                    dapat_telp += 1
        except Exception as e:
            if verbose:
                print(f"  ! gagal '{r['name']}': {e}")
        time.sleep(jeda)   # sopan ke API + hindari rate limit
    if verbose:
        print(f"Selesai: {n} fasilitas di-query, {dapat_telp} mendapat nomor telepon.")
        if n < len(out):
            print(f"Sisa {len(out)-n} belum di-query — naikkan max_calls untuk melanjutkan.")
    return out

# --- Cara pakai (jalankan SETELAH build_webgis menghasilkan df) ---
# 1) Isi GOOGLE_API_KEY di atas.
# 2) df = enrich_with_google_places(df, max_calls=50)   # uji 50 dulu, lalu naikkan
# 3) Bangun ulang peta agar popup memakai data terbaru:
#    peta = create_base_map(); add_marker_cluster(peta, df); add_heatmap(peta, df)
#    add_legend(peta); add_layer_control(peta)
#    peta'''))

# ============== SUMBER DATA 100% GOOGLE PLACES (tanpa OSM) ==============
cells.append(md(
"---",
"# SUMBER DATA ALTERNATIF — 100% Google Places (tanpa OSM)",
"",
"Bagian ini **mengganti** sumber data: alih-alih membaca `indonesia_hxl.geojson`, seluruh data faskes Bandung "
"diambil **langsung dari Google Places API** — sudah lengkap **telepon, alamat, jam buka, rating, website**. "
"Tidak perlu file GeoJSON sama sekali.",
"",
"Memakai **Places API (New) Text Search** (`places:searchText`) dengan beberapa kata kunci "
"('rumah sakit', 'klinik', 'puskesmas', 'apotek', 'dokter gigi', 'laboratorium klinik') di Kota Bandung. "
"Tiap kata kunci diambil sampai 3 halaman (≈60 hasil), lalu digabung & dibuang duplikatnya berdasarkan `place_id`. "
"**Hanya ≈18 panggilan** (hemat kuota) dan telepon/alamat/jam/rating sudah ikut di tiap hasil.",
"",
"> ⚠️ **Butuh `GOOGLE_API_KEY` (lihat Fungsi 20) + billing aktif.** Pencarian grid memakai banyak panggilan API "
"(masih dalam kredit gratis, tapi **uji dulu dengan `max_titik=4`** sebelum menjalankan penuh).",
"",
"> ⚠️ **Integritas data:** ini data milik Google Maps, bukan dataset buatan sendiri."
))

# 21
cells.append(md("### Fungsi 21 — `fetch_faskes_google()` (data dari Google, bukan OSM)",
"Mengembalikan `df` dengan kolom yang sama seperti pipeline OSM (name, kategori, lat, lon, alamat, telepon, rating, jam_buka, website), "
"sehingga bisa langsung dipakai `add_marker_cluster`, `add_heatmap`, `faskes_terdekat`, dan `buat_gui`."))
cells.append(code(
'''def _kategori_google(types):
    """Petakan daftar 'types' Google (New API) -> kategori kita."""
    t = set(types or [])
    if "hospital" in t:                         return "hospital"
    if "pharmacy" in t or "drugstore" in t:     return "pharmacy"
    if "dentist" in t or "dental_clinic" in t:  return "dentist"
    if "doctor" in t:                           return "doctors"
    return "clinic"

def _text_search(query, key, max_pages=3):
    """Text Search (Places API New): cari faskes per kata kunci; sampai 3 halaman (≈60 hasil).
    Jauh lebih hemat panggilan daripada grid, dan memakai kuota metrik berbeda."""
    url = "https://places.googleapis.com/v1/places:searchText"
    fieldmask = ("places.id,places.displayName,places.location,places.types,"
                 "places.nationalPhoneNumber,places.formattedAddress,places.rating,"
                 "places.regularOpeningHours,places.websiteUri,nextPageToken")
    headers = {"Content-Type": "application/json", "X-Goog-Api-Key": key,
               "X-Goog-FieldMask": fieldmask}
    body = {"textQuery": query, "pageSize": 20}
    out = []
    for _ in range(max_pages):
        r = requests.post(url, headers=headers, data=json.dumps(body), timeout=20)
        if r.status_code != 200:
            print(f"  ! Google {r.status_code}: {r.text[:140]}")
            break
        j = r.json()
        out += j.get("places", [])
        token = j.get("nextPageToken")
        if not token:
            break
        time.sleep(2)                       # token butuh jeda agar aktif
        body = {"textQuery": query, "pageSize": 20, "pageToken": token}
    return out

def _grid_titik(bbox, step_km):
    """Buat daftar titik (lat, lon) berjarak ~step_km menutupi bbox."""
    lat0, lat1 = bbox["lat"]; lon0, lon1 = bbox["lon"]
    dlat = step_km / 111.0
    dlon = step_km / (111.0 * math.cos(math.radians((lat0 + lat1) / 2)))
    titik, la = [], lat0
    while la <= lat1 + 1e-9:
        lo = lon0
        while lo <= lon1 + 1e-9:
            titik.append((round(la, 6), round(lo, 6)))
            lo += dlon
        la += dlat
    return titik

def fetch_faskes_google(key=None, bbox=BANDUNG_BBOX, queries=None, max_pages=3,
                        jeda=0.5, verbose=True):
    """Ambil faskes Bandung dari Google Places (Places API New, Text Search). Kembalikan DataFrame.

    Hemat: ±6 kata kunci x 3 halaman ≈ 18 panggilan (bukan ratusan seperti grid).
    queries: dict {kata_kunci: kategori_paksa atau None}. None = kategori ditebak dari 'types'.
    """
    key = key or GOOGLE_API_KEY
    if not key:
        raise ValueError("GOOGLE_API_KEY masih kosong — isi di sel Fungsi 20 dulu.")
    if queries is None:
        queries = {
            "rumah sakit di Kota Bandung":          None,
            "klinik di Kota Bandung":               "clinic",
            "puskesmas di Kota Bandung":            "clinic",
            "apotek di Kota Bandung":               "pharmacy",
            "dokter gigi di Kota Bandung":          "dentist",
            "laboratorium klinik di Kota Bandung":  "clinic",
        }
    seen = {}
    for q, kat_paksa in queries.items():
        if verbose:
            print(f"Mencari: '{q}' ...")
        for p in _text_search(q, key, max_pages=max_pages):
            pid = p.get("id")
            if not pid or pid in seen:
                continue
            loc = p.get("location") or {}
            oh = p.get("regularOpeningHours") or {}
            seen[pid] = {
                "name": (p.get("displayName") or {}).get("text", "Tanpa Nama"),
                "kategori": kat_paksa or _kategori_google(p.get("types")),
                "lat": loc.get("latitude"), "lon": loc.get("longitude"),
                "alamat": p.get("formattedAddress", "-") or "-",
                "telepon": p.get("nationalPhoneNumber", "-") or "-",
                "website": p.get("websiteUri", "") or "",
                "rating": p.get("rating", "") or "",
                "jam_buka": "; ".join(oh.get("weekdayDescriptions", [])) if oh else "",
            }
        time.sleep(jeda)

    df = pd.DataFrame(seen.values())
    if df.empty:
        print("Tidak ada hasil. Cek API key / Places API (New) aktif?")
        return df
    df = df.dropna(subset=["lat", "lon"])
    df = df[df.lat.between(*bbox["lat"]) & df.lon.between(*bbox["lon"])].reset_index(drop=True)
    if verbose:
        punya_telp = (df["telepon"].astype(str) != "-").sum()
        print(f"Selesai: {len(df)} faskes dari Google, {punya_telp} punya telepon.")
        print(df["kategori"].value_counts().to_string())
    return df

# --- Cara pakai (GANTI pipeline OSM) ---
# 1) Isi GOOGLE_API_KEY di sel Fungsi 20.
# 2) UJI dulu (murah, sedikit titik):
#    df = fetch_faskes_google(max_titik=4)
# 3) Kalau hasilnya bagus, jalankan penuh (seluruh Bandung):
#    df = fetch_faskes_google()
# 4) Petakan seperti biasa:
#    peta = create_base_map(); add_marker_cluster(peta, df); add_heatmap(peta, df)
#    add_legend(peta); add_layer_control(peta)
#    peta'''))

# ============== SUMBER DATA FOURSQUARE (gratis, tanpa kartu) ==============
cells.append(md(
"---",
"# SUMBER DATA — Foursquare Places (gratis, tanpa kartu kredit)",
"",
"Alternatif Google yang **tidak butuh billing/kartu**: **Foursquare Places API**. Daftar gratis di "
"**https://foursquare.com/developers** → buat project → ambil **API Key (Service Key)**. "
"Free tier ±**500 panggilan/bulan** — cukup, karena tiap panggilan mengembalikan **sampai 50 faskes lengkap dengan telepon** sekaligus.",
"",
"Data yang didapat: **nama, koordinat, alamat, telepon, website, rating, jam buka** — langsung dari Foursquare (bukan OSM).",
"",
"> ⚠️ **Uji dulu** dengan `max_titik=1` untuk memastikan API key benar sebelum menjalankan penuh.",
"> Integritas data: ini data milik Foursquare, bukan dataset buatan sendiri."
))

# 22
cells.append(md("### Fungsi 22 — `fetch_faskes_foursquare()` (gratis tanpa kartu)",
"Mencari faskes Bandung lewat grid titik + kata kunci ('rumah sakit', 'klinik', 'apotek', 'dokter gigi', 'dokter'). "
"Mengembalikan `df` berkolom sama seperti pipeline lain, siap dipakai `add_marker_cluster`, `faskes_terdekat`, `buat_gui`."))
cells.append(code(
'''# >>> API KEY FOURSQUARE (Service Key) — daftar gratis, TANPA kartu <<<
FSQ_API_KEY  = ""            # tempel API key Foursquare kamu di sini
FSQ_VERSION  = "2025-06-17"  # versi header API Foursquare

# Kata kunci pencarian -> kategori kita
_FSQ_QUERY = {
    "rumah sakit": "hospital",
    "klinik":      "clinic",
    "apotek":      "pharmacy",
    "dokter gigi": "dentist",
    "dokter":      "doctors",
}

def _fsq_search(ll, radius, query, key, max_pages=2):
    """Foursquare Places Search di satu titik untuk satu kata kunci (maks 50/halaman)."""
    url = "https://places-api.foursquare.com/places/search"
    headers = {"accept": "application/json",
               "authorization": f"Bearer {key}",
               "X-Places-Api-Version": FSQ_VERSION}
    params = {"ll": ll, "radius": radius, "query": query, "limit": 50,
              "fields": "fsq_place_id,name,location,geocodes,tel,website,rating,hours,categories"}
    hasil = []
    for _ in range(max_pages):
        r = requests.get(url, headers=headers, params=params, timeout=20)
        if r.status_code != 200:
            print(f"  ! Foursquare {r.status_code}: {r.text[:200]}")
            break
        hasil += r.json().get("results", [])
        nxt = r.links.get("next", {}).get("url")
        if not nxt:
            break
        url, params = nxt, None     # URL halaman berikutnya sudah lengkap
    return hasil

def _fsq_parse(res, kategori):
    """Ubah satu hasil Foursquare menjadi baris df (parsing defensif)."""
    loc  = res.get("location") or {}
    main = ((res.get("geocodes") or {}).get("main")) or {}
    return {
        "_id":     res.get("fsq_place_id") or res.get("fsq_id"),
        "name":    res.get("name", "Tanpa Nama") or "Tanpa Nama",
        "kategori": kategori,
        "lat":     main.get("latitude"),
        "lon":     main.get("longitude"),
        "alamat":  loc.get("formatted_address") or loc.get("address") or "-",
        "telepon": res.get("tel") or "-",
        "website": res.get("website") or "",
        "rating":  res.get("rating") or "",
        "jam_buka": (res.get("hours") or {}).get("display") or "",
    }

def fetch_faskes_foursquare(key=None, bbox=BANDUNG_BBOX, radius=4000, step_km=6,
                            max_titik=None, jeda=0.2, verbose=True):
    """Ambil faskes Bandung dari Foursquare Places (grid + kata kunci). Kembalikan DataFrame.

    radius   : radius pencarian tiap titik (meter).
    step_km  : jarak antar titik grid (km). Kecil = lengkap = lebih banyak panggilan.
    max_titik: batasi jumlah titik grid (UJI COBA). None = semua.
    """
    key = key or FSQ_API_KEY
    if not key:
        raise ValueError("FSQ_API_KEY masih kosong — tempel API key Foursquare dulu.")
    grid = _grid_titik(bbox, step_km)
    if max_titik:
        grid = grid[:max_titik]
    if verbose:
        print(f"Grid: {len(grid)} titik x {len(_FSQ_QUERY)} kata kunci. Mengambil dari Foursquare...")

    seen = {}
    for idx, (la, lo) in enumerate(grid, 1):
        for q, kat in _FSQ_QUERY.items():
            for res in _fsq_search(f"{la},{lo}", radius, q, key):
                rec = _fsq_parse(res, kat)
                if rec["_id"] and rec["_id"] not in seen and rec["lat"] is not None:
                    seen[rec["_id"]] = rec
            time.sleep(jeda)
        if verbose and idx % 3 == 0:
            print(f"  titik {idx}/{len(grid)} ... terkumpul {len(seen)} faskes unik")

    df = pd.DataFrame(seen.values())
    if df.empty:
        print("Tidak ada hasil. Cek API key Foursquare / kuota.")
        return df
    df = df[df.lat.between(*bbox["lat"]) & df.lon.between(*bbox["lon"])]
    df = df.drop(columns=["_id"]).reset_index(drop=True)
    if verbose:
        punya_telp = (df["telepon"].astype(str) != "-").sum()
        print(f"Selesai: {len(df)} faskes dari Foursquare, {punya_telp} punya telepon.")
        print(df["kategori"].value_counts().to_string())
    return df

# --- Cara pakai ---
# 1) Daftar di https://foursquare.com/developers (gratis, tanpa kartu) -> salin API Key.
# 2) Isi FSQ_API_KEY di atas.
# 3) UJI dulu: df = fetch_faskes_foursquare(max_titik=1)
#              df.head(10)        # pastikan kolom telepon terisi
# 4) Penuh   : df = fetch_faskes_foursquare()
# 5) Petakan : peta = create_base_map(); add_marker_cluster(peta, df); add_heatmap(peta, df)
#              add_legend(peta); add_layer_control(peta); peta'''))

# ============== BAGIAN UTAMA: JALANKAN (Sumber: Google Places) ==============
cells.append(md(
"---",
"# ▶ JALANKAN — Buat Peta dari Google Places",
"",
"Inilah **sel utama** yang dijalankan untuk menghasilkan peta. Data faskes Bandung diambil **langsung dari Google Places** "
"(lengkap telepon/alamat/rating), lalu dipetakan dengan marker per-kategori + cluster + heatmap + legenda.",
"",
"> Pastikan sel **Import & konfigurasi**, **Fungsi 8–13**, dan **Fungsi 21** sudah dijalankan lebih dulu (Runtime → Run all paling mudah).",
"",
"> ⚠️ Key yang dipakai adalah **key demo bersama** dengan kuota harian terbatas. Metode Text Search hanya ≈18 panggilan, "
"jadi cukup jalankan **sekali**. Bila muncul error `429 Quota exceeded`, kuota harian key sedang habis — coba lagi besok atau pakai API key sendiri."
))
cells.append(code(
'''# Ambil data faskes Bandung dari Google Places (Text Search, ≈18 panggilan — hemat kuota):
df = fetch_faskes_google()

# Buat peta dari df:
peta = create_base_map()
add_marker_cluster(peta, df)
add_heatmap(peta, df)
add_legend(peta)
add_layer_control(peta)

print(f"Total faskes dipetakan: {len(df)} | punya telepon: {(df['telepon'].astype(str) != '-').sum()}")
df.head(10)'''))

cells.append(md("### Tampilkan & simpan peta"))
cells.append(code(
'''save_map(peta)   # simpan ke webgis_faskes.html
peta             # tampilkan peta interaktif'''))

cells.append(md("### Demo fitur tambahan (jarak & faskes terdekat)",
"Setelah `df` terisi dari Google, jalankan demo perhitungan jarak dan pencarian faskes terdekat."))
cells.append(code(
'''# 5 faskes terdekat dari Gedung Sate, Bandung
faskes_terdekat(df, -6.9025, 107.6186, n=5)'''))

cells.append(md(
"---",
"## Ringkasan & Rencana Pengembangan Lanjut",
"",
"- **Sudah ada (prototipe):** baca GeoJSON OSM → filter wilayah **Bandung** (±348 faskes) → ETL pandas → peta Leaflet interaktif (marker per-kategori, cluster, heatmap, legenda, kontrol layer, ekspor HTML), **perhitungan jarak Haversine + garis di peta**, **pencarian faskes terdekat**, dan **GUI interaktif ipywidgets (Faskes Finder Bandung)**.",
"- **Lanjutan:** simpan ke **PostgreSQL/PostGIS**, sajikan via **Flask/FastAPI REST API (GeoJSON)**, frontend **Leaflet.js**, fitur *cari faskes terdekat* (ST_Distance), filter kategori & provinsi dinamis, routing.",
"",
"Setiap fungsi di atas dapat dijelaskan satu per satu saat presentasi (sesuai instruksi *per-function*)."
))

notebook = {
    "nbformat": 4, "nbformat_minor": 0,
    "metadata": {
        "colab": {"name": "WebSIG_FasilitasKesehatan.ipynb", "provenance": []},
        "kernelspec": {"name": "python3", "display_name": "Python 3"},
        "language_info": {"name": "python"},
    },
    "cells": cells,
}
with open("WebSIG_FasilitasKesehatan.ipynb", "w", encoding="utf-8") as f:
    json.dump(notebook, f, ensure_ascii=False, indent=1)
print("OK ->", len(cells), "cells")
