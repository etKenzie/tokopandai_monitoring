'use client';

import { AreaStoreSummary } from '@/app/components/distribusi/aggregateStoresByArea';
import { GeocodedStoreMarker } from '@/app/components/distribusi/geocodeStores';
import { Box, Typography } from '@mui/material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';

const INDONESIA_CENTER: [number, number] = [-2.5, 118];
/** At or above this zoom level, show individual store markers instead of area summaries */
const STORE_MARKER_ZOOM_THRESHOLD = 11;

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

function createCountIcon(count: number) {
  return L.divIcon({
    className: 'store-area-count-marker',
    html: `<div style="
      background:#1976d2;
      color:#fff;
      border:2px solid #fff;
      border-radius:50%;
      width:36px;
      height:36px;
      display:flex;
      align-items:center;
      justify-content:center;
      font-weight:700;
      font-size:13px;
      box-shadow:0 2px 6px rgba(0,0,0,0.35);
    ">${count}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

function AreaPopupContent({ area }: { area: AreaStoreSummary }) {
  return (
    <Box sx={{ minWidth: 240, maxWidth: 340 }}>
      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
        {area.area}
      </Typography>
      <Typography variant="body2" sx={{ mb: 1 }}>
        {area.store_count} store{area.store_count === 1 ? '' : 's'} • Invoice{' '}
        {formatCurrency(area.total_invoice)} • Profit {formatCurrency(area.total_profit)}
      </Typography>
      <Box sx={{ maxHeight: 220, overflowY: 'auto', pr: 0.5 }}>
        {area.stores.map((store) => (
          <Box
            key={store.user_id}
            sx={{ py: 0.75, borderTop: '1px solid', borderColor: 'divider' }}
          >
            <Typography variant="body2" fontWeight="medium">
              {store.store_name}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              {store.address?.trim() || 'No address on file'}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function StorePopupContent({ store }: { store: GeocodedStoreMarker }) {
  return (
    <Box sx={{ minWidth: 220, maxWidth: 320 }}>
      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
        {store.store_name}
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
        {store.area} • {store.segment}
      </Typography>
      <Typography variant="body2" sx={{ mb: 1 }}>
        {store.address}
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
        Agent: {store.agent_name}
      </Typography>
      {store.total_invoice !== undefined && (
        <Typography variant="caption" display="block">
          Invoice: {formatCurrency(store.total_invoice)}
        </Typography>
      )}
      {store.total_profit !== undefined && (
        <Typography variant="caption" display="block" color="success.main">
          Profit: {formatCurrency(store.total_profit)}
        </Typography>
      )}
    </Box>
  );
}

function FitMapBounds({ markers }: { markers: GeocodedStoreMarker[] }) {
  const map = useMap();

  useEffect(() => {
    if (markers.length === 0) {
      map.setView(INDONESIA_CENTER, 5);
      return;
    }

    if (markers.length === 1) {
      map.setView([markers[0].lat, markers[0].lng], 10);
      return;
    }

    const bounds = L.latLngBounds(markers.map((marker) => [marker.lat, marker.lng]));
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 10 });
  }, [map, markers]);

  return null;
}

function MapZoomTracker({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  const map = useMap();

  useMapEvents({
    zoomend: () => onZoomChange(map.getZoom()),
  });

  useEffect(() => {
    onZoomChange(map.getZoom());
  }, [map, onZoomChange]);

  return null;
}

interface StoreAreaMapInnerProps {
  areas: AreaStoreSummary[];
  gpsMarkers: GeocodedStoreMarker[];
  height?: number;
}

const StoreAreaMapInner = ({ areas, gpsMarkers, height = 520 }: StoreAreaMapInnerProps) => {
  const [zoom, setZoom] = useState(5);
  const showStoreMarkers = zoom >= STORE_MARKER_ZOOM_THRESHOLD;
  const showAreaLayer = !showStoreMarkers;

  return (
    <Box
      sx={{
        height,
        width: '100%',
        borderRadius: 1,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        '& .leaflet-container': { height: '100%', width: '100%' },
        '& .store-area-count-marker': { background: 'transparent', border: 'none' },
      }}
    >
      <MapContainer center={INDONESIA_CENTER} zoom={5} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitMapBounds markers={gpsMarkers} />
        <MapZoomTracker onZoomChange={setZoom} />

        {showAreaLayer &&
          areas.map((area) => (
            <Circle
              key={`circle-${area.area}`}
              center={[area.lat, area.lng]}
              radius={area.highlight_radius}
              pathOptions={{
                color: '#1976d2',
                fillColor: '#1976d2',
                fillOpacity: 0.15,
                weight: 2,
              }}
            >
              <Popup maxWidth={360}>
                <AreaPopupContent area={area} />
              </Popup>
            </Circle>
          ))}

        {showAreaLayer &&
          areas.map((area) => (
            <Marker
              key={`area-marker-${area.area}`}
              position={[area.lat, area.lng]}
              icon={createCountIcon(area.store_count)}
              zIndexOffset={1000}
            >
              <Popup maxWidth={360}>
                <AreaPopupContent area={area} />
              </Popup>
            </Marker>
          ))}

        {showStoreMarkers &&
          gpsMarkers.map((store) => (
            <Marker key={store.user_id} position={[store.lat, store.lng]}>
              <Popup maxWidth={320}>
                <StorePopupContent store={store} />
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </Box>
  );
};

export default StoreAreaMapInner;
