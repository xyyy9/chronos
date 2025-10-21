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
