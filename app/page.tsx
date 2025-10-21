import { LoggingTab } from '@/app/components/logging-tab';
import { prisma } from '@/app/lib/prisma';
import { getCurrentLogicalDate, formatDateKey } from '@/app/lib/date-utils';

export const dynamic = 'force-dynamic';

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
  const logicalToday = getCurrentLogicalDate();
  const selectedDateKey = formatDateKey(logicalToday);

  const startOfMonth = new Date(logicalToday);
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const endOfMonth = new Date(startOfMonth);
  endOfMonth.setMonth(endOfMonth.getMonth() + 1);

  const monthLogs = await prisma.dailyLog.findMany({
    where: {
      logicalDate: {
        gte: startOfMonth,
        lt: endOfMonth,
      },
    },
    orderBy: { logicalDate: 'asc' },
  });

  const initialEntry = monthLogs.find((entry) => {
    const key = formatDateKey(new Date(entry.logicalDate));
    return key === selectedDateKey;
  });

  const initialLog = initialEntry
    ? {
        dateKey: selectedDateKey,
        mood: initialEntry.mood,
        sleepQuality: initialEntry.sleepQuality,
        energyLevel: initialEntry.energyLevel,
        primaryActivities: Array.isArray(initialEntry.primaryActivities)
          ? (initialEntry.primaryActivities as string[])
          : [],
        mentalWorldActivities: parseMentalWorld(initialEntry.mentalWorldActivities),
        dailyLifeActivities: parseDailyLife(initialEntry.dailyLifeActivities),
        notes: initialEntry.notes,
      }
    : null;

  const initialLoggedDates = monthLogs.map((entry) =>
    formatDateKey(new Date(entry.logicalDate)),
  );

  return (
    <LoggingTab
      initialLog={initialLog}
      initialLoggedDates={initialLoggedDates}
      initialSelectedDate={selectedDateKey}
    />
  );
}
