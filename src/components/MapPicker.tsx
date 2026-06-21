'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  Autocomplete,
} from '@react-google-maps/api';

const libraries: ('places')[] = ['places'];

const mapContainerStyle = {
  height: '280px',
  width: '100%',
  borderRadius: '8px',
};

const defaultCenter = { lat: 14.5995, lng: 120.9842 }; // Manila

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  styles: [
    { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#255763' }] },
    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#98a5be' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
    { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#283d6a' }] },
    { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#6f9ba5' }] },
    { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
  ],
};

export default function MapPicker({
  onLocationSelect,
  addressQuery,
}: {
  onLocationSelect: (address: string, lat: number, lng: number) => void;
  addressQuery?: string;
}) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  const [markerPos, setMarkerPos] = useState<google.maps.LatLngLiteral | null>(null);
  const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral>(defaultCenter);
  const [inputValue, setInputValue] = useState(addressQuery || '');
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  // Sync the input with the parent's addressQuery when it changes externally
  useEffect(() => {
    if (addressQuery !== undefined && addressQuery !== inputValue) {
      setInputValue(addressQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addressQuery]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    geocoderRef.current = new google.maps.Geocoder();
  }, []);

  const reverseGeocode = useCallback(
    (lat: number, lng: number) => {
      if (!geocoderRef.current) return;
      geocoderRef.current.geocode(
        { location: { lat, lng } },
        (results, status) => {
          if (status === 'OK' && results && results[0]) {
            const addr = results[0].formatted_address;
            setInputValue(addr);
            onLocationSelect(addr, lat, lng);
          } else {
            // Even if geocode fails, still update lat/lng
            onLocationSelect(`${lat.toFixed(6)}, ${lng.toFixed(6)}`, lat, lng);
          }
        }
      );
    },
    [onLocationSelect]
  );

  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarkerPos({ lat, lng });
      reverseGeocode(lat, lng);
    },
    [reverseGeocode]
  );

  const onAutocompleteLoad = useCallback((ac: google.maps.places.Autocomplete) => {
    autocompleteRef.current = ac;
  }, []);

  const onPlaceChanged = useCallback(() => {
    if (!autocompleteRef.current) return;
    const place = autocompleteRef.current.getPlace();

    if (place.geometry && place.geometry.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const addr = place.formatted_address || place.name || '';

      setMarkerPos({ lat, lng });
      setMapCenter({ lat, lng });
      setInputValue(addr);
      onLocationSelect(addr, lat, lng);

      if (mapRef.current) {
        mapRef.current.panTo({ lat, lng });
        mapRef.current.setZoom(16);
      }
    }
  }, [onLocationSelect]);

  if (loadError) {
    return (
      <div style={{ padding: '20px', color: 'var(--error-color, #ff6b6b)', background: 'rgba(255,0,0,0.08)', borderRadius: '8px', fontSize: '0.9rem' }}>
        ⚠️ Failed to load Google Maps. Please check your API key.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', borderRadius: '8px', color: 'var(--text-secondary)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '28px', height: '28px', border: '3px solid var(--glass-border)', borderTopColor: 'var(--accent-color)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ fontSize: '0.9rem' }}>Loading Google Maps...</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Address Input with Google Places Autocomplete */}
      <Autocomplete
        onLoad={onAutocompleteLoad}
        onPlaceChanged={onPlaceChanged}
        options={{ componentRestrictions: { country: 'ph' } }}
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            // Also update the parent so the form state stays in sync
            if (e.target.value === '') {
              onLocationSelect('', 0, 0);
            }
          }}
          placeholder="Search for an address..."
          style={{
            width: '100%',
            padding: '10px 14px',
            background: 'var(--bg-primary)',
            border: '1px solid var(--glass-border)',
            borderRadius: '6px',
            color: 'var(--text-primary)',
            fontSize: '0.95rem',
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => { e.target.style.borderColor = 'var(--accent-color)'; }}
          onBlur={(e) => { e.target.style.borderColor = 'var(--glass-border)'; }}
        />
      </Autocomplete>

      {/* Google Map */}
      <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={mapCenter}
          zoom={13}
          options={mapOptions}
          onLoad={onMapLoad}
          onClick={handleMapClick}
        >
          {markerPos && <Marker position={markerPos} />}
        </GoogleMap>
      </div>

      {/* Selected location info */}
      {markerPos && (
        <div style={{
          fontSize: '0.85rem',
          color: 'var(--text-secondary)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '6px 10px',
          background: 'var(--bg-primary)',
          borderRadius: '6px',
          border: '1px solid var(--glass-border)',
        }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: '10px' }}>
            📍 {inputValue || 'Selected Location'}
          </span>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${markerPos.lat},${markerPos.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'var(--accent-color)',
              textDecoration: 'none',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              fontSize: '0.8rem',
            }}
          >
            Open in Google Maps ↗
          </a>
        </div>
      )}
    </div>
  );
}
