import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMapEvents,
  useMap,
} from "react-leaflet";
import { useEffect } from "react";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import HeatLayer from "./HeatLayer.jsx";

const BANDUNG = [-6.9175, 107.6191];
const DEFAULT_ZOOM = 13;

// Tombol "kembali ke tampilan awal" (di bawah kontrol zoom)
function ResetViewControl({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    const control = L.control({ position: "topleft" });
    control.onAdd = () => {
      const div = L.DomUtil.create("div", "leaflet-bar");
      const btn = L.DomUtil.create("a", "", div);
      btn.href = "#";
      btn.title = "Kembali ke tampilan awal (Kota Bandung)";
      btn.innerHTML = "⌖";
      btn.style.cssText =
        "font-size:20px;line-height:30px;text-align:center;font-weight:bold;";
      L.DomEvent.on(btn, "click", (e) => {
        L.DomEvent.stop(e);
        map.setView(center, zoom);
      });
      return div;
    };
    control.addTo(map);
    return () => control.remove();
  }, [map, center, zoom]);
  return null;
}

// Ikon titik faskes (divIcon berwarna -> tidak butuh gambar & bisa di-cluster)
function dotIcon(color, big) {
  const size = big ? 20 : 14;
  return L.divIcon({
    className: "",
    html: `<div style="background:${color};width:${size}px;height:${size}px;border:2px solid ${
      big ? "#111827" : "#fff"
    };border-radius:50%;box-shadow:0 0 3px rgba(0,0,0,.4)"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// Ikon titik asal (pencarian terdekat)
const originIcon = L.divIcon({
  className: "",
  html: `<div style="background:#111827;width:16px;height:16px;border:3px solid #fff;border-radius:50%;box-shadow:0 0 4px rgba(0,0,0,.5)"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// Ikon draft (lokasi faskes baru di mode admin)
const draftIcon = L.divIcon({
  className: "",
  html: `<div style="font-size:26px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,.5))">📍</div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 26],
});

function ClickHandler({ onClick }) {
  useMapEvents({
    click(e) {
      onClick({ lat: e.latlng.lat, lon: e.latlng.lng });
    },
  });
  return null;
}

// Terbang ke titik fokus (mis. hasil ketik lokasi / GPS) saat berubah
function FlyTo({ point }) {
  const map = useMap();
  useEffect(() => {
    if (point) map.flyTo([point.lat, point.lon], 15, { duration: 1 });
  }, [map, point]);
  return null;
}

// URL rute Google Maps (navigasi + kemacetan asli, dibuka di tab baru)
function gmapsUrl(origin, lat, lon) {
  const o = origin ? `&origin=${origin.lat},${origin.lon}` : "";
  return `https://www.google.com/maps/dir/?api=1${o}&destination=${lat},${lon}&travelmode=driving`;
}

export default function MapView({
  faskes,
  origin,
  nearest,
  draft,
  mode,
  cluster,
  heatmap,
  onMapClick,
  route,
  onRouteRequest,
  focus,
}) {
  const nearestIds = new Set((nearest || []).map((f) => f.properties.id));
  const heatPoints = faskes.map((f) => [
    f.geometry.coordinates[1],
    f.geometry.coordinates[0],
    0.6,
  ]);

  const markers = faskes.map((f) => {
    const [lon, lat] = f.geometry.coordinates;
    const p = f.properties;
    const hl = nearestIds.has(p.id);
    return (
      <Marker key={p.id} position={[lat, lon]} icon={dotIcon(p.warna, hl)}>
        <Popup>
          <b>{p.nama}</b>
          <br />
          <span style={{ color: p.warna }}>●</span> {p.kategori}
          <br />
          Telp: {p.telepon || "-"}
          <br />
          Alamat: {p.alamat || "-"}
          <br />
          Rating: {p.rating || "-"}
          {p.jarak_km !== undefined && (
            <>
              <br />
              <b>Jarak: {p.jarak_km} km</b>
            </>
          )}
          {onRouteRequest && (
            <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
              <button
                onClick={() => onRouteRequest({ lat, lon, nama: p.nama })}
                style={{
                  background: "#0d9488",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  padding: "4px 8px",
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                🚗 Rute ke sini
              </button>
              <a
                href={gmapsUrl(origin, lat, lon)}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: "#f3f4f6",
                  color: "#111827",
                  borderRadius: 6,
                  padding: "4px 8px",
                  fontSize: 12,
                  textDecoration: "none",
                }}
              >
                🗺️ Google Maps
              </a>
            </div>
          )}
        </Popup>
      </Marker>
    );
  });

  return (
    <MapContainer center={BANDUNG} zoom={DEFAULT_ZOOM} className="h-full w-full">
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />

      <ClickHandler onClick={onMapClick} />
      <ResetViewControl center={BANDUNG} zoom={DEFAULT_ZOOM} />
      <FlyTo point={focus} />

      {heatmap && <HeatLayer points={heatPoints} show={heatmap} />}

      {cluster ? (
        <MarkerClusterGroup chunkedLoading>{markers}</MarkerClusterGroup>
      ) : (
        markers
      )}

      {origin && <Marker position={[origin.lat, origin.lon]} icon={originIcon} />}
      {origin &&
        (nearest || []).map((f) => {
          const [lon, lat] = f.geometry.coordinates;
          return (
            <Polyline
              key={"line-" + f.properties.id}
              positions={[
                [origin.lat, origin.lon],
                [lat, lon],
              ]}
              pathOptions={{ color: "#555", dashArray: "5,6", weight: 1.5 }}
            />
          );
        })}

      {mode === "admin" && draft && (
        <Marker position={[draft.lat, draft.lon]} icon={draftIcon} />
      )}

      {route && route.coordinates?.length > 0 && (
        <Polyline
          positions={route.coordinates}
          pathOptions={{ color: "#2563eb", weight: 5, opacity: 0.75 }}
        />
      )}
    </MapContainer>
  );
}
