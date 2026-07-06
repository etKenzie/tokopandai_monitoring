export type PeriodPreset = '3m' | '6m' | 'year' | 'all';

export const PERIOD_LABELS: Record<PeriodPreset, string> = {
  '3m': '3 Months',
  '6m': '6 Months',
  year: 'Year',
  all: 'All Time',
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatDateParam(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getCurrentMonthLabel(): string {
  const now = new Date();
  return `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;
}

export function formatDateRangeLabel(start?: string, end?: string): string {
  if (!start || !end) return 'All time';
  const fmt = (s: string) =>
    new Date(s).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  return `${fmt(start)} – ${fmt(end)}`;
}

export function getDateRangeForPreset(preset: PeriodPreset): {
  start_date?: string;
  end_date?: string;
  label: string;
} {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  switch (preset) {
    case '3m':
      return {
        start_date: formatDateParam(new Date(now.getFullYear(), now.getMonth() - 3, 1)),
        end_date: formatDateParam(end),
        label: 'Last 3 calendar months',
      };
    case '6m':
      return {
        start_date: formatDateParam(new Date(now.getFullYear(), now.getMonth() - 6, 1)),
        end_date: formatDateParam(end),
        label: 'Last 6 calendar months',
      };
    case 'year':
      return {
        start_date: formatDateParam(new Date(now.getFullYear(), 0, 1)),
        end_date: formatDateParam(end),
        label: `Year ${now.getFullYear()} (YTD)`,
      };
    case 'all':
      return { label: 'All time' };
  }
}

/** @deprecated Use getDateRangeForPreset('6m') */
export function getLastSixMonthsDateRange(): { start_date: string; end_date: string } {
  const range = getDateRangeForPreset('6m');
  return { start_date: range.start_date!, end_date: range.end_date! };
}
