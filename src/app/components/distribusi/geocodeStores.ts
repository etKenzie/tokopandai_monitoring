import { StoreSummaryItem } from '@/app/api/distribusi/DistribusiSlice';
import {
  fetchStoreAddressGeocodes,
  StoreAddressGeocode,
} from '@/app/api/distribusi/StoreSlice';
import { normalizeAddress } from '@/lib/addressNormalize';

export interface GeocodedStoreMarker {
  user_id: string;
  store_name: string;
  address: string;
  area: string;
  segment: string;
  agent_name: string;
  lat: number;
  lng: number;
  total_invoice?: number;
  total_profit?: number;
}

let geocodeListCache: StoreAddressGeocode[] | null = null;
let geocodeListPromise: Promise<StoreAddressGeocode[]> | null = null;

async function loadStoreGeocodes(): Promise<StoreAddressGeocode[]> {
  if (geocodeListCache) return geocodeListCache;
  if (!geocodeListPromise) {
    geocodeListPromise = fetchStoreAddressGeocodes()
      .then((geocodes) => {
        geocodeListCache = geocodes;
        return geocodes;
      })
      .catch((error) => {
        geocodeListPromise = null;
        throw error;
      });
  }
  return geocodeListPromise;
}

function buildGeocodeLookups(geocodes: StoreAddressGeocode[]) {
  const byUserId = new Map<string, StoreAddressGeocode>();
  const byNormalizedAddress = new Map<string, StoreAddressGeocode>();

  geocodes.forEach((geocode) => {
    byUserId.set(geocode.user_id, geocode);
    byNormalizedAddress.set(geocode.address_normalized, geocode);
  });

  return { byUserId, byNormalizedAddress };
}

function getStoreCoords(store: StoreSummaryItem): { lat: number; lng: number } | null {
  const lat = store.latitude ?? store.lat;
  const lng = store.longitude ?? store.lng;
  if (typeof lat === 'number' && typeof lng === 'number') {
    return { lat, lng };
  }
  return null;
}

function resolveGeocode(
  store: StoreSummaryItem,
  byUserId: Map<string, StoreAddressGeocode>,
  byNormalizedAddress: Map<string, StoreAddressGeocode>
): StoreAddressGeocode | undefined {
  const byId = byUserId.get(store.user_id);
  if (byId) return byId;

  const address = store.address?.trim();
  if (!address) return undefined;

  return byNormalizedAddress.get(normalizeAddress(address));
}

function toMarker(
  store: StoreSummaryItem,
  coords: { lat: number; lng: number },
  address: string
): GeocodedStoreMarker {
  return {
    user_id: store.user_id,
    store_name: store.store_name,
    address,
    area: store.area,
    segment: store.segment,
    agent_name: store.agent_name,
    lat: coords.lat,
    lng: coords.lng,
    total_invoice: store.total_invoice,
    total_profit: store.total_profit,
  };
}

export async function geocodeStoresFromAddresses(
  stores: StoreSummaryItem[],
  onMarker?: (marker: GeocodedStoreMarker) => void
): Promise<GeocodedStoreMarker[]> {
  const markers: GeocodedStoreMarker[] = [];
  const geocodes = await loadStoreGeocodes();
  const { byUserId, byNormalizedAddress } = buildGeocodeLookups(geocodes);

  stores.forEach((store) => {
    const inlineCoords = getStoreCoords(store);
    if (inlineCoords) {
      const marker = toMarker(store, inlineCoords, store.address?.trim() ?? '');
      markers.push(marker);
      onMarker?.(marker);
      return;
    }

    const geocode = resolveGeocode(store, byUserId, byNormalizedAddress);
    if (!geocode) return;

    const marker = toMarker(
      store,
      { lat: geocode.latitude, lng: geocode.longitude },
      geocode.address_raw || store.address?.trim() || ''
    );

    if (!markers.some((item) => item.user_id === marker.user_id)) {
      markers.push(marker);
      onMarker?.(marker);
    }
  });

  return markers;
}
