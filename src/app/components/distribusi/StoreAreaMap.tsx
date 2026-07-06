'use client';

import { StoreSummaryItem } from '@/app/api/distribusi/DistribusiSlice';
import {
  aggregateStoresByArea,
  getUnmappedAreaCount,
} from '@/app/components/distribusi/aggregateStoresByArea';
import {
  GeocodedStoreMarker,
  geocodeStoresFromAddresses,
} from '@/app/components/distribusi/geocodeStores';
import { Box, CircularProgress, Typography } from '@mui/material';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';

const StoreAreaMapInner = dynamic(() => import('./StoreAreaMapInner'), {
  ssr: false,
  loading: () => (
    <Box
      sx={{
        height: 520,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
      }}
    >
      <CircularProgress size={28} />
    </Box>
  ),
});

interface StoreAreaMapProps {
  stores: StoreSummaryItem[];
  title?: string;
  height?: number;
}

const StoreAreaMap = ({ stores, title = 'Store Locations', height = 520 }: StoreAreaMapProps) => {
  const [gpsMarkers, setGpsMarkers] = useState<GeocodedStoreMarker[]>([]);
  const [loading, setLoading] = useState(false);

  const areaSummaries = useMemo(() => aggregateStoresByArea(stores), [stores]);
  const unmappedAreaCount = useMemo(() => getUnmappedAreaCount(stores), [stores]);

  const storesWithAddress = useMemo(
    () => stores.filter((store) => store.address?.trim()),
    [stores]
  );

  const storeKey = useMemo(
    () => stores.map((store) => `${store.user_id}:${store.address ?? ''}`).join('|'),
    [stores]
  );

  useEffect(() => {
    let cancelled = false;

    const loadMarkers = async () => {
      if (storesWithAddress.length === 0) {
        setGpsMarkers([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setGpsMarkers([]);

      const markers = await geocodeStoresFromAddresses(storesWithAddress, (marker) => {
        if (cancelled) return;
        setGpsMarkers((prev) => {
          if (prev.some((item) => item.user_id === marker.user_id)) return prev;
          return [...prev, marker];
        });
      });

      if (!cancelled) {
        setGpsMarkers(markers);
        setLoading(false);
      }
    };

    loadMarkers();

    return () => {
      cancelled = true;
    };
  }, [storeKey, storesWithAddress]);

  if (stores.length === 0) {
    return null;
  }

  const addressCount = storesWithAddress.length;
  const missingCount = addressCount - gpsMarkers.length;

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, gap: 2 }}>
        <Typography variant="h6" fontWeight="bold">
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="right">
          {loading
            ? 'Loading store locations...'
            : `${gpsMarkers.length} of ${addressCount} stores on map`}
          {!loading && gpsMarkers.length > 0 ? ' • Zoom in for store markers' : ''}
          {!loading && missingCount > 0
            ? ` • ${missingCount} store(s) without geocode in API`
            : ''}
          {unmappedAreaCount > 0 ? ` • ${unmappedAreaCount} area(s) without region overlay` : ''}
        </Typography>
      </Box>
      {loading && gpsMarkers.length === 0 ? (
        <Box
          sx={{
            height,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
          }}
        >
          <CircularProgress size={28} />
        </Box>
      ) : gpsMarkers.length === 0 ? (
        <Box
          sx={{
            height: 120,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            px: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary" textAlign="center">
            No store locations found. Ensure addresses are geocoded in the backend (
            /api/store/addresses/geocodes).
          </Typography>
        </Box>
      ) : (
        <StoreAreaMapInner areas={areaSummaries} gpsMarkers={gpsMarkers} height={height} />
      )}
    </Box>
  );
};

export default StoreAreaMap;
