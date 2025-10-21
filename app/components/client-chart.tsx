'use client';

import * as React from 'react';
import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell } from 'recharts';

export type MetricLog = {
  logicalDate: string;
  mood: number;
  sleepQuality: number;
  energyLevel: number;
};

type ClientChartProps = {
  data: MetricLog[];
  locale: 'zh' | 'en';
};

const SCORE_COLORS = ['#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#2563eb'];

const CARD_BG = ['bg-blue-50/40', 'bg-fuchsia-50/40', 'bg-emerald-50/40'];

const useMediaQuery = (query: string) => {
  const [matches, setMatches] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.matchMedia(query).matches;
  });

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia(query);
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);

    // Ensure state is in sync on mount
    setMatches(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }

    // Safari fallback
    mediaQuery.addListener(handler);
    return () => mediaQuery.removeListener(handler);
  }, [query]);

  return matches;
};

export function ClientChart({ data, locale }: ClientChartProps) {
  const isZh = locale === 'zh';
  const isWide = useMediaQuery('(min-width: 890px)');
  const containerClass = isWide ? 'grid grid-cols-3 gap-4' : 'flex flex-col gap-4';
  const heading = isZh
    ? '情绪 / 睡眠 / 精力 分布'
    : 'Mood / Sleep / Energy Distribution';
  const description = isZh
    ? '展示分数段的比例，左侧饼图、右侧说明，快速了解整体趋势。'
    : 'See the distribution of scores across mood, sleep, and energy at a glance.';
  const METRICS = isZh
    ? [
        { key: 'mood', label: '心情' },
        { key: 'sleepQuality', label: '睡眠质量' },
        { key: 'energyLevel', label: '精力' },
      ]
    : [
        { key: 'mood', label: 'Mood' },
        { key: 'sleepQuality', label: 'Sleep Quality' },
        { key: 'energyLevel', label: 'Energy' },
      ];
  const SCORE_LABELS: Record<number, string> = isZh
    ? {
        1: '1 分',
        2: '2 分',
        3: '3 分',
        4: '4 分',
        5: '5 分',
      }
    : {
        1: 'Score 1',
        2: 'Score 2',
        3: 'Score 3',
        4: 'Score 4',
        5: 'Score 5',
      };

  if (!data.length) {
    return (
      <div className="flex h-48 items-center justify-center rounded-md border border-dashed border-[color:var(--border)] bg-[var(--surface)] text-sm text-[var(--muted-foreground)]">
        {isZh ? '暂无数据，填写日记后可查看分布。' : 'No data yet—log your day to see the distribution.'}
      </div>
    );
  }

  const distributions = METRICS.map((metric) => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<number, number>;
    data.forEach((entry) => {
      const value = entry[metric.key];
      if (value >= 1 && value <= 5) {
        counts[value] += 1;
      }
    });
    const total = Math.max(1, data.length);
    const chartData = Object.entries(counts).map(([score, count]) => ({
      score: Number(score),
      count,
      percentage: count / total,
    }));

    return {
      key: metric.key,
      label: metric.label,
      chartData,
      total,
    };
  });

  return (
    <section className="rounded-2xl border border-[color:var(--border)] bg-[var(--surface)] p-6 shadow-sm">
      <header className="mb-4">
        <h2 className="text-lg font-semibold">{heading}</h2>
        <p className="text-xs text-[var(--muted-foreground)]">{description}</p>
      </header>

      <div className={containerClass}>
        {distributions.map((metric, metricIndex) => (
          <div
            key={metric.key}
            className={`flex items-stretch gap-3 rounded-xl border border-[color:var(--border)] bg-[var(--surface-raised)] p-3 shadow-sm ${CARD_BG[metricIndex % CARD_BG.length]} ${isWide ? 'min-w-0' : ''}`}
          >
            <div className="flex shrink-0 items-center justify-center">
              <div className="h-24 w-24 shrink-0 sm:h-28 sm:w-28">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metric.chartData}
                      dataKey="count"
                      nameKey="score"
                      innerRadius="45%"
                      outerRadius="80%"
                      paddingAngle={2}
                    >
                      {metric.chartData.map((entry) => (
                        <Cell
                          key={`${metric.key}-${entry.score}`}
                          fill={SCORE_COLORS[entry.score - 1]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        `${value} 次 (${((value as number) / metric.total * 100).toFixed(1)}%)`,
                        `${name} 分`,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="flex flex-1 flex-col justify-between">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">
                {metric.label}
              </h3>
              <ul className="mt-2 space-y-1 text-[11px] text-[var(--muted-foreground)]">
                {metric.chartData.map((entry) => (
                  <li
                    key={`${metric.key}-legend-${entry.score}`}
                    className="flex items-center justify-between rounded-lg bg-white/30 px-2.5 py-1"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: SCORE_COLORS[entry.score - 1] }}
                      />
                      {SCORE_LABELS[entry.score]}
                    </span>
                    <span className="font-medium text-[var(--foreground)]">
                      {(entry.percentage * 100).toFixed(1)}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
