import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { Hospital } from '../types';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

interface MapViewProps {
  filteredHospitals: Hospital[];
  selectedHospital: Hospital | null;
  userLocation: {lat: number, lng: number} | null;
}

export default function MapView({ filteredHospitals, selectedHospital, userLocation }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainer.current) return;

    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [3.3792, 6.5244], 
      zoom: 10
    });

    map.current = mapInstance;

    mapInstance.on('load', () => {
      mapInstance.resize();
    });

    return () => {
      mapInstance.remove();
      map.current = null;
    };
  }, []);

  // 2. Draw Hospital Markers & Auto-Fit Bounds (WITH DEFENSIVE CHECKS)
  useEffect(() => {
    if (!map.current) return;

    // Clean up old markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const bounds = new mapboxgl.LngLatBounds();
    let hasValidCoordinates = false;

    filteredHospitals.forEach((hospital) => {
      // DEFENSIVE CHECK: Ensure latitude and longitude are valid numbers within Earth's boundaries
      const lat = Number(hospital.latitude);
      const lng = Number(hospital.longitude);

      const isValidLat = !isNaN(lat) && lat >= -90 && lat <= 90;
      const isValidLng = !isNaN(lng) && lng >= -180 && lng <= 180;

      if (isValidLat && isValidLng) {
        hasValidCoordinates = true;
        const marker = new mapboxgl.Marker({ color: '#0D9488' }) 
          .setLngLat([lng, lat])
          .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`<strong>${hospital.name || 'Unnamed Clinic'}</strong>`))
          .addTo(map.current!);
          
        markersRef.current.push(marker);
        bounds.extend([lng, lat]);
      } else {
        console.warn(`Skipped invalid coordinates for hospital: ${hospital.name} (Lat: ${hospital.latitude}, Lng: ${hospital.longitude})`);
      }
    });

    if (userLocation) {
      bounds.extend([userLocation.lng, userLocation.lat]);
    }

    if (hasValidCoordinates && !selectedHospital) {
      map.current.fitBounds(bounds, { padding: 80, maxZoom: 13, duration: 1200 });
    }
  }, [filteredHospitals, selectedHospital, userLocation]);

  // 3. Draw User Location Marker
  useEffect(() => {
    if (!map.current || !userLocation) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }

    userMarkerRef.current = new mapboxgl.Marker({ color: '#EF4444' }) 
      .setLngLat([userLocation.lng, userLocation.lat])
      .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`<strong>You are here</strong>`))
      .addTo(map.current);

  }, [userLocation]);

  // 4. Listen for Selection Changes and Fly (WITH DEFENSIVE CHECKS)
  useEffect(() => {
    if (!map.current || !selectedHospital) return;

    const lat = Number(selectedHospital.latitude);
    const lng = Number(selectedHospital.longitude);

    if (!isNaN(lat) && lat >= -90 && lat <= 90 && !isNaN(lng) && lng >= -180 && lng <= 180) {
      map.current.flyTo({
        center: [lng, lat],
        zoom: 15,
        essential: true,
        duration: 1500
      });
    }
  }, [selectedHospital]);

  return (
    <div className="flex-1 relative bg-[#e0e3e5]" style={{ height: '100%', minHeight: '100%' }}>
      <div ref={mapContainer} className="absolute inset-0" style={{ width: '100%', height: '100%' }} />
    </div>
  );
}