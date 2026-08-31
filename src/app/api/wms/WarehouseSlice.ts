// Types and fetchers for the WMS Warehouse dashboard.
// All requests go through the local proxy because the WMS API requires
// credentials and restricts CORS to its own origin.

const WMS_PROXY_URL = '/api/wms/proxy';

export interface StockProduct {
  productId: string;
  productName: string;
  sku: string;
  totalQty: number;
  totalValue: number;
}

export interface StockCategory {
  categoryId: string | null;
  categoryName: string;
  totalQty: number;
  totalValue: number;
  productCount: number;
  products: StockProduct[];
}

export interface StockWarehouse {
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string;
  totalQty: number;
  totalValue: number;
  totalProducts: number;
  categories: StockCategory[];
}

export interface StockAllHubResponse {
  success: boolean;
  data: StockWarehouse[];
  message?: string;
}

/** A product row flattened out of its warehouse and category. */
export interface StockProductRow extends StockProduct {
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string;
  categoryId: string | null;
  categoryName: string;
}

export const fetchStockAllHub = async (): Promise<StockAllHubResponse> => {
  const url = `${WMS_PROXY_URL}/ext/warehouse/stock-all-hub`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    let message = `Failed to fetch stock: ${response.status} ${response.statusText}`;
    try {
      const body = await response.json();
      if (body?.message) message = body.message;
    } catch {
      // response body was not JSON; keep the status-based message
    }
    throw new Error(message);
  }

  return response.json();
};

export interface StockValueSummary {
  totalQty: number;
  totalValue: number;
  /** Distinct products across all hubs, so this is not the sum of per-hub counts. */
  totalProducts: number;
}

export interface StockValueCategory {
  categoryId: string | null;
  categoryName: string;
  totalQty: number;
  totalValue: number;
  productCount: number;
}

export interface StockValueWarehouse {
  warehouseId: string;
  warehouseName: string;
  totalQty: number;
  totalValue: number;
}

export interface StockValueData {
  summary: StockValueSummary;
  byCategory: StockValueCategory[];
  byWarehouse: StockValueWarehouse[];
}

export interface StockValueResponse {
  success: boolean;
  data: StockValueData;
  message?: string;
}

export const fetchStockValue = async (): Promise<StockValueResponse> => {
  const url = `${WMS_PROXY_URL}/ext/warehouse/stock-value`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    let message = `Failed to fetch stock value: ${response.status} ${response.statusText}`;
    try {
      const body = await response.json();
      if (body?.message) message = body.message;
    } catch {
      // response body was not JSON; keep the status-based message
    }
    throw new Error(message);
  }

  return response.json();
};

/** Flattens the warehouse/category nesting into one row per product per warehouse. */
export const flattenStock = (warehouses: StockWarehouse[]): StockProductRow[] =>
  warehouses.flatMap((warehouse) =>
    (warehouse.categories ?? []).flatMap((category) =>
      (category.products ?? []).map((product) => ({
        ...product,
        warehouseId: warehouse.warehouseId,
        warehouseName: warehouse.warehouseName,
        warehouseCode: warehouse.warehouseCode,
        categoryId: category.categoryId,
        categoryName: category.categoryName,
      })),
    ),
  );
