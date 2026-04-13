import type { Order } from '@/app/api/distribusi/DistribusiSlice';

/** Days past due (0 if not yet overdue). */
export function calculateDaysLate(order: Pick<Order, 'payment_due_date'>): number {
  if (!order.payment_due_date) return 0;

  const today = new Date();
  const dueDate = new Date(order.payment_due_date);

  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);

  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays < 0 ? Math.abs(diffDays) : 0;
}

/**
 * Normalize bucket labels for sorting / color lookup (API may send "Current", "0 - 14", etc.).
 */
export function normalizeOverdueBucketKey(status: string): string {
  if (!status?.trim()) return '';
  return status
    .trim()
    .toLowerCase()
    .replace(/–/g, '-')
    .replace(/\s+/g, '');
}

/**
 * Preferred ordering: API buckets first (Current → 0-14 → … → 60+), then legacy DPD labels.
 * Unknown labels sort last, alphabetically (via compareOverdueBuckets).
 */
const BUCKET_SORT_ORDER: readonly string[] = [
  'current',
  '0-14',
  '15-30',
  '31-60',
  '60+',
  'b2w',
  '14dpd',
  '30dpd',
  '60dpd',
  '90dpd',
] as const;

/** Sort index for known buckets; unknown → 1000 (stable tier for tie-break). */
export function bucketSortIndex(status: string): number {
  const n = normalizeOverdueBucketKey(status);
  if (!n) return 9999;
  const i = (BUCKET_SORT_ORDER as readonly string[]).indexOf(n);
  if (i !== -1) return i;
  return 1000;
}

export function compareOverdueBuckets(a: string, b: string): number {
  const da = bucketSortIndex(a) - bucketSortIndex(b);
  if (da !== 0) return da;
  return a.localeCompare(b, undefined, { sensitivity: 'base' });
}

/**
 * Use `overdue_status` from the API when present; otherwise derive from due date (legacy).
 */
export function resolveOverdueStatus(
  order: Pick<Order, 'overdue_status' | 'payment_due_date'>
): string {
  const fromApi =
    typeof order.overdue_status === 'string' ? order.overdue_status.trim() : '';
  if (fromApi) return order.overdue_status.trim();
  return calculateOverdueStatusFromDueDate(order);
}

/** Legacy bucket names when API does not send `overdue_status`. */
function calculateOverdueStatusFromDueDate(
  order: Pick<Order, 'payment_due_date'>
): string {
  if (!order.payment_due_date) return '';

  const today = new Date();
  const dueDate = new Date(order.payment_due_date);

  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);

  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays >= 0) {
    return 'CURRENT';
  }
  const daysPastDue = Math.abs(diffDays);
  if (daysPastDue < 14) {
    return 'B2W';
  }
  if (daysPastDue < 30) {
    return '14DPD';
  }
  if (daysPastDue < 60) {
    return '30DPD';
  }
  if (daysPastDue < 90) {
    return '60DPD';
  }
  return '90DPD';
}

/** Bar / chip color from bucket label (API or legacy). */
export function colorForOverdueBucket(status: string): string {
  const n = normalizeOverdueBucketKey(status);
  const map: Record<string, string> = {
    current: '#22c55e',
    '0-14': '#eab308',
    '15-30': '#38bdf8',
    '31-60': '#fb923c',
    '60+': '#ef4444',
    b2w: '#eab308',
    '14dpd': '#38bdf8',
    '30dpd': '#fb923c',
    '60dpd': '#f97316',
    '90dpd': '#ef4444',
  };
  return map[n] ?? '#94a3b8';
}

/** MUI Chip color from bucket label (API or legacy). */
export function overdueStatusChipColor(
  status: string
): 'default' | 'success' | 'info' | 'warning' | 'error' {
  if (!status?.trim()) return 'default';
  const n = normalizeOverdueBucketKey(status);
  if (n === 'current') return 'success';
  if (n === '0-14' || n === 'b2w') return 'info';
  if (n === '15-30' || n === '31-60' || n === '14dpd' || n === '30dpd') return 'warning';
  if (n === '60+' || n === '60dpd' || n === '90dpd' || n.includes('dpd')) return 'error';
  return 'default';
}
