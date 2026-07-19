# Backend REST API — WebSIG Faskes Bandung

API Node.js/Express yang membaca data dari PostgreSQL + PostGIS dan menyajikannya
sebagai **GeoJSON** untuk frontend Leaflet.

## Menjalankan

```bash
npm install
npm start        # atau: npm run dev  (auto-reload)
```

Server: `http://localhost:4000` (port diatur di `.env`; 3000 dihindari karena dipakai app lain).
Koneksi database ada di `.env` (`DATABASE_URL`). Default lokal: `postgresql://postgres@127.0.0.1:5432/websig_bandung`.

## Daftar Endpoint

| Method | Path | Keterangan |
|---|---|---|
| GET | `/` | Health check |
| GET | `/api/kategori` | Daftar kategori + warna marker |
| GET | `/api/faskes` | Semua faskes (GeoJSON FeatureCollection) |
| GET | `/api/faskes?kategori=Rumah Sakit` | Filter per kategori |
| GET | `/api/faskes/terdekat?lat=&lon=&limit=&kategori=` | N faskes terdekat + `jarak_km` |

### Contoh

```bash
curl "http://localhost:4000/api/faskes?kategori=Apotek"
curl "http://localhost:4000/api/faskes/terdekat?lat=-6.9218&lon=107.6098&limit=5"
```

### Format respons (GeoJSON)

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": { "type": "Point", "coordinates": [107.6005, -6.9159] },
      "properties": {
        "id": 1, "nama": "Santosa Hospital", "kategori": "Rumah Sakit",
        "warna": "#E23B3B", "alamat": "...", "telepon": "...", "rating": "4.6"
      }
    }
  ]
}
```

Pada `/api/faskes/terdekat`, tiap `properties` juga berisi `jarak_km`.

## Struktur

- `server.js` — definisi endpoint + konversi baris DB → GeoJSON
- `db.js` — pool koneksi PostgreSQL
- `.env` — `DATABASE_URL` & `PORT` (tidak di-commit)
