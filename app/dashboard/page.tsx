import { VisualizationTab } from '@/app/components/visualization-tab';
import { prisma } from '@/app/lib/prisma';
import { formatDateKey } from '@/app/lib/date-utils';
import { getCurrentUser } from '@/app/lib/auth';
import { generateDemoMonth } from '@/app/lib/demo-data';

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
  const user = await getCurrentUser();

  if (!user) {
    const demo = generateDemoMonth();
    const data: DashboardLog[] = demo.logs.map((log) => ({
      logicalDate: log.logicalDate,
      mood: log.mood,
      sleepQuality: log.sleepQuality,
      energyLevel: log.energyLevel,
      primaryActivities: log.primaryActivities,
      mentalWorldActivities: log.mentalWorldActivities,
      dailyLifeActivities: log.dailyLifeActivities,
      notes: log.notes,
    }));

    return <VisualizationTab logs={data} isDemo />;
  }

  const logs = await prisma.dailyLog.findMany({
    where: { userId: user.id },
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

    const logicalDate =
      typeof log.logicalDate === 'string'
        ? log.logicalDate
        : formatDateKey(log.logicalDate);

    return {
      logicalDate,
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
