-- =====================================================================
-- Skema Database WebSIG Faskes Bandung  —  PostgreSQL + PostGIS
-- Jalankan SEKALI di database kosong:
--   • Supabase  : buka SQL Editor → tempel seluruh isi file ini → Run
--   • Lokal     : psql -d nama_db -f schema_postgis.sql
-- =====================================================================

-- 1) Aktifkan PostGIS (memberi tipe "geometry" & fungsi spasial ST_*)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2) Tabel kategori (lookup: jenis faskes + warna marker untuk peta)
CREATE TABLE IF NOT EXISTS kategori (
    id_kategori   SERIAL PRIMARY KEY,          -- ganti AUTO_INCREMENT (MySQL) -> SERIAL (PostgreSQL)
    nama_kategori VARCHAR(50) UNIQUE NOT NULL,
    warna_marker  VARCHAR(10)
);

-- 3) Tabel inti fasilitas kesehatan
CREATE TABLE IF NOT EXISTS fasilitas_kesehatan (
    id_faskes   SERIAL PRIMARY KEY,
    place_id    VARCHAR(120) UNIQUE,           -- ID unik Google Places -> cegah duplikat saat import ulang
    nama        VARCHAR(200) NOT NULL,
    id_kategori INT REFERENCES kategori(id_kategori),
    alamat      VARCHAR(300),
    telepon     VARCHAR(40),
    rating      NUMERIC(2,1),
    geom        geometry(Point, 4326) NOT NULL -- titik lokasi; SRID 4326 = WGS84 (lat/lon standar peta)
);

-- 4) Index spasial GIST (WAJIB agar query "dalam radius X km" cepat)
CREATE INDEX IF NOT EXISTS idx_faskes_geom ON fasilitas_kesehatan USING GIST (geom);

-- 5) Isi kategori + warna (diambil dari color_map di notebook Colab-mu)
INSERT INTO kategori (nama_kategori, warna_marker) VALUES
    ('Rumah Sakit', '#E23B3B'),
    ('Klinik',      '#14B8A6'),
    ('Apotek',      '#22C55E'),
    ('Dokter Gigi', '#3B82F6'),
    ('Dokter',      '#8B5CF6')
ON CONFLICT (nama_kategori) DO NOTHING;

-- =====================================================================
-- CONTOH QUERY (untuk backend REST API nanti) — tidak wajib dijalankan:
--
-- a) Semua faskes sebagai GeoJSON FeatureCollection:
--    SELECT jsonb_build_object(
--      'type','FeatureCollection',
--      'features', jsonb_agg(ST_AsGeoJSON(f.*)::jsonb)
--    ) FROM fasilitas_kesehatan f;
--
-- b) 5 faskes TERDEKAT dari titik (Alun-Alun Bandung: lon 107.6098, lat -6.9218):
--    SELECT nama, ROUND((ST_Distance(
--             geom::geography,
--             ST_SetSRID(ST_MakePoint(107.6098, -6.9218),4326)::geography
--           )/1000)::numeric, 2) AS jarak_km
--    FROM fasilitas_kesehatan
--    ORDER BY geom <-> ST_SetSRID(ST_MakePoint(107.6098,-6.9218),4326)
--    LIMIT 5;
--
-- c) Faskes dalam radius 3 km dari sebuah titik:
--    SELECT nama FROM fasilitas_kesehatan
--    WHERE ST_DWithin(geom::geography,
--                     ST_SetSRID(ST_MakePoint(107.6098,-6.9218),4326)::geography,
--                     3000);
-- =====================================================================
