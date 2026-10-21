import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

export interface TrainMarkerData {
  lat: number;
  lng: number;
  trainNumber: string;
  trainName: string;
  speedKmph?: number;
  delayMinutes?: number;
  stationName?: string;
  category?: string;
}

interface Props {
  coordinates?: [number, number][]; // Line coordinates [lat, lng]
  currentPosition?: { lat: number; lng: number; stationName: string };
  stations?: Array<{ lat: number; lng: number; name: string; code: string }>;
  allTrains?: TrainMarkerData[];
  selectedTrainNumber?: string;
  onSelectTrain?: (trainNumber: string) => void;
  height?: string;
}

export const LeafletTrainMap: React.FC<Props> = ({
  coordinates = [],
  currentPosition,
  stations = [],
  allTrains = [],
  selectedTrainNumber,
  onSelectTrain,
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
        zoom: currentPosition?.lat ? 6 : 5,
        attributionControl: false
      });

      // Esri Dark Gray Canvas tiles (clean, watermark-free, dark navy/charcoal GIS tiles)
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 16
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    if (!map) return;

    // Invalidate size to ensure container bounds are calculated accurately
    setTimeout(() => {
      map.invalidateSize();
    }, 150);

    // Clear previous vector/marker layers except tile layer
    map.eachLayer(layer => {
      if (!(layer instanceof L.TileLayer)) {
        map.removeLayer(layer);
      }
    });

    const bounds = L.latLngBounds([]);

    // 1. Draw route polyline if available
    if (coordinates && coordinates.length > 1) {
      L.polyline(coordinates, {
        color: '#06b6d4', // cyan-500
        weight: 4,
        opacity: 0.85,
        dashArray: undefined
      }).addTo(map);

      coordinates.forEach(c => bounds.extend(c));
    }

    // 2. Custom station marker icon & markers
    const stationIcon = L.divIcon({
      className: 'custom-station-icon',
      html: `<div style="background-color: #3b82f6; width: 8px; height: 8px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 6px #3b82f6;"></div>`,
      iconSize: [8, 8],
      iconAnchor: [4, 4]
    });

    stations.forEach(s => {
      if (s.lat && s.lng) {
        L.marker([s.lat, s.lng], { icon: stationIcon })
          .addTo(map)
          .bindPopup(`<b style="color:#0f172a">${s.name} (${s.code})</b>`);
        bounds.extend([s.lat, s.lng]);
      }
    });

    // 3. Render all active trains if provided (for network map view)
    if (allTrains && allTrains.length > 0) {
      allTrains.forEach(t => {
        if (!t.lat || !t.lng) return;
        const isSelected = selectedTrainNumber === t.trainNumber;
        const isDelayed = (t.delayMinutes ?? 0) > 0;
        const pinColor = isSelected ? '#06b6d4' : isDelayed ? '#f59e0b' : '#10b981';

        const markerHtml = isSelected
          ? `
            <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
              <div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background: rgba(6, 182, 212, 0.45); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="width: 16px; height: 16px; border-radius: 50%; background: #06b6d4; border: 2.5px solid #ffffff; box-shadow: 0 0 12px #06b6d4;"></div>
            </div>
          `
          : `
            <div style="position: relative; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
              <div style="width: 12px; height: 12px; border-radius: 50%; background: ${pinColor}; border: 2px solid #ffffff; box-shadow: 0 0 6px ${pinColor};"></div>
            </div>
          `;

        const trainIcon = L.divIcon({
          className: 'custom-network-train-marker',
          html: markerHtml,
          iconSize: isSelected ? [28, 28] : [18, 18],
          iconAnchor: isSelected ? [14, 14] : [9, 9]
        });

        const marker = L.marker([t.lat, t.lng], { icon: trainIcon }).addTo(map);

        marker.bindPopup(`
          <div style="color: #0f172a; font-family: sans-serif; font-size: 12px; min-width: 160px;">
            <div style="font-weight: 700; color: #0284c7; font-size: 13px;">${t.trainNumber} - ${t.trainName}</div>
            <div style="margin-top: 4px; color: #475569;">Station: <b>${t.stationName || 'En route'}</b></div>
            <div style="margin-top: 2px; color: ${isDelayed ? '#b45309' : '#047857'}; font-weight: 600;">
              ${isDelayed ? `Delayed by ${t.delayMinutes}m` : 'Running On Time'}
            </div>
            ${t.speedKmph ? `<div style="margin-top: 2px; color: #64748b;">Speed: <b>${t.speedKmph} km/h</b></div>` : ''}
          </div>
        `);

        if (onSelectTrain) {
          marker.on('click', () => {
            onSelectTrain(t.trainNumber);
          });
        }

        bounds.extend([t.lat, t.lng]);
      });
    }

    // 4. Add single train marker if currentPosition is passed without allTrains
    if (currentPosition && currentPosition.lat && currentPosition.lng && (!allTrains || allTrains.length === 0)) {
      const trainIcon = L.divIcon({
        className: 'custom-train-marker',
        html: `
          <div style="position: relative; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 26px; height: 26px; border-radius: 50%; background: rgba(6, 182, 212, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 14px; height: 14px; border-radius: 50%; background: #06b6d4; border: 2px solid #ffffff; box-shadow: 0 0 10px #06b6d4;"></div>
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });

      L.marker([currentPosition.lat, currentPosition.lng], { icon: trainIcon })
        .addTo(map)
        .bindPopup(`<b style="color:#0f172a">Current Location:</b><br/>${currentPosition.stationName}`)
        .openPopup();

      bounds.extend([currentPosition.lat, currentPosition.lng]);
    }

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [35, 35], maxZoom: 8 });
    }
  }, [coordinates, currentPosition, stations, allTrains, selectedTrainNumber]);

  return (
    <div
      ref={mapContainerRef}
      style={{ height, width: '100%' }}
      className="rounded-xl overflow-hidden border border-slate-800 z-10 shadow-inner"
    />
  );
};
