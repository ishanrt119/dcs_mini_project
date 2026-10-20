import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

interface Props {
  coordinates?: [number, number][]; // Line coordinates [lat, lng]
  currentPosition?: { lat: number; lng: number; stationName: string };
  stations?: Array<{ lat: number; lng: number; name: string; code: string }>;
  height?: string;
}

export const LeafletTrainMap: React.FC<Props> = ({
  coordinates = [],
  currentPosition,
  stations = [],
  height = '420px'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map if not already done
    if (!mapInstanceRef.current) {
      const defaultCenter: [number, number] = currentPosition?.lat
        ? [currentPosition.lat, currentPosition.lng]
        : coordinates.length > 0
        ? coordinates[Math.floor(coordinates.length / 2)]
        : [22.9734, 78.6569]; // Center of India

      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: currentPosition?.lat ? 7 : 5,
        attributionControl: false
      });

      // CartoDB Dark Matter tiles (matches dark navy/charcoal UI)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 18,
        subdomains: 'abcd'
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous layers except tile layer
    map.eachLayer(layer => {
      if (!(layer instanceof L.TileLayer)) {
        map.removeLayer(layer);
      }
    });

    const bounds = L.latLngBounds([]);

    // Draw route polyline if available
    if (coordinates && coordinates.length > 1) {
      const polyline = L.polyline(coordinates, {
        color: '#06b6d4', // cyan-500
        weight: 4,
        opacity: 0.85,
        dashArray: undefined
      }).addTo(map);

      coordinates.forEach(c => bounds.extend(c));
    }

    // Custom station marker icon
    const stationIcon = L.divIcon({
      className: 'custom-station-icon',
      html: `<div style="background-color: #3b82f6; width: 10px; height: 10px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 6px #3b82f6;"></div>`,
      iconSize: [10, 10],
      iconAnchor: [5, 5]
    });

    // Add station markers
    stations.forEach(s => {
      if (s.lat && s.lng) {
        L.marker([s.lat, s.lng], { icon: stationIcon })
          .addTo(map)
          .bindPopup(`<b style="color:#0f172a">${s.name} (${s.code})</b>`);
        bounds.extend([s.lat, s.lng]);
      }
    });

    // Add current train marker
    if (currentPosition && currentPosition.lat && currentPosition.lng) {
      const trainIcon = L.divIcon({
        className: 'custom-train-marker',
        html: `
          <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 24px; height: 24px; border-radius: 50%; background: rgba(6, 182, 212, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 14px; height: 14px; border-radius: 50%; background: #06b6d4; border: 2px solid #ffffff; box-shadow: 0 0 10px #06b6d4;"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      L.marker([currentPosition.lat, currentPosition.lng], { icon: trainIcon })
        .addTo(map)
        .bindPopup(`<b style="color:#0f172a">Current Location:</b><br/>${currentPosition.stationName}`)
        .openPopup();

      bounds.extend([currentPosition.lat, currentPosition.lng]);
    }

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 8 });
    }
  }, [coordinates, currentPosition, stations]);

  return (
    <div
      ref={mapContainerRef}
      style={{ height, width: '100%' }}
      className="rounded-xl overflow-hidden border border-slate-800 z-10 shadow-inner"
    />
  );
};
