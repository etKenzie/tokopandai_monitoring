import { StoreSummaryItem } from '@/app/api/distribusi/DistribusiSlice';

export interface AreaStoreDetail {
  user_id: string;
  store_name: string;
  address?: string;
  total_invoice?: number;
  total_profit?: number;
}

export interface AreaStoreSummary {
  area: string;
  lat: number;
  lng: number;
  store_count: number;
  total_invoice: number;
  total_profit: number;
  highlight_radius: number;
  stores: AreaStoreDetail[];
}

const AREA_COORDINATES: Record<string, { lat: number; lng: number; baseRadius: number }> = {
  JAKARTA: { lat: -6.2088, lng: 106.8456, baseRadius: 22000 },
  BANDUNG: { lat: -6.9175, lng: 107.6191, baseRadius: 18000 },
  SURABAYA: { lat: -7.2575, lng: 112.7521, baseRadius: 18000 },
  MEDAN: { lat: 3.5952, lng: 98.6722, baseRadius: 16000 },
  SEMARANG: { lat: -6.9667, lng: 110.4167, baseRadius: 16000 },
  MAKASSAR: { lat: -5.1477, lng: 119.4327, baseRadius: 16000 },
  PALEMBANG: { lat: -2.9761, lng: 104.7754, baseRadius: 16000 },
  TANGERANG: { lat: -6.1783, lng: 106.6319, baseRadius: 14000 },
  DEPOK: { lat: -6.4025, lng: 106.7942, baseRadius: 14000 },
  BEKASI: { lat: -6.2383, lng: 106.9756, baseRadius: 14000 },
};

const normalizeArea = (area?: string) => area?.trim().toUpperCase() || 'UNKNOWN';

export function aggregateStoresByArea(stores: StoreSummaryItem[]): AreaStoreSummary[] {
  const areaMap = new Map<
    string,
    {
      store_count: number;
      total_invoice: number;
      total_profit: number;
      stores: AreaStoreDetail[];
    }
  >();

  stores.forEach((store) => {
    const area = normalizeArea(store.area);
    const current = areaMap.get(area) ?? {
      store_count: 0,
      total_invoice: 0,
      total_profit: 0,
      stores: [],
    };
    current.store_count += 1;
    current.total_invoice += store.total_invoice ?? 0;
    current.total_profit += store.total_profit ?? 0;
    current.stores.push({
      user_id: store.user_id,
      store_name: store.store_name,
      address: store.address,
      total_invoice: store.total_invoice,
      total_profit: store.total_profit,
    });
    areaMap.set(area, current);
  });

  return Array.from(areaMap.entries())
    .map(([area, totals]) => {
      const coords = AREA_COORDINATES[area];
      if (!coords) return null;

      return {
        area,
        lat: coords.lat,
        lng: coords.lng,
        store_count: totals.store_count,
        total_invoice: totals.total_invoice,
        total_profit: totals.total_profit,
        highlight_radius: coords.baseRadius + Math.min(totals.store_count * 800, 12000),
        stores: totals.stores,
      };
    })
    .filter((item): item is AreaStoreSummary => item !== null)
    .sort((a, b) => b.store_count - a.store_count);
}

export function getUnmappedAreaCount(stores: StoreSummaryItem[]): number {
  const mappedAreas = new Set(Object.keys(AREA_COORDINATES));
  return new Set(
    stores
      .map((store) => normalizeArea(store.area))
      .filter((area) => !mappedAreas.has(area))
  ).size;
}
