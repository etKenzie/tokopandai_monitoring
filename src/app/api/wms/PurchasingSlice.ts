// Types and fetchers for the WMS Purchasing dashboard.
// All requests go through the local proxy because the WMS API requires
// credentials and restricts CORS to its own origin.

const WMS_PROXY_URL = '/api/wms/proxy';

export interface PurchasingProduct {
  productId: string;
  productName: string;
  sku: string;
  totalQtyOrdered: number;
  totalQtyReceived: number;
  totalNominal: number;
  avgBuyPrice: number;
  lastBuyPrice: number;
  orderCount: number;
}

export interface PurchasingCategoryPerformance {
  categoryId: string | null;
  categoryName: string;
  totalNominal: number;
  totalQtyOrdered: number;
  totalQtyReceived: number;
  products: PurchasingProduct[];
}

export interface ProductPerformanceResponse {
  success: boolean;
  data: PurchasingCategoryPerformance[];
  message?: string;
}

/** A product row flattened out of its category, for a single combined table. */
export interface PurchasingProductRow extends PurchasingProduct {
  categoryId: string | null;
  categoryName: string;
}

export interface ProductPerformanceParams {
  startDate: string;
  endDate: string;
  categoryId?: string;
  buyerCompany?: string;
  supplierId?: string;
}

export const fetchProductPerformance = async (
  params: ProductPerformanceParams,
): Promise<ProductPerformanceResponse> => {
  const queryParams = new URLSearchParams();
  queryParams.append('startDate', params.startDate);
  queryParams.append('endDate', params.endDate);
  if (params.categoryId) queryParams.append('categoryId', params.categoryId);
  if (params.buyerCompany) queryParams.append('buyerCompany', params.buyerCompany);
  if (params.supplierId) queryParams.append('supplierId', params.supplierId);

  const url = `${WMS_PROXY_URL}/ext/purchasing/product-performance?${queryParams.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    let message = `Failed to fetch product performance: ${response.status} ${response.statusText}`;
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

export interface CompanyNominal {
  buyerCompany: string;
  totalNominal: number;
  totalOrders: number;
  totalQty: number;
}

/** The API keys this object by buyer company name rather than returning an array. */
export interface NominalByCompanyResponse {
  success: boolean;
  data: Record<string, CompanyNominal>;
  message?: string;
}

export interface NominalByCompanyParams {
  startDate: string;
  endDate: string;
  categoryId?: string;
  supplierId?: string;
}

export const fetchNominalByCompany = async (
  params: NominalByCompanyParams,
): Promise<NominalByCompanyResponse> => {
  const queryParams = new URLSearchParams();
  queryParams.append('startDate', params.startDate);
  queryParams.append('endDate', params.endDate);
  if (params.categoryId) queryParams.append('categoryId', params.categoryId);
  if (params.supplierId) queryParams.append('supplierId', params.supplierId);

  const url = `${WMS_PROXY_URL}/ext/purchasing/nominal-by-company?${queryParams.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    let message = `Failed to fetch nominal by company: ${response.status} ${response.statusText}`;
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

export interface PriceHistoryEntry {
  date: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  unitPrice: number;
  qty: number;
}

export interface ProductPriceTracking {
  productId: string;
  productName: string;
  sku: string;
  categoryId: string | null;
  categoryName: string;
  history: PriceHistoryEntry[];
}

export interface PriceTrackingResponse {
  success: boolean;
  data: ProductPriceTracking[];
  message?: string;
}

export interface PriceTrackingParams {
  startDate: string;
  endDate: string;
  productId: string;
}

export const fetchPriceTracking = async (
  params: PriceTrackingParams,
): Promise<PriceTrackingResponse> => {
  const queryParams = new URLSearchParams();
  queryParams.append('startDate', params.startDate);
  queryParams.append('endDate', params.endDate);
  queryParams.append('productId', params.productId);

  const url = `${WMS_PROXY_URL}/ext/purchasing/price-tracking?${queryParams.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    let message = `Failed to fetch price tracking: ${response.status} ${response.statusText}`;
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

export interface PriceCompareChangedProduct {
  productId: string;
  productName: string;
  sku: string;
  priceA: number;
  priceB: number;
  diff: number;
  /** The API sends this as a string, and null when priceA is 0. */
  diffPct: string | null;
}

export interface PriceCompareFlatProduct {
  productId: string;
  productName: string;
  sku: string;
  price: number;
}

export interface PriceCompareNewProduct {
  productId: string;
  productName: string;
  sku: string;
  priceB: number;
}

export interface PriceCompareData {
  monthA: string;
  monthB: string;
  summary: {
    priceUp: number;
    priceDown: number;
    priceFlat: number;
    newProduct: number;
  };
  priceUp: { count: number; products: PriceCompareChangedProduct[] };
  priceDown: { count: number; products: PriceCompareChangedProduct[] };
  priceFlat: { count: number; products: PriceCompareFlatProduct[] };
  newProduct: { count: number; products: PriceCompareNewProduct[] };
}

export interface PriceCompareResponse {
  success: boolean;
  data: PriceCompareData;
  message?: string;
}

export type PriceChangeStatus = 'up' | 'down' | 'flat' | 'new';

/** The four buckets normalized into a single row shape for one combined table. */
export interface PriceCompareRow {
  productId: string;
  productName: string;
  sku: string;
  status: PriceChangeStatus;
  /** Null for products that were not purchased in month A. */
  priceA: number | null;
  priceB: number;
  diff: number | null;
  diffPct: number | null;
}

export const fetchPriceCompare = async (
  monthA: string,
  monthB: string,
): Promise<PriceCompareResponse> => {
  const queryParams = new URLSearchParams();
  queryParams.append('monthA', monthA);
  queryParams.append('monthB', monthB);

  const url = `${WMS_PROXY_URL}/ext/purchasing/price-compare?${queryParams.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    let message = `Failed to fetch price compare: ${response.status} ${response.statusText}`;
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

const parsePct = (value: string | null): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

/** Flattens the four price-compare buckets into one row per product. */
export const flattenPriceCompare = (data: PriceCompareData | null): PriceCompareRow[] => {
  if (!data) return [];

  const changed = (
    products: PriceCompareChangedProduct[],
    status: PriceChangeStatus,
  ): PriceCompareRow[] =>
    products.map((product) => ({
      productId: product.productId,
      productName: product.productName,
      sku: product.sku,
      status,
      priceA: product.priceA,
      priceB: product.priceB,
      diff: product.diff,
      diffPct: parsePct(product.diffPct),
    }));

  return [
    ...changed(data.priceUp?.products ?? [], 'up'),
    ...changed(data.priceDown?.products ?? [], 'down'),
    ...(data.priceFlat?.products ?? []).map((product) => ({
      productId: product.productId,
      productName: product.productName,
      sku: product.sku,
      status: 'flat' as const,
      priceA: product.price,
      priceB: product.price,
      diff: 0,
      diffPct: 0,
    })),
    ...(data.newProduct?.products ?? []).map((product) => ({
      productId: product.productId,
      productName: product.productName,
      sku: product.sku,
      status: 'new' as const,
      priceA: null,
      priceB: product.priceB,
      diff: null,
      diffPct: null,
    })),
  ];
};

/** Flattens the category-grouped response into one row per product. */
export const flattenProductPerformance = (
  categories: PurchasingCategoryPerformance[],
): PurchasingProductRow[] =>
  categories.flatMap((category) =>
    category.products.map((product) => ({
      ...product,
      categoryId: category.categoryId,
      categoryName: category.categoryName,
    })),
  );
