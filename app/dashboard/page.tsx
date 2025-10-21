import { VisualizationTab } from '@/app/components/visualization-tab';
import { prisma } from '@/app/lib/prisma';

type DashboardLog = {
  logicalDate: string;
  mood: number;
  sleepQuality: number;
  energyLevel: number;
  primaryActivities: string[];
  mentalWorldActivities: Array<{ value: string; detail: string }>;
  dailyLifeActivities: string[];
  notes?: string | null;
};

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const logs = await prisma.dailyLog.findMany({
    orderBy: { logicalDate: 'asc' },
  });

  const data: DashboardLog[] = logs.map((log) => {
    const mental =
      Array.isArray(log.mentalWorldActivities) && log.mentalWorldActivities !== null
        ? (log.mentalWorldActivities as Array<{ value?: unknown; detail?: unknown }>).flatMap(
            (entry) => {
              if (
                typeof entry?.value === 'string' &&
                typeof entry?.detail === 'string' &&
                entry.value
              ) {
                return [{ value: entry.value, detail: entry.detail }];
              }
              return [];
            },
          )
        : [];

    const daily =
      Array.isArray(log.dailyLifeActivities) && log.dailyLifeActivities !== null
        ? (log.dailyLifeActivities as Array<unknown>).flatMap((entry) =>
            typeof entry === 'string' && entry ? [entry] : [],
          )
        : [];

    const primaryActivities = Array.isArray(log.primaryActivities)
      ? (log.primaryActivities as Array<unknown>).flatMap((entry) =>
          typeof entry === 'string' && entry ? [entry] : [],
        )
      : [];

    return {
      logicalDate: log.logicalDate.toISOString(),
      mood: log.mood,
      sleepQuality: log.sleepQuality,
      energyLevel: log.energyLevel,
      primaryActivities,
      mentalWorldActivities: mental,
      dailyLifeActivities: daily,
      notes: log.notes,
    };
  });

  return <VisualizationTab logs={data} />;
}
