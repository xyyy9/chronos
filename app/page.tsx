import { LoggingTab } from '@/app/components/logging-tab';
import { prisma } from '@/app/lib/prisma';
import { getCurrentLogicalDateKey } from '@/app/lib/date-utils';
import { normalizeSavedNewsEntries } from '@/app/lib/news';

export const dynamic = 'force-dynamic';

const normalizeLogicalDate = (input: unknown): string => {
  if (typeof input === 'string') {
    return input;
  }
  if (input instanceof Date && !Number.isNaN(input.getTime())) {
    return input.toISOString().slice(0, 10);
  }
  if (input === null || input === undefined) {
    return '';
  }
  const fallback = new Date(String(input));
  if (!Number.isNaN(fallback.getTime())) {
    return fallback.toISOString().slice(0, 10);
  }
  return String(input);
};

const parseMentalWorld = (value: unknown) =>
  Array.isArray(value)
    ? (value as Array<unknown>).flatMap((entry) => {
        if (!entry || typeof entry !== 'object') {
          return [];
        }
        const maybeValue = (entry as { value?: unknown }).value;
        if (typeof maybeValue !== 'string' || !maybeValue) {
          return [];
        }
        const detail = (entry as { detail?: unknown }).detail;
        return [
          {
            value: maybeValue,
            detail: typeof detail === 'string' && detail.length > 0 ? detail : undefined,
          },
        ];
      })
    : [];

const parseDailyLife = (value: unknown) =>
  Array.isArray(value)
    ? (value as Array<unknown>).flatMap((entry) => (typeof entry === 'string' ? [entry] : []))
    : [];

export default async function Home() {
  const selectedDateKey = getCurrentLogicalDateKey();
  const [yearStr, monthStr] = selectedDateKey.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);

  const hasValidMonth = !Number.isNaN(year) && !Number.isNaN(month);
  const startKey = hasValidMonth ? `${yearStr}-${monthStr}-01` : `${selectedDateKey.slice(0, 7)}-01`;
  const nextMonth = hasValidMonth ? (month === 12 ? 1 : month + 1) : 1;
  const nextYear = hasValidMonth ? (month === 12 ? year + 1 : year) : year || 1970;
  const endKey = hasValidMonth
    ? `${String(nextYear).padStart(4, '0')}-${String(nextMonth).padStart(2, '0')}-01`
    : `${selectedDateKey.slice(0, 7)}-99`;

  const monthLogs = await prisma.dailyLog.findMany({
    where: {
      logicalDate: {
        gte: startKey,
        lt: endKey,
      },
    },
    orderBy: { logicalDate: 'asc' },
  });

  const initialEntry = monthLogs.find(
    (entry) => normalizeLogicalDate(entry.logicalDate) === selectedDateKey,
  );

  const initialLog = initialEntry
    ? {
        dateKey: normalizeLogicalDate(initialEntry.logicalDate),
        mood: initialEntry.mood,
        sleepQuality: initialEntry.sleepQuality,
        energyLevel: initialEntry.energyLevel,
        primaryActivities: Array.isArray(initialEntry.primaryActivities)
          ? (initialEntry.primaryActivities as string[])
          : [],
        mentalWorldActivities: parseMentalWorld(initialEntry.mentalWorldActivities),
        dailyLifeActivities: parseDailyLife(initialEntry.dailyLifeActivities),
        newsEntries: normalizeSavedNewsEntries(initialEntry.newsEntries),
        notes: initialEntry.notes,
      }
    : null;

  const initialLoggedDates = monthLogs.map((entry) => normalizeLogicalDate(entry.logicalDate));

  return (
    <LoggingTab
      initialLog={initialLog}
      initialLoggedDates={initialLoggedDates}
      initialSelectedDate={selectedDateKey}
    />
  );
}
