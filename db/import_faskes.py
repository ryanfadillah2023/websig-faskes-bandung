"""
=====================================================================
ETL — Ambil faskes Bandung dari Google Places API (SEKALI)  ->  simpan ke PostgreSQL/PostGIS
=====================================================================
Setelah script ini dijalankan, aplikasi web cukup MEMBACA dari database;
Google Places API tidak disentuh lagi (hemat kuota, cepat, stabil saat demo).

Logika pengambilan datanya SAMA PERSIS dengan notebook Colab-mu, hanya
tujuan akhirnya diganti dari Folium -> tabel fasilitas_kesehatan (PostGIS).

CARA PAKAI
----------
1. pip install -r requirements.txt
2. Buat database & jalankan dulu schema_postgis.sql (lihat file itu).
3. Isi 2 konfigurasi di bawah (GOOGLE_API_KEY & DATABASE_URL), ATAU set via
   environment variable. Contoh DATABASE_URL dari Supabase:
     postgresql://postgres:PASSWORD@db.xxxx.supabase.co:5432/postgres
4. python import_faskes.py
=====================================================================
"""
import os
import json
import time
import requests
import psycopg2
from psycopg2.extras import execute_values
from dotenv import load_dotenv

# --- KONFIGURASI: dibaca dari db/.env (jangan hardcode kredensial di file ini) ---
load_dotenv()
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY", "")
DATABASE_URL = os.environ.get(
    "DATABASE_URL", "postgresql://postgres@127.0.0.1:5432/websig_bandung"
)

# Bounding box Kota Bandung & sekitarnya (sama dengan notebook)
BBOX = {"lat": (-7.10, -6.75), "lon": (107.45, 107.85)}

# Kata kunci pencarian -> kategori (sama dengan notebook)
QUERIES = {
    "rumah sakit di Kota Bandung":         "Rumah Sakit",
    "klinik di Kota Bandung":              "Klinik",
    "puskesmas di Kota Bandung":           "Klinik",
    "apotek di Kota Bandung":              "Apotek",
    "dokter gigi di Kota Bandung":         "Dokter Gigi",
    "laboratorium klinik di Kota Bandung": "Klinik",
}


def text_search(query, key, max_pages=3):
    """Places API (New) Text Search; ambil sampai 3 halaman (~60 hasil). Hemat kuota."""
    url = "https://places.googleapis.com/v1/places:searchText"
    fieldmask = ("places.id,places.displayName,places.location,places.types,"
                 "places.nationalPhoneNumber,places.formattedAddress,places.rating,nextPageToken")
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
        time.sleep(2)   # token butuh jeda agar aktif
        body = {"textQuery": query, "pageSize": 20, "pageToken": token}
    return out


def ambil_faskes():
    """Ambil faskes Bandung dari Google Places, buang duplikat & luar bounding box."""
    seen = {}
    for q, kategori in QUERIES.items():
        print(f"Mengambil: '{q}' ...")
        for p in text_search(q, GOOGLE_API_KEY):
            pid = p.get("id")
            if not pid or pid in seen:
                continue
            loc = p.get("location") or {}
            lat, lon = loc.get("latitude"), loc.get("longitude")
            if lat is None or lon is None:
                continue
            if not (BBOX["lat"][0] <= lat <= BBOX["lat"][1] and
                    BBOX["lon"][0] <= lon <= BBOX["lon"][1]):
                continue
            rating = p.get("rating")
            seen[pid] = {
                "place_id": pid,
                "nama":     (p.get("displayName") or {}).get("text", "Nama Tidak Diketahui"),
                "kategori": kategori,
                "telepon":  p.get("nationalPhoneNumber") or None,
                "alamat":   p.get("formattedAddress") or None,
                "rating":   rating if isinstance(rating, (int, float)) else None,
                "lat": lat, "lon": lon,
            }
        time.sleep(0.5)
    return list(seen.values())


def simpan_ke_db(rows):
    """Upsert data ke tabel fasilitas_kesehatan (idempotent: aman dijalankan berulang)."""
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    # Peta nama_kategori -> id_kategori (dari tabel kategori yang sudah di-seed schema)
    cur.execute("SELECT nama_kategori, id_kategori FROM kategori;")
    kat_id = {n: i for n, i in cur.fetchall()}

    data = [(
        r["place_id"], r["nama"], kat_id.get(r["kategori"]),
        r["alamat"], r["telepon"], r["rating"],
        r["lon"], r["lat"],           # ST_MakePoint butuh urutan (lon, lat)
    ) for r in rows]

    sql = """
        INSERT INTO fasilitas_kesehatan
            (place_id, nama, id_kategori, alamat, telepon, rating, geom)
        VALUES %s
        ON CONFLICT (place_id) DO UPDATE SET
            nama        = EXCLUDED.nama,
            id_kategori = EXCLUDED.id_kategori,
            alamat      = EXCLUDED.alamat,
            telepon     = EXCLUDED.telepon,
            rating      = EXCLUDED.rating,
            geom        = EXCLUDED.geom;
    """
    # 6 kolom biasa + geom dibangun dari (lon, lat) via ST_SetSRID(ST_MakePoint(...),4326)
    template = "(%s,%s,%s,%s,%s,%s, ST_SetSRID(ST_MakePoint(%s,%s),4326))"
    execute_values(cur, sql, data, template=template)
    conn.commit()

    cur.execute("SELECT COUNT(*) FROM fasilitas_kesehatan;")
    total = cur.fetchone()[0]
    cur.close()
    conn.close()
    return total


if __name__ == "__main__":
    if not GOOGLE_API_KEY or not DATABASE_URL:
        raise SystemExit(
            "Isi dulu GOOGLE_API_KEY dan DATABASE_URL (di atas file ini atau via env var)."
        )

    print("== 1) Ambil data dari Google Places API ==")
    rows = ambil_faskes()
    print(f"   -> {len(rows)} faskes unik di area Bandung.")
    if not rows:
        raise SystemExit("Tidak ada data. Cek API key / kuota harian (error 429).")

    print("== 2) Simpan ke PostgreSQL + PostGIS ==")
    total = simpan_ke_db(rows)
    print(f"   -> Selesai. Total baris di tabel fasilitas_kesehatan: {total}")
    print("\nData sudah masuk database. Aplikasi web tinggal membaca dari sini.")
