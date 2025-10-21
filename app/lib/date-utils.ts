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
