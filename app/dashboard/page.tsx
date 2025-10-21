import { VisualizationTab } from '@/app/components/visualization-tab';
import { ChartPoint } from '@/app/components/client-chart';
import { prisma } from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const logs = await prisma.dailyLog.findMany({
    orderBy: { logicalDate: 'asc' },
  });

  const chartData: ChartPoint[] = logs.map((log) => ({
    logicalDate: log.logicalDate.toISOString(),
    mood: log.mood,
    sleepQuality: log.sleepQuality,
  }));

  return <VisualizationTab data={chartData} />;
}
