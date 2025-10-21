'use client';

import { ActivityHeatmap } from '@/app/components/activity-heatmap';
import { ClientChart, type MetricLog } from '@/app/components/client-chart';
import {
  DAILY_LIFE_OPTIONS,
  MENTAL_WORLD_OPTIONS,
  PRIMARY_ACTIVITY_OPTIONS,
} from '@/app/lib/activity-options';
import { useLocale } from '@/app/hooks/use-locale';

type VisualizationLog = {
  logicalDate: string;
  mood: number;
  sleepQuality: number;
  energyLevel: number;
  mentalWorldActivities: Array<{ value: string; detail: string }>;
  dailyLifeActivities: string[];
  primaryActivities: string[];
};

type VisualizationTabProps = {
  logs: VisualizationLog[];
};

export function VisualizationTab({ logs }: VisualizationTabProps) {
  const [locale] = useLocale();
  const isZh = locale === 'zh';

  const copy = isZh
    ? {
        heading: '仪表盘',
        subheading: '查看情绪、睡眠、精力的分数分布以及每天记录的事项。',
        primaryTitle: '主要活动',
        primaryDesc: '当天专注的主题',
        mentalTitle: '精神世界',
        mentalDesc: '点击方块查看当天记录的书 / 影 / 音等内容。',
        dailyTitle: '生活日常',
        dailyDesc: '每天完成的日常事项，可用图例筛选。',
      }
    : {
        heading: 'Dashboard',
        subheading: 'Review score distributions and the activities you tracked each day.',
        primaryTitle: 'Primary Focus',
        primaryDesc: 'What you focused on that day',
        mentalTitle: 'Mind Space',
        mentalDesc: 'Click any square to see the books / films / music you logged.',
        dailyTitle: 'Daily Life',
        dailyDesc: 'Everyday tasks completed—use the legend to filter.',
      };

  const sortedLogs = [...logs].sort((a, b) => a.logicalDate.localeCompare(b.logicalDate));

  const dateKeys = Array.from(new Set(sortedLogs.map((log) => log.logicalDate)));

  const metricData: MetricLog[] = sortedLogs.map((log) => ({
    logicalDate: log.logicalDate,
    mood: log.mood,
    sleepQuality: log.sleepQuality,
    energyLevel: log.energyLevel,
  }));

  const mentalOccurrences = sortedLogs
    .map((log) => ({
      logicalDate: log.logicalDate,
      categories: log.mentalWorldActivities.map((entry) => ({
        value: entry.value,
        detail: entry.detail,
      })),
    }))
    .filter((occurrence) => occurrence.categories.length > 0);

  const dailyOccurrences = sortedLogs
    .map((log) => ({
      logicalDate: log.logicalDate,
      categories: log.dailyLifeActivities.map((value) => ({ value })),
    }))
    .filter((occurrence) => occurrence.categories.length > 0);

  const primaryOccurrences = sortedLogs
    .map((log) => ({
      logicalDate: log.logicalDate,
      categories: log.primaryActivities.map((value) => ({ value })),
    }))
    .filter((occurrence) => occurrence.categories.length > 0);

  return (
    <div className="pb-32 text-[var(--foreground)]">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-8">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">{copy.heading}</h1>
          <p className="text-sm text-[var(--muted-foreground)]">{copy.subheading}</p>
        </header>

        <ClientChart data={metricData} locale={locale} />

        <ActivityHeatmap
          title={copy.primaryTitle}
          description={copy.primaryDesc}
          categories={PRIMARY_ACTIVITY_OPTIONS.map(({ value, label, labelEn, color }) => ({
            value,
            label: isZh ? label : labelEn,
            color,
          }))}
          occurrences={primaryOccurrences}
          timelineDateKeys={dateKeys}
        />

        <ActivityHeatmap
          title={copy.mentalTitle}
          description={copy.mentalDesc}
          categories={MENTAL_WORLD_OPTIONS.map(({ value, label, labelEn, color }) => ({
            value,
            label: isZh ? label : labelEn,
            color,
          }))}
          occurrences={mentalOccurrences}
          timelineDateKeys={dateKeys}
          enableDetailPanel
          detailLocale={isZh ? 'zh-CN' : 'en-US'}
        />

        <ActivityHeatmap
          title={copy.dailyTitle}
          description={copy.dailyDesc}
          categories={DAILY_LIFE_OPTIONS.map(({ value, label, labelEn, color }) => ({
            value,
            label: isZh ? label : labelEn,
            color,
          }))}
          occurrences={dailyOccurrences}
          timelineDateKeys={dateKeys}
        />
      </div>
    </div>
  );
}
