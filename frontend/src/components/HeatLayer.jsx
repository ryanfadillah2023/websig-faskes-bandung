import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";

// Layer heatmap kepadatan. points = array [lat, lon, intensitas].
export default function HeatLayer({ points, show }) {
  const map = useMap();

  useEffect(() => {
    if (!show || !points || points.length === 0) return;
    const heat = L.heatLayer(points, {
      radius: 25,
      blur: 18,
      maxZoom: 16,
      gradient: { 0.2: "#3b82f6", 0.5: "#22c55e", 0.8: "#f59e0b", 1.0: "#ef4444" },
    });
    heat.addTo(map);
    return () => {
      map.removeLayer(heat);
    };
  }, [map, points, show]);

  return null;
}
