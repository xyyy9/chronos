import { LoggingTab } from '@/app/components/logging-tab';
import { getCurrentLogicalDateKey } from '@/app/lib/date-utils';
import { normalizeSavedNewsEntries } from '@/app/lib/news';
import { prisma } from '@/app/lib/prisma';
import { getCurrentUser } from '@/app/lib/auth';
import { generateDemoMonth } from '@/app/lib/demo-data';

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
  const user = await getCurrentUser();
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

  if (!user) {
    const demo = generateDemoMonth(selectedDateKey);
    const initialLog = demo.initialLog
      ? {
          dateKey: demo.initialLog.logicalDate,
          mood: demo.initialLog.mood,
          sleepQuality: demo.initialLog.sleepQuality,
          energyLevel: demo.initialLog.energyLevel,
          primaryActivities: demo.initialLog.primaryActivities,
          mentalWorldActivities: demo.initialLog.mentalWorldActivities,
          dailyLifeActivities: demo.initialLog.dailyLifeActivities,
          newsEntries: demo.initialLog.newsEntries,
          notes: demo.initialLog.notes,
        }
      : null;

    const demoLogs = Object.fromEntries(
      demo.logs.map((log) => [
        log.logicalDate,
        {
          dateKey: log.logicalDate,
          mood: log.mood,
          sleepQuality: log.sleepQuality,
          energyLevel: log.energyLevel,
          primaryActivities: log.primaryActivities,
          mentalWorldActivities: log.mentalWorldActivities,
          dailyLifeActivities: log.dailyLifeActivities,
          newsEntries: log.newsEntries,
          notes: log.notes,
        },
      ]),
    );

    return (
      <LoggingTab
        initialLog={initialLog}
        initialLoggedDates={demo.loggedDates}
        initialSelectedDate={demo.selectedDate}
        isDemo
        demoLogs={demoLogs}
      />
    );
  }

  const monthLogs = await prisma.dailyLog.findMany({
    where: {
      userId: user.id,
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
