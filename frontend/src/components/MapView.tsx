import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet-draw';
import type { GeoJsonPolygon } from '../types';

interface Props {
  /** If true, enables draw controls for polygon creation */
  editable?: boolean;
  /** Called when user finishes drawing a polygon */
  onPolygonDrawn?: (geojson: GeoJsonPolygon) => void;
  /** Polygon to display (read-only overlay) */
  polygon?: GeoJsonPolygon;
  /** Conflict polygon to highlight in red */
  conflictPolygon?: GeoJsonPolygon;
  /** Height class */
  height?: string;
}

export default function MapView({ editable, onPolygonDrawn, polygon, conflictPolygon, height = 'h-[400px]' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Center on Tunisia
    const map = L.map(containerRef.current, {
      center: [36.8, 9.2],
      zoom: 7,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OSM',
      maxZoom: 18,
    }).addTo(map);

    mapRef.current = map;

    if (editable) {
      const drawnItems = new L.FeatureGroup();
      map.addLayer(drawnItems);

      const drawControl = new L.Control.Draw({
        draw: {
          polygon: {
            shapeOptions: {
              color: '#10b981',
              weight: 2,
              fillOpacity: 0.15,
            },
          },
          polyline: false,
          rectangle: false,
          circle: false,
          marker: false,
          circlemarker: false,
        },
        edit: { featureGroup: drawnItems },
      });
      map.addControl(drawControl);

      map.on(L.Draw.Event.CREATED, (e: any) => {
        drawnItems.clearLayers();
        const layer = e.layer;
        drawnItems.addLayer(layer);
        const coords = layer.getLatLngs()[0].map((ll: L.LatLng) => [ll.lng, ll.lat]);
        coords.push(coords[0]); // close ring
        onPolygonDrawn?.({ type: 'Polygon', coordinates: [coords] });
      });
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Show/update read-only polygon
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !polygon) return;

    const latlngs = polygon.coordinates[0].map(([lng, lat]) => [lat, lng] as [number, number]);
    const poly = L.polygon(latlngs, {
      color: '#10b981',
      weight: 2,
      fillOpacity: 0.15,
      fillColor: '#10b981',
    }).addTo(map);

    map.fitBounds(poly.getBounds(), { padding: [30, 30] });

    return () => { map.removeLayer(poly); };
  }, [polygon]);

  // Show conflict polygon in red
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !conflictPolygon) return;

    const latlngs = conflictPolygon.coordinates[0].map(([lng, lat]) => [lat, lng] as [number, number]);
    const poly = L.polygon(latlngs, {
      color: '#ef4444',
      weight: 2,
      fillOpacity: 0.2,
      fillColor: '#ef4444',
      dashArray: '8 4',
    }).addTo(map);

    return () => { map.removeLayer(poly); };
  }, [conflictPolygon]);

  return <div ref={containerRef} className={`${height} rounded-2xl border border-gray-700/50`} />;
}
