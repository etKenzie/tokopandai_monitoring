const UTC_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
};

export const formatDateUtc = (
  dateString: string | null | undefined,
  locale = 'en-US',
): string => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(locale, UTC_DATE_OPTIONS);
};

export const formatDateTimeUtc = (
  dateString: string | null | undefined,
  locale = 'en-US',
): string => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(locale, {
    ...UTC_DATE_OPTIONS,
    hour: '2-digit',
    minute: '2-digit',
    hour12: locale.startsWith('en'),
    timeZone: 'UTC',
  });
};

export const formatMonthYearUtc = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  const monthName = date.toLocaleString('en-US', { month: 'long', timeZone: 'UTC' });
  return `${monthName} ${date.getUTCFullYear()}`;
};
