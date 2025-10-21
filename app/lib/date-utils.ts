/**
 * Returns the current logical date where the day boundary starts at 4 AM.
 * Optionally accepts a base date, which is helpful for testing.
 */
export function getCurrentLogicalDate(baseDate: Date = new Date()): Date {
  const current = new Date(baseDate);
  const logical = new Date(current);

  if (current.getHours() < 4) {
    logical.setDate(logical.getDate() - 1);
  }

  logical.setHours(0, 0, 0, 0);
  return logical;
}

export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentLogicalDateKey(baseDate: Date = new Date()): string {
  return formatDateKey(getCurrentLogicalDate(baseDate));
}

export function createUtcDateFromKey(dateKey: string, hour = 0): Date {
  const [yearStr, monthStr, dayStr] = dateKey.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  if (
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return new Date(dateKey);
  }
  return new Date(Date.UTC(year, month - 1, day, hour, 0, 0, 0));
}
